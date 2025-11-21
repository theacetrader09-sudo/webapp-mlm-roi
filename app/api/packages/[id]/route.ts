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

    // Check if package exists
    const existingPackage = await prisma.package.findUnique({
      where: { id: params.id },
    });

    if (!existingPackage) {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      );
    }

    // Validation
    const updateData: {
      name?: string;
      description?: string | null;
      minAmount?: number;
      maxAmount?: number;
      dailyROI?: number;
      durationDays?: number | null;
    } = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (minAmount !== undefined) updateData.minAmount = minAmount;
    if (maxAmount !== undefined) updateData.maxAmount = maxAmount;
    if (dailyROI !== undefined) updateData.dailyROI = dailyROI;
    if (durationDays !== undefined) updateData.durationDays = durationDays;

    // Validate if amounts are being updated
    const finalMinAmount = minAmount !== undefined ? minAmount : existingPackage.minAmount;
    const finalMaxAmount = maxAmount !== undefined ? maxAmount : existingPackage.maxAmount;
    const finalDailyROI = dailyROI !== undefined ? dailyROI : existingPackage.dailyROI;

    if (finalMinAmount < 0 || finalMaxAmount < 0) {
      return NextResponse.json(
        { error: 'Amounts must be positive' },
        { status: 400 }
      );
    }

    if (finalMinAmount >= finalMaxAmount) {
      return NextResponse.json(
        { error: 'minAmount must be less than maxAmount' },
        { status: 400 }
      );
    }

    if (finalDailyROI <= 0) {
      return NextResponse.json(
        { error: 'dailyROI must be greater than 0' },
        { status: 400 }
      );
    }

    const updatedPackage = await prisma.package.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      package: updatedPackage,
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

    const existingPackage = await prisma.package.findUnique({
      where: { id: params.id },
    });

    if (!existingPackage) {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      );
    }

    // Check if package has active investments
    const activeInvestments = await prisma.investment.count({
      where: {
        packageId: params.id,
        status: 'ACTIVE',
      },
    });

    if (activeInvestments > 0) {
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
    if (error instanceof Error) {
      if (error.message === 'Unauthorized' || error.message.includes('Forbidden')) {
        return NextResponse.json(
          { error: error.message },
          { status: error.message === 'Unauthorized' ? 401 : 403 }
        );
      }
    }

    console.error('Error deleting package:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

