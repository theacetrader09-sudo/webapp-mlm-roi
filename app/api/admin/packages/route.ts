import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const packages = await prisma.package.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            investments: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      packages: packages.map((pkg) => ({
        id: pkg.id,
        name: pkg.name,
        description: pkg.description,
        minAmount: pkg.minAmount,
        maxAmount: pkg.maxAmount,
        dailyROI: pkg.dailyROI,
        durationDays: pkg.durationDays,
        createdAt: pkg.createdAt.toISOString(),
        updatedAt: pkg.updatedAt.toISOString(),
        investmentCount: pkg._count.investments,
      })),
    });
  } catch (error) {
    console.error('Error fetching packages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { name, description, minAmount, maxAmount, dailyROI, durationDays } = body;

    if (!name || minAmount === undefined || maxAmount === undefined || dailyROI === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (minAmount < 0 || maxAmount < minAmount) {
      return NextResponse.json(
        { error: 'Invalid amount range' },
        { status: 400 }
      );
    }

    const pkg = await prisma.package.create({
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
      package: pkg,
    });
  } catch (error) {
    console.error('Error creating package:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

