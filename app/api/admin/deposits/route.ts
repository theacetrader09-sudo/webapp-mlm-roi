import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { DepositStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status'); // PENDING, APPROVED, REJECTED

    const where: { status?: DepositStatus } = {};
    if (status && ['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
      where.status = status as DepositStatus;
    }

    const deposits = await prisma.deposit.findMany({
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
          },
        },
      },
    });

    // Convert Decimal to number
    const depositsWithNumbers = deposits.map((deposit) => ({
      id: deposit.id,
      userId: deposit.userId,
      amount: typeof deposit.amount === 'object' && 'toNumber' in deposit.amount
        ? deposit.amount.toNumber()
        : Number(deposit.amount),
      txHash: deposit.txHash,
      status: deposit.status,
      adminNote: deposit.adminNote,
      createdAt: deposit.createdAt.toISOString(),
      user: deposit.user,
    }));

    return NextResponse.json({
      success: true,
      deposits: depositsWithNumbers,
      count: depositsWithNumbers.length,
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

    console.error('Error fetching deposits:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

