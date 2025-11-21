import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { referralCode: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role && (role === 'USER' || role === 'ADMIN')) {
      where.role = role;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          wallet: {
            select: {
              balance: true,
              depositBalance: true,
              roiTotal: true,
              referralTotal: true,
            },
          },
          _count: {
            select: {
              investments: true,
              deposits: true,
              withdrawals: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const usersWithNumbers = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      referralCode: user.referralCode,
      referredBy: user.referredBy,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      wallet: user.wallet
        ? {
            balance: user.wallet.balance,
            depositBalance: user.wallet.depositBalance,
            roiTotal: user.wallet.roiTotal,
            referralTotal: user.wallet.referralTotal,
          }
        : null,
      counts: user._count,
    }));

    return NextResponse.json({
      success: true,
      users: usersWithNumbers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Unauthorized' || error.message.includes('Forbidden')) {
        return NextResponse.json(
          { error: error.message },
          { status: error.message === 'Unauthorized' ? 401 : 403 }
        );
      }
    }

    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

