import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all referral earnings with descriptions
    const referralEarnings = await prisma.earnings.findMany({
      where: {
        userId: user.id,
        type: 'referral',
      },
      select: {
        id: true,
        amount: true,
        description: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Parse descriptions to extract referral codes and group by user
    const userBreakdown = new Map<string, {
      referralCode: string;
      totalEarnings: number;
      dailyEarnings: number;
      transactions: number;
      lastEarning: Date;
    }>();

    // Get today's date range
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);

    for (const earning of referralEarnings) {
      // Extract referral code from description
      // Format: "Level X referral commission from REFCODE"
      const match = earning.description?.match(/from\s+([A-Z0-9]+)/i);
      if (match) {
        const refCode = match[1].toUpperCase();
        const existing = userBreakdown.get(refCode) || {
          referralCode: refCode,
          totalEarnings: 0,
          dailyEarnings: 0,
          transactions: 0,
          lastEarning: earning.createdAt,
        };

        existing.totalEarnings += earning.amount;
        existing.transactions += 1;

        // Check if this earning is from today
        const earningDate = new Date(earning.createdAt);
        if (earningDate >= startOfToday && earningDate < endOfToday) {
          existing.dailyEarnings += earning.amount;
        }

        if (earning.createdAt > existing.lastEarning) {
          existing.lastEarning = earning.createdAt;
        }

        userBreakdown.set(refCode, existing);
      }
    }

    // Convert map to array and sort by total earnings
    const breakdown = Array.from(userBreakdown.values())
      .sort((a, b) => b.totalEarnings - a.totalEarnings);

    // Get user details for each referral code
    const usersWithDetails = await Promise.all(
      breakdown.map(async (item) => {
        const referredUser = await prisma.user.findFirst({
          where: {
            referralCode: item.referralCode,
          },
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
        });

        return {
          ...item,
          userName: referredUser?.name || 'Unknown',
          userEmail: referredUser?.email || '',
          userId: referredUser?.id || '',
          joinedDate: referredUser?.createdAt || null,
        };
      })
    );

    return NextResponse.json({
      breakdown: usersWithDetails,
      totalUsers: usersWithDetails.length,
    });
  } catch (error) {
    console.error('Error fetching referral income breakdown:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

