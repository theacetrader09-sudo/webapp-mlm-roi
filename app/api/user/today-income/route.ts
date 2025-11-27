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
    const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const endOfToday = new Date(startOfToday);
    endOfToday.setUTCDate(endOfToday.getUTCDate() + 1);

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

    // Convert Decimal to number
    const convertToNumber = (value: any): number => {
      if (typeof value === 'number') return value;
      if (typeof value === 'object' && value !== null) {
        if ('toNumber' in value) return value.toNumber();
        if ('toString' in value) return parseFloat(value.toString());
      }
      return parseFloat(String(value)) || 0;
    };

    const todayROI = roiEarnings.reduce((sum, e) => sum + convertToNumber(e.amount), 0);
    const todayReferral = referralEarnings.reduce((sum, e) => sum + convertToNumber(e.amount), 0);
    const todayTotal = todayROI + todayReferral;

    return NextResponse.json({
      todayROI: Number(todayROI.toFixed(2)),
      todayReferral: Number(todayReferral.toFixed(2)),
      todayTotal: Number(todayTotal.toFixed(2)),
    });
  } catch (error) {
    console.error('Error fetching today income:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

