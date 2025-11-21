import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();

    const body = await request.json();
    const { userId, type, amount, note } = body;

    if (!userId || !type || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (type !== 'balance' && type !== 'depositBalance') {
      return NextResponse.json(
        { error: 'Invalid balance type' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Create wallet if it doesn't exist
    let wallet = user.wallet;
    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId: user.id,
          balance: 0,
          depositBalance: 0,
          roiTotal: 0,
          referralTotal: 0,
        },
      });
    }

    const oldBalance = type === 'balance' ? wallet.balance : wallet.depositBalance;
    const newBalance = oldBalance + amount;

    if (newBalance < 0) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      );
    }

    // Update wallet
    await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        [type]: newBalance,
      },
    });

    // Create audit log
    await createAuditLog({
      userId,
      action: `ADMIN_${type.toUpperCase()}_ADJUST`,
      amount: Math.abs(amount),
      before: oldBalance,
      after: newBalance,
      meta: {
        adminId: admin.id,
        adminEmail: admin.email,
        type,
        note: note || null,
        adjustment: amount > 0 ? 'ADD' : 'SUBTRACT',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Balance adjusted successfully',
      newBalance,
    });
  } catch (error) {
    console.error('Error adjusting balance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

