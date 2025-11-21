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

    // Get deposit
    const deposit = await prisma.deposit.findUnique({
      where: { id },
      include: {
        user: true,
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

    // Update deposit status
    await prisma.deposit.update({
      where: { id },
      data: {
        status: 'REJECTED',
        adminNote: adminNote || null,
      },
    });

    // Audit log
    await createAuditLog({
      userId: deposit.userId,
      action: 'DEPOSIT_REJECTED',
      amount: depositAmount,
      meta: {
        depositId: deposit.id,
        txHash: deposit.txHash,
        adminNote: adminNote || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Deposit rejected',
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

    console.error('Error rejecting deposit:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

