import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { getStartOfDayUTC } from '@/lib/roi-processor';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const searchParams = request.nextUrl.searchParams;
    const dateParam = searchParams.get('date');

    let targetDate: Date;
    if (dateParam) {
      targetDate = new Date(dateParam);
      if (isNaN(targetDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date format. Use YYYY-MM-DD' },
          { status: 400 }
        );
      }
    } else {
      // Default to yesterday
      targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - 1);
    }

    const dateStart = getStartOfDayUTC(targetDate);
    const dateEnd = new Date(dateStart);
    dateEnd.setUTCDate(dateEnd.getUTCDate() + 1);

    // Get ROI earnings for the date
    const roiEarnings = await prisma.earnings.findMany({
      where: {
        type: 'roi',
        createdAt: {
          gte: dateStart,
          lt: dateEnd,
        },
      },
      select: {
        amount: true,
        userId: true,
      },
    });

    // Get referral earnings for the date
    const referralEarnings = await prisma.earnings.findMany({
      where: {
        type: 'referral',
        createdAt: {
          gte: dateStart,
          lt: dateEnd,
        },
      },
      select: {
        amount: true,
        userId: true,
      },
    });

    // Calculate totals
    const totalRoiPaid = roiEarnings.reduce((sum, e) => sum + e.amount, 0);
    const totalReferralPaid = referralEarnings.reduce((sum, e) => sum + e.amount, 0);

    // Get top 10 users by referral earnings
    const referralByUser = new Map<string, number>();
    referralEarnings.forEach((earning) => {
      const current = referralByUser.get(earning.userId) || 0;
      referralByUser.set(earning.userId, current + earning.amount);
    });

    const topReferralEarners = Array.from(referralByUser.entries())
      .map(([userId, amount]) => ({ userId, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    // Get user details for top earners
    const userIds = topReferralEarners.map((e) => e.userId);
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds },
      },
      select: {
        id: true,
        name: true,
        email: true,
        referralCode: true,
      },
    });

    const topEarnersWithDetails = topReferralEarners.map((earner) => {
      const user = users.find((u) => u.id === earner.userId);
      return {
        userId: earner.userId,
        amount: earner.amount,
        user: user
          ? {
              name: user.name,
              email: user.email,
              referralCode: user.referralCode,
            }
          : null,
      };
    });

    // Count investments processed
    const investmentsProcessed = await prisma.investment.count({
      where: {
        lastRoiAt: {
          gte: dateStart,
          lt: dateEnd,
        },
      },
    });

    return NextResponse.json({
      success: true,
      date: dateStart.toISOString().split('T')[0],
      summary: {
        investmentsProcessed,
        totalRoiPaid,
        totalReferralPaid,
        totalEarnings: totalRoiPaid + totalReferralPaid,
        roiEarningsCount: roiEarnings.length,
        referralEarningsCount: referralEarnings.length,
      },
      topReferralEarners: topEarnersWithDetails,
    });
  } catch (error) {
    console.error('Error generating daily summary:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

