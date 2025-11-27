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

    // Convert Decimal to number helper
    const convertToNumber = (value: any): number => {
      if (typeof value === 'number') return value;
      if (typeof value === 'object' && value !== null) {
        if ('toNumber' in value) return value.toNumber();
        if ('toString' in value) return parseFloat(value.toString());
      }
      return parseFloat(String(value)) || 0;
    };

    // Calculate expected daily commission from each investment
    const details = investments.map((investment) => {
      const amount = convertToNumber(investment.amount);
      const dailyROI = convertToNumber(investment.dailyROI);
      
      const dailyROIAmount = (amount * dailyROI) / 100;
      // Level 1 commission is 10% of ROI
      const dailyCommission = (dailyROIAmount * 10) / 100;

      return {
        investmentId: investment.id,
        investmentAmount: amount,
        packageName: investment.packageName,
        dailyROI: dailyROI,
        dailyROIAmount: Number(dailyROIAmount.toFixed(2)),
        dailyCommission: Number(dailyCommission.toFixed(2)),
        percent: 10, // Level 1
      };
    });

    return NextResponse.json({
      details,
      totalDailyCommission: Number(details.reduce((sum, d) => sum + d.dailyCommission, 0).toFixed(2)),
    });
  } catch (error) {
    console.error('Error fetching referral daily details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

