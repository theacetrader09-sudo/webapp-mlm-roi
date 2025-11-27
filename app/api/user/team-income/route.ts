import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all referral earnings (total team income)
    const referralEarnings = await prisma.earnings.findMany({
      where: {
        userId: user.id,
        type: 'referral',
      },
      select: {
        amount: true,
        createdAt: true,
        description: true,
      },
      orderBy: {
        createdAt: 'desc',
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

    const totalTeamIncome = referralEarnings.reduce((sum, e) => sum + convertToNumber(e.amount), 0);

    // Get today's team income (UTC)
    const now = new Date();
    const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const endOfToday = new Date(startOfToday);
    endOfToday.setUTCDate(endOfToday.getUTCDate() + 1);

    const todayTeamIncome = referralEarnings
      .filter((e) => {
        const createdAt = new Date(e.createdAt);
        return createdAt >= startOfToday && createdAt < endOfToday;
      })
      .reduce((sum, e) => sum + convertToNumber(e.amount), 0);

    return NextResponse.json({
      totalTeamIncome: Number(totalTeamIncome.toFixed(2)),
      todayTeamIncome: Number(todayTeamIncome.toFixed(2)),
      totalTransactions: referralEarnings.length,
    });
  } catch (error) {
    console.error('Error fetching team income:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

