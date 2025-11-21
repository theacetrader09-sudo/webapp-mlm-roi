import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { name, description, minAmount, maxAmount, dailyROI, durationDays } = body;

    // Validation
    if (!name || minAmount === undefined || maxAmount === undefined || dailyROI === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: name, minAmount, maxAmount, dailyROI' },
        { status: 400 }
      );
    }

    if (minAmount < 0 || maxAmount < 0) {
      return NextResponse.json(
        { error: 'Amounts must be positive' },
        { status: 400 }
      );
    }

    if (minAmount >= maxAmount) {
      return NextResponse.json(
        { error: 'minAmount must be less than maxAmount' },
        { status: 400 }
      );
    }

    if (dailyROI <= 0) {
      return NextResponse.json(
        { error: 'dailyROI must be greater than 0' },
        { status: 400 }
      );
    }

    const packageData = await prisma.package.create({
      data: {
        name,
        description: description || null,
        minAmount,
        maxAmount,
        dailyROI,
        durationDays: durationDays || null,
      },
    });

    return NextResponse.json({
      success: true,
      package: packageData,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Unauthorized' || error.message.includes('Forbidden')) {
        return NextResponse.json(
          { error: error.message },
          { status: error.message === 'Unauthorized' ? 401 : 403 }
        );
      }
    }

    console.error('Error creating package:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

