import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { amount, txHash } = body;

    // Validation
    if (!amount || !txHash) {
      return NextResponse.json(
        { error: 'Amount and transaction hash are required' },
        { status: 400 }
      );
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    if (typeof txHash !== 'string' || txHash.length < 20) {
      return NextResponse.json(
        { error: 'Transaction hash must be at least 20 characters' },
        { status: 400 }
      );
    }

    // Check if txHash already exists (prevent duplicates)
    const existingDeposit = await prisma.deposit.findFirst({
      where: { txHash },
    });

    if (existingDeposit) {
      return NextResponse.json(
        { error: 'This transaction hash has already been submitted' },
        { status: 400 }
      );
    }

    // Create deposit
    const deposit = await prisma.deposit.create({
      data: {
        userId: user.id,
        amount: new Decimal(numAmount),
        txHash: txHash.trim(),
        status: 'PENDING',
      },
    });

    return NextResponse.json(
      {
        success: true,
        deposit: {
          id: deposit.id,
          amount: deposit.amount.toNumber(),
          txHash: deposit.txHash,
          status: deposit.status,
          createdAt: deposit.createdAt,
        },
        message: 'Deposit request submitted successfully. Awaiting admin approval.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating deposit:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

