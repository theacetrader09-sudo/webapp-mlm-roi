import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';

// Helper function to check if userA is upline of userB
async function isUplineOf(uplineUserId: string, downlineUserId: string): Promise<boolean> {
  const downlineUser = await prisma.user.findUnique({
    where: { id: downlineUserId },
    select: {
      referredBy: true,
    },
  });

  if (!downlineUser || !downlineUser.referredBy) {
    return false;
  }

  // Get upline user by referral code
  const uplineUser = await prisma.user.findUnique({
    where: { referralCode: downlineUser.referredBy },
    select: {
      id: true,
      referralCode: true,
      referredBy: true,
    },
  });

  if (!uplineUser) {
    return false;
  }

  // Check if this upline user is the one we're checking
  if (uplineUser.id === uplineUserId) {
    return true;
  }

  // Recursively check if the upline is in the chain
  return isUplineOf(uplineUserId, uplineUser.id);
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { toUserId, amount, note } = body;

    if (!toUserId || !amount) {
      return NextResponse.json(
        { error: 'toUserId and amount are required' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    if (toUserId === user.id) {
      return NextResponse.json(
        { error: 'Cannot transfer to yourself' },
        { status: 400 }
      );
    }

    // Get recipient user
    const recipient = await prisma.user.findUnique({
      where: { id: toUserId },
      include: {
        wallet: true,
      },
    });

    if (!recipient) {
      return NextResponse.json(
        { error: 'Recipient user not found' },
        { status: 404 }
      );
    }

    // Note: Recipient wallet will be created in transaction if needed

    // Check if sender is upline of recipient (only upline can transfer to downline)
    const isUpline = await isUplineOf(user.id, toUserId);
    if (!isUpline) {
      return NextResponse.json(
        { error: 'You can only transfer funds to your downline members' },
        { status: 403 }
      );
    }

    // Get sender wallet, create if it doesn't exist
    let senderWallet = await prisma.wallet.findUnique({
      where: { userId: user.id },
    });

    if (!senderWallet) {
      senderWallet = await prisma.wallet.create({
        data: {
          userId: user.id,
          balance: 0,
          depositBalance: 0,
          roiTotal: 0,
          referralTotal: 0,
        },
      });
    }

    // Check if sender has sufficient balance (check both deposit and main balance)
    const senderDepositBalance = Number(senderWallet.depositBalance || 0);
    const availableBalance = senderDepositBalance + Number(senderWallet.balance || 0);
    if (availableBalance < amount) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      );
    }

    // Perform transfer in transaction
    await prisma.$transaction(async (tx) => {
      // Ensure recipient wallet exists
      let recipientWallet = recipient.wallet;
      if (!recipientWallet) {
        recipientWallet = await tx.wallet.create({
          data: {
            userId: toUserId,
            balance: 0,
            depositBalance: 0,
            roiTotal: 0,
            referralTotal: 0,
          },
        });
      }

      // Determine which balance to deduct from (prefer deposit balance first)
      const fromDepositBalance = senderDepositBalance;
      let depositDeduction = 0;
      let mainDeduction = 0;

      if (fromDepositBalance >= amount) {
        depositDeduction = amount;
      } else {
        depositDeduction = fromDepositBalance;
        mainDeduction = amount - fromDepositBalance;
      }

      // Update sender wallet
      const updatedSenderWallet = await tx.wallet.update({
        where: { id: senderWallet.id },
        data: {
          depositBalance: {
            decrement: depositDeduction,
          },
          balance: {
            decrement: mainDeduction,
          },
        },
      });

      // Update recipient wallet (add to deposit balance)
      const recipientDepositBalance = Number(recipientWallet.depositBalance || 0);
      const beforeRecipientBalance = recipientDepositBalance;
      const updatedRecipientWallet = await tx.wallet.update({
        where: { id: recipientWallet.id },
        data: {
          depositBalance: {
            increment: amount,
          },
        },
      });

      // Create transfer record
      await tx.internalTransfer.create({
        data: {
          fromUserId: user.id,
          toUserId: toUserId,
          fromWalletId: senderWallet.id,
          toWalletId: recipientWallet.id,
          amount: amount,
          transferType: 'internal_transfer',
          note: note || null,
        },
      });

      // Audit logs
      await createAuditLog({
        userId: user.id,
        action: 'INTERNAL_TRANSFER_SENT',
        amount: amount,
        before: availableBalance,
        after: Number(updatedSenderWallet.depositBalance || 0) + Number(updatedSenderWallet.balance || 0),
        meta: {
          toUserId: toUserId,
          toUserEmail: recipient.email,
          depositDeduction,
          mainDeduction,
          note: note || null,
        },
      });

      await createAuditLog({
        userId: toUserId,
        action: 'INTERNAL_TRANSFER_RECEIVED',
        amount: amount,
        before: beforeRecipientBalance,
        after: Number(updatedRecipientWallet.depositBalance || 0),
        meta: {
          fromUserId: user.id,
          fromUserEmail: user.email,
          note: note || null,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Transfer completed successfully',
    });
  } catch (error) {
    console.error('Error processing transfer:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

