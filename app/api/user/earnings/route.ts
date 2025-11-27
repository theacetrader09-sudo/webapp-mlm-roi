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
    const limit = parseInt(searchParams.get('limit') || '100');
    const type = searchParams.get('type'); // 'roi' or 'referral'

    const where: any = {
      userId: user.id,
    };

    if (type && (type === 'roi' || type === 'referral')) {
      where.type = type;
    }

    const earnings = await prisma.earnings.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
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
      success: true,
      earnings: earnings.map((earning) => ({
        id: earning.id,
        amount: convertToNumber(earning.amount),
        type: earning.type,
        description: earning.description,
        createdAt: earning.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Error fetching earnings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

