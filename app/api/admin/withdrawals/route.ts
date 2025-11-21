import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { WithdrawalStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status'); // PENDING, APPROVED, REJECTED

    const where: { status?: WithdrawalStatus } = {};
    if (status && ['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
      where.status = status as WithdrawalStatus;
    }

    const withdrawals = await prisma.withdrawal.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            referralCode: true,
            wallet: {
              select: {
                id: true,
                balance: true,
              },
            },
          },
        },
      },
    });

    // Convert Decimal to number
    const withdrawalsWithNumbers = withdrawals.map((withdrawal) => ({
      id: withdrawal.id,
      userId: withdrawal.userId,
      amount: typeof withdrawal.amount === 'object' && 'toNumber' in withdrawal.amount
        ? withdrawal.amount.toNumber()
        : Number(withdrawal.amount),
      walletBefore: typeof withdrawal.walletBefore === 'object' && 'toNumber' in withdrawal.walletBefore
        ? withdrawal.walletBefore.toNumber()
        : Number(withdrawal.walletBefore),
      walletAfter: typeof withdrawal.walletAfter === 'object' && 'toNumber' in withdrawal.walletAfter
        ? withdrawal.walletAfter.toNumber()
        : Number(withdrawal.walletAfter),
      status: withdrawal.status,
      adminNote: withdrawal.adminNote,
      txReference: withdrawal.txReference,
      createdAt: withdrawal.createdAt.toISOString(),
      updatedAt: withdrawal.updatedAt.toISOString(),
      user: {
        ...withdrawal.user,
        wallet: withdrawal.user.wallet
          ? {
              ...withdrawal.user.wallet,
              balance: withdrawal.user.wallet.balance,
            }
          : null,
      },
    }));

    return NextResponse.json({
      success: true,
      withdrawals: withdrawalsWithNumbers,
      count: withdrawalsWithNumbers.length,
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

    console.error('Error fetching withdrawals:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

