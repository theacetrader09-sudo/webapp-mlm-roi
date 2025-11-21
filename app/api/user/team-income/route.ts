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

    const totalTeamIncome = referralEarnings.reduce((sum, e) => sum + e.amount, 0);

    // Get today's team income
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);

    const todayTeamIncome = referralEarnings
      .filter((e) => {
        const createdAt = new Date(e.createdAt);
        return createdAt >= startOfToday && createdAt < endOfToday;
      })
      .reduce((sum, e) => sum + e.amount, 0);

    return NextResponse.json({
      totalTeamIncome,
      todayTeamIncome,
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

