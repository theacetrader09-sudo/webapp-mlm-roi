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
    const query = searchParams.get('q') || '';

    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        users: [],
      });
    }

    // Get all downline users (users referred by current user or their downline)
    const downlineUsers = new Set<string>();
    let currentLevel = [user.referralCode];
    const processed = new Set<string>();

    while (currentLevel.length > 0 && downlineUsers.size < 50) {
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
          downlineUsers.add(referral.id);
          nextLevel.push(referral.referralCode);
        }
      }

      currentLevel = nextLevel;
    }

    // Search users in downline
    const users = await prisma.user.findMany({
      where: {
        id: {
          in: Array.from(downlineUsers),
        },
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { referralCode: { contains: query.toUpperCase(), mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        referralCode: true,
      },
      take: 10,
    });

    return NextResponse.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

