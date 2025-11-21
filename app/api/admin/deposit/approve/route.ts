import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { id, adminNote } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Deposit ID is required' },
        { status: 400 }
      );
    }

    // Get deposit with user and wallet
    const deposit = await prisma.deposit.findUnique({
      where: { id },
      include: {
        user: {
          include: {
            wallet: true,
          },
        },
      },
    });

    if (!deposit) {
      return NextResponse.json(
        { error: 'Deposit not found' },
        { status: 404 }
      );
    }

    if (deposit.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Deposit is already ${deposit.status}` },
        { status: 400 }
      );
    }

    const depositAmount = typeof deposit.amount === 'object' && 'toNumber' in deposit.amount
      ? deposit.amount.toNumber()
      : Number(deposit.amount);

    // Update deposit and wallet in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Ensure wallet exists - create if it doesn't
      let wallet = deposit.user.wallet;
      if (!wallet) {
        wallet = await tx.wallet.create({
          data: {
            userId: deposit.userId,
            balance: 0,
            depositBalance: 0,
            roiTotal: 0,
            referralTotal: 0,
          },
        });
      }

      const beforeDepositBalance = wallet.depositBalance || 0;

      // Update deposit status
      const updatedDeposit = await tx.deposit.update({
        where: { id },
        data: {
          status: 'APPROVED',
          adminNote: adminNote || null,
        },
      });

      // Add amount to deposit wallet balance (not main balance)
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          depositBalance: {
            increment: depositAmount,
          },
        },
      });

      // Audit log
      await createAuditLog({
        userId: deposit.userId,
        action: 'DEPOSIT_APPROVED',
        amount: depositAmount,
        before: beforeDepositBalance,
        after: updatedWallet.depositBalance || 0,
        meta: {
          depositId: deposit.id,
          txHash: deposit.txHash,
          adminNote: adminNote || null,
          walletType: 'deposit',
        },
      });

      return {
        updatedDeposit,
        updatedWallet,
        beforeBalance: beforeDepositBalance,
        afterBalance: updatedWallet.depositBalance || 0,
      };
    });

    return NextResponse.json({
      success: true,
      message: `Deposit approved. $${depositAmount.toFixed(2)} added to user's deposit balance.`,
      data: {
        depositId: result.updatedDeposit.id,
        userId: deposit.userId,
        amount: depositAmount,
        walletBefore: result.beforeBalance,
        walletAfter: result.afterBalance,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Unauthorized' || error.message.includes('Forbidden')) {
        return NextResponse.json(
          { error: error.message },
          { status: error.message === 'Unauthorized' ? 401 : 403 }
        );
      }
    }

    console.error('Error approving deposit:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

