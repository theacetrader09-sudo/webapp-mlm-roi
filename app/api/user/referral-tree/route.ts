import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface TeamMember {
  id: string;
  name: string | null;
  email: string;
  referralCode: string;
  createdAt: Date;
  level: number;
  parentReferralCode: string | null;
  totalInvestment: number;
  totalEarningsGenerated: number;
  activeInvestments: number;
  isActive: boolean;
  children?: TeamMember[];
}

async function buildReferralTree(
  userReferralCode: string,
  maxLevels: number = 10,
  currentLevel: number = 1,
  parentRefCode: string | null = null,
  referrerUserId: string
): Promise<TeamMember[]> {
  if (currentLevel > maxLevels) {
    return [];
  }

  const referrals = await prisma.user.findMany({
    where: {
      referredBy: parentRefCode || userReferralCode,
    },
    select: {
      id: true,
      name: true,
      email: true,
      referralCode: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const teamMembers: TeamMember[] = await Promise.all(
    referrals.map(async (user) => {
      // Get user's investments
      const investments = await prisma.investment.findMany({
        where: {
          userId: user.id,
          isActive: true,
          status: 'ACTIVE',
        },
        select: {
          amount: true,
          dailyROI: true,
        },
      });

      const totalInvestment = investments.reduce((sum, inv) => sum + inv.amount, 0);
      const activeInvestments = investments.length;

      // Calculate earnings generated for the referrer from this user
      // Get all referral earnings where description contains this user's referral code
      const earnings = await prisma.earnings.findMany({
        where: {
          userId: referrerUserId, // The referrer's user ID
          type: 'referral',
          description: {
            contains: user.referralCode,
          },
        },
        select: {
          amount: true,
        },
      });

      const totalEarningsGenerated = earnings.reduce((sum, e) => sum + e.amount, 0);

      // Recursively get children
      const children = await buildReferralTree(
        userReferralCode,
        maxLevels,
        currentLevel + 1,
        user.referralCode,
        referrerUserId
      );

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        referralCode: user.referralCode,
        createdAt: user.createdAt,
        level: currentLevel,
        parentReferralCode: parentRefCode || userReferralCode,
        totalInvestment,
        totalEarningsGenerated,
        activeInvestments,
        isActive: activeInvestments > 0,
        children: children.length > 0 ? children : undefined,
      };
    })
  );

  return teamMembers;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const maxLevels = parseInt(searchParams.get('maxLevels') || '10', 10);

    const tree = await buildReferralTree(user.referralCode, maxLevels, 1, null, user.id);

    // Calculate level statistics
    const levelStats = new Map<number, {
      totalUsers: number;
      totalInvestments: number;
      totalEarnings: number;
      activeUsers: number;
    }>();

    const calculateStats = (members: TeamMember[]) => {
      for (const member of members) {
        const level = member.level;
        const current = levelStats.get(level) || {
          totalUsers: 0,
          totalInvestments: 0,
          totalEarnings: 0,
          activeUsers: 0,
        };

        current.totalUsers += 1;
        current.totalInvestments += member.totalInvestment;
        current.totalEarnings += member.totalEarningsGenerated;
        if (member.isActive) {
          current.activeUsers += 1;
        }

        levelStats.set(level, current);

        if (member.children) {
          calculateStats(member.children);
        }
      }
    };

    calculateStats(tree);

    return NextResponse.json({
      tree,
      levelStatistics: Object.fromEntries(levelStats),
      totalLevels: Math.max(...Array.from(levelStats.keys()), 0),
    });
  } catch (error) {
    console.error('Error fetching referral tree:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

