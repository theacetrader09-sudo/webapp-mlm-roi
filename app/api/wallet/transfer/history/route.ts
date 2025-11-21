import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all transfers where user is sender or recipient
    const transfers = await prisma.internalTransfer.findMany({
      where: {
        OR: [
          { fromUserId: user.id },
          { toUserId: user.id },
        ],
      },
      include: {
        fromUser: {
          select: {
            id: true,
            name: true,
            email: true,
            referralCode: true,
          },
        },
        toUser: {
          select: {
            id: true,
            name: true,
            email: true,
            referralCode: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    });

    const formattedTransfers = transfers.map((transfer) => {
      const amount = typeof transfer.amount === 'object' && 'toNumber' in transfer.amount
        ? transfer.amount.toNumber()
        : Number(transfer.amount);

      return {
        id: transfer.id,
        amount,
        type: transfer.fromUserId === user.id ? 'sent' : 'received',
        fromUser: transfer.fromUser,
        toUser: transfer.toUser,
        note: transfer.note,
        createdAt: transfer.createdAt,
      };
    });

    return NextResponse.json({
      success: true,
      transfers: formattedTransfers,
    });
  } catch (error) {
    console.error('Error fetching transfer history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

