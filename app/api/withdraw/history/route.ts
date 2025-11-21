import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const withdrawals = await prisma.withdrawal.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        amount: true,
        walletBefore: true,
        walletAfter: true,
        status: true,
        adminNote: true,
        txReference: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Convert Decimal to number for JSON response
    const withdrawalsWithNumbers = withdrawals.map((withdrawal) => ({
      ...withdrawal,
      amount: typeof withdrawal.amount === 'object' && 'toNumber' in withdrawal.amount
        ? withdrawal.amount.toNumber()
        : Number(withdrawal.amount),
      walletBefore: typeof withdrawal.walletBefore === 'object' && 'toNumber' in withdrawal.walletBefore
        ? withdrawal.walletBefore.toNumber()
        : Number(withdrawal.walletBefore),
      walletAfter: typeof withdrawal.walletAfter === 'object' && 'toNumber' in withdrawal.walletAfter
        ? withdrawal.walletAfter.toNumber()
        : Number(withdrawal.walletAfter),
      createdAt: withdrawal.createdAt.toISOString(),
      updatedAt: withdrawal.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      withdrawals: withdrawalsWithNumbers,
      count: withdrawalsWithNumbers.length,
    });
  } catch (error) {
    console.error('Error fetching withdrawal history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

