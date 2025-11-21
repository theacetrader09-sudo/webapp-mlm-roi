import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';
import { getPackageByAmount, validateInvestmentAmount } from '@/lib/package-assignment';
import { Decimal } from '@prisma/client/runtime/library';

export async function POST(request: NextRequest) {
  try {
    // a) Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { amount } = body;

    if (amount === undefined) {
      return NextResponse.json(
        { error: 'amount is required' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Validate amount and get package info
    const validation = validateInvestmentAmount(amount);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const packageInfo = getPackageByAmount(amount);
    if (!packageInfo) {
      return NextResponse.json(
        { error: 'Invalid investment amount' },
        { status: 400 }
      );
    }

    // d) Load user's Wallet with transaction lock and check balance
    // Use a transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Get wallet with lock (FOR UPDATE equivalent in Prisma)
      let wallet = await tx.wallet.findUnique({
        where: { userId: user.id },
      });

      // Create wallet if it doesn't exist
      if (!wallet) {
        wallet = await tx.wallet.create({
          data: {
            userId: user.id,
            balance: 0,
            depositBalance: 0,
            roiTotal: 0,
            referralTotal: 0,
          },
        });
      }

      // Check deposit balance (not main balance)
      const depositBalance = wallet.depositBalance || 0;
      if (depositBalance < amount) {
        throw new Error('Insufficient deposit balance. Please deposit funds first.');
      }

      // Create investment with package info
      const investment = await tx.investment.create({
        data: {
          userId: user.id,
          walletId: wallet.id,
          packageId: null, // No longer using Package model
          packageName: packageInfo.name,
          amount,
          dailyROI: new Decimal(packageInfo.dailyROI),
          startDate: new Date(),
          isActive: true,
          status: 'ACTIVE',
        },
      });

      // Reserve funds: subtract from deposit balance
      const beforeDepositBalance = wallet.depositBalance || 0;
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          depositBalance: {
            decrement: amount,
          },
        },
      });

      // Audit log for investment creation
      await createAuditLog({
        userId: user.id,
        action: 'INVESTMENT_CREATED',
        amount: amount,
        before: beforeDepositBalance,
        after: updatedWallet.depositBalance || 0,
        meta: {
          investmentId: investment.id,
          packageName: packageInfo.name,
          dailyROI: packageInfo.dailyROI,
          walletType: 'deposit',
        },
      });

      return { investment, wallet: updatedWallet };
    });

    // Fetch the investment for response
    const investmentWithDetails = await prisma.investment.findUnique({
      where: { id: result.investment.id },
    });

    return NextResponse.json(
      {
        success: true,
        investment: {
          ...investmentWithDetails,
          dailyROI: investmentWithDetails?.dailyROI.toNumber(),
        },
        message: 'Investment created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Insufficient balance') {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
      if (error.message === 'Wallet not found') {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }
    }

    console.error('Error creating investment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
