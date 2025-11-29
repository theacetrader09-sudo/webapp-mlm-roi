import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { createAuditLog } from '@/lib/audit';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        wallet: true,
        investments: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        deposits: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        withdrawals: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        earnings: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        investments: user.investments.map((inv) => ({
          ...inv,
          dailyROI: typeof inv.dailyROI === 'object' && 'toNumber' in inv.dailyROI
            ? inv.dailyROI.toNumber()
            : Number(inv.dailyROI),
        })),
        deposits: user.deposits.map((dep) => ({
          ...dep,
          amount: typeof dep.amount === 'object' && 'toNumber' in dep.amount
            ? dep.amount.toNumber()
            : Number(dep.amount),
        })),
        withdrawals: user.withdrawals.map((w) => ({
          ...w,
          amount: typeof w.amount === 'object' && 'toNumber' in w.amount
            ? w.amount.toNumber()
            : Number(w.amount),
          walletBefore: typeof w.walletBefore === 'object' && 'toNumber' in w.walletBefore
            ? w.walletBefore.toNumber()
            : Number(w.walletBefore),
          walletAfter: typeof w.walletAfter === 'object' && 'toNumber' in w.walletAfter
            ? w.walletAfter.toNumber()
            : Number(w.walletAfter),
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin();

    const body = await request.json();
    const { name, email, role, referralCode, password, balance, depositBalance } = body;

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { id: params.id },
      include: { wallet: true },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) {
      // Check if email is already taken by another user
      const existing = await prisma.user.findUnique({
        where: { email },
      });
      if (existing && existing.id !== params.id) {
        return NextResponse.json(
          { error: 'Email already taken' },
          { status: 400 }
        );
      }
      updateData.email = email;
    }
    if (role !== undefined && (role === 'USER' || role === 'ADMIN')) {
      updateData.role = role;
    }
    if (referralCode !== undefined) {
      // Check if referral code is already taken
      const existing = await prisma.user.findUnique({
        where: { referralCode },
      });
      if (existing && existing.id !== params.id) {
        return NextResponse.json(
          { error: 'Referral code already taken' },
          { status: 400 }
        );
      }
      updateData.referralCode = referralCode;
    }
    if (password !== undefined && password.length > 0) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      include: { wallet: true },
    });

    // Update wallet balances if provided
    if (balance !== undefined || depositBalance !== undefined) {
      const walletUpdate: any = {};
      if (balance !== undefined) {
        const oldBalance = Number(currentUser.wallet?.balance || 0);
        walletUpdate.balance = balance;
        // Create audit log
        await createAuditLog({
          userId: params.id,
          action: 'ADMIN_BALANCE_ADJUST',
          amount: balance - oldBalance,
          before: oldBalance,
          after: balance,
          meta: {
            adminId: admin.id,
            adminEmail: admin.email,
            type: 'balance',
          },
        });
      }
      if (depositBalance !== undefined) {
        const oldDepositBalance = Number(currentUser.wallet?.depositBalance || 0);
        walletUpdate.depositBalance = depositBalance;
        // Create audit log
        await createAuditLog({
          userId: params.id,
          action: 'ADMIN_DEPOSIT_BALANCE_ADJUST',
          amount: depositBalance - oldDepositBalance,
          before: oldDepositBalance,
          after: depositBalance,
          meta: {
            adminId: admin.id,
            adminEmail: admin.email,
            type: 'depositBalance',
          },
        });
      }

      await prisma.wallet.update({
        where: { userId: params.id },
        data: walletUpdate,
      });
    }

    // Create audit log for user update
    await createAuditLog({
      userId: params.id,
      action: 'ADMIN_USER_UPDATE',
      meta: {
        adminId: admin.id,
        adminEmail: admin.email,
        changes: Object.keys(updateData),
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin();

    const user = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent deleting yourself
    if (user.id === admin.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Create audit log BEFORE deletion (so we can reference the user)
    try {
      await createAuditLog({
        userId: admin.id, // Use admin ID for the audit log
        action: 'ADMIN_USER_DELETE',
        meta: {
          adminId: admin.id,
          adminEmail: admin.email,
          deletedUserEmail: user.email,
          deletedUserId: params.id,
          deletedUserName: user.name,
        },
      });
    } catch (auditError) {
      // Log but don't fail the deletion if audit log fails
      console.error('Failed to create audit log for user deletion:', auditError);
    }

    // Delete user and all related records in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete related records first (in order of dependencies)
      // 1. Delete internal transfers
      await tx.internalTransfer.deleteMany({
        where: {
          OR: [
            { fromUserId: params.id },
            { toUserId: params.id },
          ],
        },
      });

      // 2. Delete earnings
      await tx.earnings.deleteMany({
        where: { userId: params.id },
      });

      // 3. Delete investments
      await tx.investment.deleteMany({
        where: { userId: params.id },
      });

      // 4. Delete withdrawals
      await tx.withdrawal.deleteMany({
        where: { userId: params.id },
      });

      // 5. Delete deposits
      await tx.deposit.deleteMany({
        where: { userId: params.id },
      });

      // 6. Delete wallet (if exists)
      await tx.wallet.deleteMany({
        where: { userId: params.id },
      });

      // 7. Delete audit logs for this user (optional - you may want to keep them for history)
      // Uncomment if you want to delete audit logs too:
      // await tx.auditLog.deleteMany({
      //   where: { userId: params.id },
      // });

      // 8. Finally, delete the user
      await tx.user.delete({
        where: { id: params.id },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

