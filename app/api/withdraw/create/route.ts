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
    const { amount } = body;

    // Validation
    if (!amount || typeof amount !== 'number') {
      return NextResponse.json(
        { error: 'Amount is required and must be a number' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Get user with wallet, create wallet if it doesn't exist
    const userWithWallet = await prisma.user.findUnique({
      where: { id: user.id },
      include: { wallet: true },
    });

    if (!userWithWallet) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Create wallet if it doesn't exist
    let wallet = userWithWallet.wallet;
    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId: user.id,
          balance: 0,
          depositBalance: 0,
          roiTotal: 0,
          referralTotal: 0,
        },
      });
    }

    const currentBalance = Number(wallet.balance);
    const withdrawalAmount = new Decimal(amount);

    // Check sufficient balance
    if (currentBalance < amount) {
      return NextResponse.json(
        {
          error: 'Insufficient balance',
          currentBalance,
          requestedAmount: amount,
        },
        { status: 400 }
      );
    }

    // Create withdrawal
    const withdrawal = await prisma.withdrawal.create({
      data: {
        userId: user.id,
        amount: withdrawalAmount,
        walletBefore: new Decimal(currentBalance),
        walletAfter: new Decimal(currentBalance), // Will be updated on approval
        status: 'PENDING',
      },
    });

    return NextResponse.json(
      {
        success: true,
        withdrawal: {
          id: withdrawal.id,
          amount: withdrawal.amount.toNumber(),
          walletBefore: withdrawal.walletBefore.toNumber(),
          walletAfter: withdrawal.walletAfter.toNumber(),
          status: withdrawal.status,
          createdAt: withdrawal.createdAt,
        },
        message: 'Withdrawal request submitted successfully. Awaiting admin approval.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating withdrawal:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

