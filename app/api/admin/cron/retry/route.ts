import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { REFERRAL_COMMISSION_PERCENTS } from '@/lib/roi-config';
import { createAuditLog } from '@/lib/audit';

async function getUplineChain(
  referralCode: string | null,
  maxLevels: number
): Promise<Array<{ userId: string; walletId: string; referralCode: string }>> {
  const upline: Array<{ userId: string; walletId: string; referralCode: string }> = [];
  let currentRefCode = referralCode;
  let level = 0;

  while (currentRefCode && level < maxLevels) {
    const user = await prisma.user.findUnique({
      where: { referralCode: currentRefCode },
      include: { wallet: true },
    });

    if (!user || !user.wallet) {
      break;
    }

    upline.push({
      userId: user.id,
      walletId: user.wallet.id,
      referralCode: user.referralCode,
    });

    currentRefCode = user.referredBy;
    level++;
  }

  return upline;
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { investmentIds } = body;

    if (!Array.isArray(investmentIds) || investmentIds.length === 0) {
      return NextResponse.json(
        { error: 'investmentIds array is required' },
        { status: 400 }
      );
    }

    const results = {
      success: [] as string[],
      failed: [] as Array<{ investmentId: string; error: string }>,
    };

    // Process each investment
    for (const investmentId of investmentIds) {
      try {
        const investment = await prisma.investment.findUnique({
          where: { id: investmentId },
          include: {
            user: {
              select: {
                id: true,
                referralCode: true,
                referredBy: true,
              },
            },
            wallet: {
              select: {
                id: true,
                userId: true,
                balance: true,
              },
            },
          },
        });

        if (!investment) {
          results.failed.push({
            investmentId,
            error: 'Investment not found',
          });
          continue;
        }

        if (!investment.isActive || investment.status !== 'ACTIVE') {
          results.failed.push({
            investmentId,
            error: 'Investment is not active',
          });
          continue;
        }

        // Use dynamic dailyROI from investment (Decimal type)
        const dailyROIValue = typeof investment.dailyROI === 'object' && 'toNumber' in investment.dailyROI
          ? investment.dailyROI.toNumber()
          : Number(investment.dailyROI);
        const roiAmount = (investment.amount * dailyROIValue) / 100;

        // Process in transaction
        await prisma.$transaction(async (tx) => {
          const beforeBalance = investment.wallet.balance;

          // Update wallet
          const updatedWallet = await tx.wallet.update({
            where: { id: investment.walletId },
            data: {
              balance: { increment: roiAmount },
              roiTotal: { increment: roiAmount },
            },
          });

          // Create earnings
          await tx.earnings.create({
            data: {
              userId: investment.userId,
              walletId: investment.walletId,
              amount: roiAmount,
              type: 'roi',
              description: `Retry ROI from investment ${investment.id}`,
            },
          });

          // Audit log
          await createAuditLog({
            userId: investment.userId,
            action: 'ROI_PAYMENT_RETRY',
            amount: roiAmount,
            before: beforeBalance,
            after: updatedWallet.balance,
            meta: { investmentId: investment.id },
          });

          // Update lastRoiAt
          await tx.investment.update({
            where: { id: investment.id },
            data: {
              lastRoiAt: new Date(),
            },
          });

          // Process referrals
          const uplineChain = await getUplineChain(
            investment.user.referredBy,
            REFERRAL_COMMISSION_PERCENTS.length
          );

          for (let level = 0; level < uplineChain.length && level < REFERRAL_COMMISSION_PERCENTS.length; level++) {
            const uplineUser = uplineChain[level];
            const commissionPercent = REFERRAL_COMMISSION_PERCENTS[level];
            const commissionAmount = (roiAmount * commissionPercent) / 100;

            if (commissionAmount > 0) {
              const uplineWallet = await tx.wallet.findUnique({
                where: { id: uplineUser.walletId },
                select: { balance: true },
              });

              const beforeUplineBalance = uplineWallet?.balance || 0;

              const updatedUplineWallet = await tx.wallet.update({
                where: { id: uplineUser.walletId },
                data: {
                  balance: { increment: commissionAmount },
                  referralTotal: { increment: commissionAmount },
                },
              });

              await tx.earnings.create({
                data: {
                  userId: uplineUser.userId,
                  walletId: uplineUser.walletId,
                  amount: commissionAmount,
                  type: 'referral',
                  description: `Level ${level + 1} referral commission (retry) from ${investment.user.referralCode}`,
                },
              });

              await createAuditLog({
                userId: uplineUser.userId,
                action: 'REFERRAL_COMMISSION_RETRY',
                amount: commissionAmount,
                before: beforeUplineBalance,
                after: updatedUplineWallet.balance,
                meta: {
                  investmentId: investment.id,
                  level: level + 1,
                  fromUserId: investment.userId,
                },
              });
            }
          }
        });

        results.success.push(investmentId);
      } catch (error) {
        results.failed.push({
          investmentId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      results: {
        successCount: results.success.length,
        failedCount: results.failed.length,
        success: results.success,
        failed: results.failed,
      },
    });
  } catch (error) {
    console.error('Error retrying investments:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

