import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get direct referrals
    const directReferrals = await prisma.user.findMany({
      where: {
        referredBy: user.referralCode,
      },
      select: {
        id: true,
        referralCode: true,
      },
    });

    // Calculate total team count (all levels) using iterative approach
    const teamMembers = new Set<string>();
    let currentLevel = [user.referralCode];
    const processed = new Set<string>();

    while (currentLevel.length > 0) {
      const nextLevel: string[] = [];

      for (const refCode of currentLevel) {
        if (processed.has(refCode)) continue;
        processed.add(refCode);

        const referrals = await prisma.user.findMany({
          where: {
            referredBy: refCode,
          },
          select: {
            id: true,
            referralCode: true,
          },
        });

        for (const referral of referrals) {
          teamMembers.add(referral.id);
          nextLevel.push(referral.referralCode);
        }
      }

      currentLevel = nextLevel;
    }

    return NextResponse.json({
      directReferrals: directReferrals.length,
      teamCount: teamMembers.size,
      teamMembers: Array.from(teamMembers).slice(0, 50), // Limit for response size
    });
  } catch (error) {
    console.error('Error fetching team:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

