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

    const deposits = await prisma.deposit.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        amount: true,
        txHash: true,
        status: true,
        adminNote: true,
        createdAt: true,
      },
    });

    // Convert Decimal to number for JSON response
    const depositsWithNumbers = deposits.map((deposit) => ({
      ...deposit,
      amount: typeof deposit.amount === 'object' && 'toNumber' in deposit.amount
        ? deposit.amount.toNumber()
        : Number(deposit.amount),
    }));

    return NextResponse.json({
      success: true,
      deposits: depositsWithNumbers,
      count: depositsWithNumbers.length,
    });
  } catch (error) {
    console.error('Error fetching deposit history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

