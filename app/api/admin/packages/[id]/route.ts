import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { name, description, minAmount, maxAmount, dailyROI, durationDays } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (minAmount !== undefined) updateData.minAmount = minAmount;
    if (maxAmount !== undefined) updateData.maxAmount = maxAmount;
    if (dailyROI !== undefined) updateData.dailyROI = dailyROI;
    if (durationDays !== undefined) updateData.durationDays = durationDays;

    if (minAmount !== undefined && maxAmount !== undefined && minAmount > maxAmount) {
      return NextResponse.json(
        { error: 'Invalid amount range' },
        { status: 400 }
      );
    }

    const pkg = await prisma.package.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      package: pkg,
    });
  } catch (error) {
    console.error('Error updating package:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    // Check if package has active investments
    const investmentCount = await prisma.investment.count({
      where: {
        packageId: params.id,
        status: 'ACTIVE',
      },
    });

    if (investmentCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete package with active investments' },
        { status: 400 }
      );
    }

    await prisma.package.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Package deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting package:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

