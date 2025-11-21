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
        { error: 'Withdrawal ID is required' },
        { status: 400 }
      );
    }

    // Get withdrawal
    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!withdrawal) {
      return NextResponse.json(
        { error: 'Withdrawal not found' },
        { status: 404 }
      );
    }

    if (withdrawal.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Withdrawal is already ${withdrawal.status}` },
        { status: 400 }
      );
    }

    const withdrawalAmount = typeof withdrawal.amount === 'object' && 'toNumber' in withdrawal.amount
      ? withdrawal.amount.toNumber()
      : Number(withdrawal.amount);

    // Update withdrawal status
    const updatedWithdrawal = await prisma.withdrawal.update({
      where: { id },
      data: {
        status: 'REJECTED',
        adminNote: adminNote || null,
      },
    });

    // Create audit log
    await createAuditLog({
      userId: withdrawal.userId,
      action: 'WITHDRAW_REJECT',
      amount: withdrawalAmount,
      meta: {
        withdrawalId: withdrawal.id,
        adminNote: adminNote || null,
      },
    });

    // Convert Decimal to number for response
    const withdrawalResponse = {
      id: updatedWithdrawal.id,
      amount: typeof updatedWithdrawal.amount === 'object' && 'toNumber' in updatedWithdrawal.amount
        ? updatedWithdrawal.amount.toNumber()
        : Number(updatedWithdrawal.amount),
      walletBefore: typeof updatedWithdrawal.walletBefore === 'object' && 'toNumber' in updatedWithdrawal.walletBefore
        ? updatedWithdrawal.walletBefore.toNumber()
        : Number(updatedWithdrawal.walletBefore),
      walletAfter: typeof updatedWithdrawal.walletAfter === 'object' && 'toNumber' in updatedWithdrawal.walletAfter
        ? updatedWithdrawal.walletAfter.toNumber()
        : Number(updatedWithdrawal.walletAfter),
      status: updatedWithdrawal.status,
      adminNote: updatedWithdrawal.adminNote,
      txReference: updatedWithdrawal.txReference,
      createdAt: updatedWithdrawal.createdAt.toISOString(),
      updatedAt: updatedWithdrawal.updatedAt.toISOString(),
    };

    return NextResponse.json({
      success: true,
      withdrawal: withdrawalResponse,
      message: 'Withdrawal rejected',
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

    console.error('Error rejecting withdrawal:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

