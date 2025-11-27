import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get earnings for the user
    const earnings = await prisma.earnings.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
      select: {
        id: true,
        amount: true,
        type: true,
        description: true,
        createdAt: true,
      },
    });

    const total = await prisma.earnings.count({
      where: {
        userId: user.id,
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

    return NextResponse.json({
      earnings: earnings.map((earning) => ({
        ...earning,
        amount: convertToNumber(earning.amount),
        createdAt: earning.createdAt.toISOString(),
      })),
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching earnings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

