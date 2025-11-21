import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const refCode = searchParams.get('refCode');

    if (!refCode) {
      return NextResponse.json(
        { error: 'Referral code is required' },
        { status: 400 }
      );
    }

    // Find the referred user
    const referredUser = await prisma.user.findFirst({
      where: {
        referralCode: refCode.toUpperCase(),
      },
      select: {
        id: true,
      },
    });

    if (!referredUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Note: We calculate daily commission directly from investments instead of earnings

    // Get referred user's investments to calculate daily ROI
    const investments = await prisma.investment.findMany({
      where: {
        userId: referredUser.id,
        isActive: true,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        amount: true,
        dailyROI: true,
        packageName: true,
      },
    });

    // Calculate expected daily commission from each investment
    const details = investments.map((investment) => {
      const dailyROI = typeof investment.dailyROI === 'object' && 'toNumber' in investment.dailyROI
        ? investment.dailyROI.toNumber()
        : Number(investment.dailyROI);
      
      const dailyROIAmount = (investment.amount * dailyROI) / 100;
      // Level 1 commission is 10% of ROI
      const dailyCommission = (dailyROIAmount * 10) / 100;

      return {
        investmentId: investment.id,
        investmentAmount: investment.amount,
        packageName: investment.packageName,
        dailyROI: dailyROI,
        dailyROIAmount: dailyROIAmount,
        dailyCommission: dailyCommission,
        percent: 10, // Level 1
      };
    });

    return NextResponse.json({
      details,
      totalDailyCommission: details.reduce((sum, d) => sum + d.dailyCommission, 0),
    });
  } catch (error) {
    console.error('Error fetching referral daily details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

