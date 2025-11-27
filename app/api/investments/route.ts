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

    // Get active investments
    const investments = await prisma.investment.findMany({
      where: {
        userId: user.id,
        status: 'ACTIVE',
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        amount: true,
        packageName: true,
        dailyROI: true,
        status: true,
        startDate: true,
        createdAt: true,
        updatedAt: true,
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

    // Convert Decimal to number for JSON response
    const investmentsWithNumbers = investments.map((inv) => ({
      ...inv,
      amount: convertToNumber(inv.amount),
      dailyROI: convertToNumber(inv.dailyROI),
    }));

    return NextResponse.json({
      investments: investmentsWithNumbers,
      count: investmentsWithNumbers.length,
    });
  } catch (error) {
    console.error('Error fetching investments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

