import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';
import { Decimal } from '@prisma/client/runtime/library';

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { id, adminNote, txReference } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Withdrawal ID is required' },
        { status: 400 }
      );
    }

    // Process in transaction for atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Re-fetch withdrawal with user and wallet for consistency
      const withdrawal = await tx.withdrawal.findUnique({
        where: { id },
        include: {
          user: {
            include: {
              wallet: true,
            },
          },
        },
      });

      if (!withdrawal) {
        throw new Error('Withdrawal not found');
      }

      if (withdrawal.status !== 'PENDING') {
        throw new Error(`Withdrawal is already ${withdrawal.status}`);
      }

      // Ensure wallet exists - create if it doesn't
      let wallet = withdrawal.user.wallet;
      if (!wallet) {
        wallet = await tx.wallet.create({
          data: {
            userId: withdrawal.userId,
            balance: new Decimal(0),
            depositBalance: new Decimal(0),
            roiTotal: new Decimal(0),
            referralTotal: new Decimal(0),
          },
        });
      }

      const withdrawalAmount = new Decimal(withdrawal.amount);
      const currentBalance = new Decimal(wallet.balance);

      // Re-check balance inside transaction
      if (currentBalance.lessThan(withdrawalAmount)) {
        throw new Error('Insufficient wallet balance');
      }

      const beforeBalance = currentBalance;
      const afterBalance = currentBalance.sub(withdrawalAmount);

      // Decrement wallet balance
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: {
            decrement: withdrawalAmount,
          },
        },
      });

      // Update withdrawal
      const updatedWithdrawal = await tx.withdrawal.update({
        where: { id },
        data: {
          status: 'APPROVED',
          walletAfter: afterBalance,
          adminNote: adminNote || null,
          txReference: txReference || null,
        },
      });

      // Create audit log
      await createAuditLog({
        userId: withdrawal.userId,
        action: 'WITHDRAW_APPROVE',
        amount: withdrawalAmount,
        before: beforeBalance,
        after: updatedWallet.balance,
        meta: {
          withdrawalId: withdrawal.id,
          txReference: txReference || null,
          adminNote: adminNote || null,
        },
      });

      return {
        withdrawal: updatedWithdrawal,
        wallet: updatedWallet,
      };
    });

    // Convert Decimal to number for response
    const withdrawalResponse = {
      id: result.withdrawal.id,
      amount: typeof result.withdrawal.amount === 'object' && 'toNumber' in result.withdrawal.amount
        ? result.withdrawal.amount.toNumber()
        : Number(result.withdrawal.amount),
      walletBefore: typeof result.withdrawal.walletBefore === 'object' && 'toNumber' in result.withdrawal.walletBefore
        ? result.withdrawal.walletBefore.toNumber()
        : Number(result.withdrawal.walletBefore),
      walletAfter: typeof result.withdrawal.walletAfter === 'object' && 'toNumber' in result.withdrawal.walletAfter
        ? result.withdrawal.walletAfter.toNumber()
        : Number(result.withdrawal.walletAfter),
      status: result.withdrawal.status,
      adminNote: result.withdrawal.adminNote,
      txReference: result.withdrawal.txReference,
      createdAt: result.withdrawal.createdAt.toISOString(),
      updatedAt: result.withdrawal.updatedAt.toISOString(),
    };

    return NextResponse.json({
      success: true,
      withdrawal: withdrawalResponse,
      message: 'Withdrawal approved and funds deducted from wallet',
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Unauthorized' || error.message.includes('Forbidden')) {
        return NextResponse.json(
          { error: error.message },
          { status: error.message === 'Unauthorized' ? 401 : 403 }
        );
      }

      // Handle transaction errors
      if (error.message.includes('not found') || error.message.includes('already') || error.message.includes('Insufficient')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }

    console.error('Error approving withdrawal:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

