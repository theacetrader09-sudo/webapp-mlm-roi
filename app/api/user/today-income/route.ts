import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get start and end of today (UTC)
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);

    // Get today's ROI earnings
    const roiEarnings = await prisma.earnings.findMany({
      where: {
        userId: user.id,
        type: 'roi',
        createdAt: {
          gte: startOfToday,
          lt: endOfToday,
        },
      },
      select: {
        amount: true,
      },
    });

    // Get today's referral earnings
    const referralEarnings = await prisma.earnings.findMany({
      where: {
        userId: user.id,
        type: 'referral',
        createdAt: {
          gte: startOfToday,
          lt: endOfToday,
        },
      },
      select: {
        amount: true,
      },
    });

    const todayROI = roiEarnings.reduce((sum, e) => sum + e.amount, 0);
    const todayReferral = referralEarnings.reduce((sum, e) => sum + e.amount, 0);
    const todayTotal = todayROI + todayReferral;

    return NextResponse.json({
      todayROI,
      todayReferral,
      todayTotal,
    });
  } catch (error) {
    console.error('Error fetching today income:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

