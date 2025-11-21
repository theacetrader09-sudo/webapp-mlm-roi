import { prisma } from '@/lib/prisma';
import { REFERRAL_COMMISSION_PERCENTS } from '@/lib/roi-config';
import { createAuditLog } from '@/lib/audit';

// Helper function to get start of day in UTC
export function getStartOfDayUTC(date: Date = new Date()): Date {
  const utcDate = new Date(date.toISOString());
  utcDate.setUTCHours(0, 0, 0, 0);
  return utcDate;
}

// Helper function to check if ROI was already paid today
export function wasRoiPaidToday(lastRoiAt: Date | null): boolean {
  if (!lastRoiAt) return false;
  const todayStart = getStartOfDayUTC();
  const lastRoiStart = getStartOfDayUTC(lastRoiAt);
  return lastRoiStart.getTime() === todayStart.getTime();
}

// Helper function to get upline referral chain
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
      break; // No upline found, stop chain
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

interface ProcessRoiResult {
  processed: number;
  skipped: number;
  totalRoiPaid: number;
  totalReferralPaid: number;
  failedItems: Array<{ investmentId: string; error: string }>;
}

export async function processDailyRoi(
  skipIdempotencyCheck: boolean = false
): Promise<ProcessRoiResult> {
  const result: ProcessRoiResult = {
    processed: 0,
    skipped: 0,
    totalRoiPaid: 0,
    totalReferralPaid: 0,
    failedItems: [],
  };

  // Load active investments with relations
  const activeInvestments = await prisma.investment.findMany({
    where: {
      isActive: true,
      status: 'ACTIVE',
    },
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

  // Process each investment
  for (const investment of activeInvestments) {
    try {
      // Skip if ROI was already paid today (unless forced)
      if (!skipIdempotencyCheck && wasRoiPaidToday(investment.lastRoiAt)) {
        result.skipped++;
        continue;
      }

      // Use dynamic dailyROI from investment (Decimal type)
      const dailyROIValue = typeof investment.dailyROI === 'object' && 'toNumber' in investment.dailyROI
        ? investment.dailyROI.toNumber()
        : Number(investment.dailyROI);
      const roiAmount = (investment.amount * dailyROIValue) / 100;

      // Process ROI and referral commissions in a single transaction
      await prisma.$transaction(async (tx) => {
        const beforeBalance = investment.wallet.balance;

        // Update investment owner's wallet and create ROI earnings
        const updatedWallet = await tx.wallet.update({
          where: { id: investment.walletId },
          data: {
            balance: { increment: roiAmount },
            roiTotal: { increment: roiAmount },
          },
        });

        await tx.earnings.create({
          data: {
            userId: investment.userId,
            walletId: investment.walletId,
            amount: roiAmount,
            type: 'roi',
            description: `Daily ROI from investment ${investment.id}`,
          },
        });

        // Audit log for wallet change
        await createAuditLog({
          userId: investment.userId,
          action: 'ROI_PAYMENT',
          amount: roiAmount,
          before: beforeBalance,
          after: updatedWallet.balance,
          meta: { investmentId: investment.id },
        });

        // Update investment's lastRoiAt
        await tx.investment.update({
          where: { id: investment.id },
          data: {
            lastRoiAt: new Date(),
          },
        });

        // Get upline chain for referral commissions
        const uplineChain = await getUplineChain(
          investment.user.referredBy,
          REFERRAL_COMMISSION_PERCENTS.length
        );

        // Distribute referral commissions
        for (let level = 0; level < uplineChain.length && level < REFERRAL_COMMISSION_PERCENTS.length; level++) {
          const uplineUser = uplineChain[level];
          const commissionPercent = REFERRAL_COMMISSION_PERCENTS[level];
          const commissionAmount = (roiAmount * commissionPercent) / 100;

          if (commissionAmount > 0) {
            // Get upline wallet before update
            const uplineWallet = await tx.wallet.findUnique({
              where: { id: uplineUser.walletId },
              select: { balance: true },
            });

            const beforeUplineBalance = uplineWallet?.balance || 0;

            // Update upline wallet
            const updatedUplineWallet = await tx.wallet.update({
              where: { id: uplineUser.walletId },
              data: {
                balance: { increment: commissionAmount },
                referralTotal: { increment: commissionAmount },
              },
            });

            // Create referral earnings record
            await tx.earnings.create({
              data: {
                userId: uplineUser.userId,
                walletId: uplineUser.walletId,
                amount: commissionAmount,
                type: 'referral',
                description: `Level ${level + 1} referral commission from ${investment.user.referralCode}`,
              },
            });

            // Audit log for referral commission
            await createAuditLog({
              userId: uplineUser.userId,
              action: 'REFERRAL_COMMISSION',
              amount: commissionAmount,
              before: beforeUplineBalance,
              after: updatedUplineWallet.balance,
              meta: {
                investmentId: investment.id,
                level: level + 1,
                fromUserId: investment.userId,
              },
            });

            result.totalReferralPaid += commissionAmount;
          }
        }

        result.totalRoiPaid += roiAmount;
      });

      result.processed++;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.failedItems.push({
        investmentId: investment.id,
        error: errorMessage,
      });
      console.error(`Error processing investment ${investment.id}:`, error);
    }
  }

  return result;
}

