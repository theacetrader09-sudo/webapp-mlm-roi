import { prisma } from '@/lib/prisma';
import { REFERRAL_COMMISSION_PERCENTS } from '@/lib/roi-config';
import { createAuditLog } from '@/lib/audit';
import { Decimal } from '@prisma/client/runtime/library';

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
// This function continues the chain even if intermediate users don't have wallets
// It only stops when there's no more referredBy code
async function getUplineChain(
  referralCode: string | null,
  maxLevels: number
): Promise<Array<{ userId: string; walletId: string; referralCode: string }>> {
  const upline: Array<{ userId: string; walletId: string; referralCode: string }> = [];
  let currentRefCode = referralCode;
  let level = 0;

  while (currentRefCode && level < maxLevels) {
    try {
      const user = await prisma.user.findUnique({
        where: { referralCode: currentRefCode },
        include: { wallet: true },
      });

      // If user doesn't exist or has no wallet, continue to next level
      // This allows the chain to continue even if intermediate users are missing
      if (!user) {
        // Try to find by case-insensitive match
        const userCaseInsensitive = await prisma.user.findFirst({
          where: {
            referralCode: {
              equals: currentRefCode,
              mode: 'insensitive',
            },
          },
          include: { wallet: true },
        });

        if (!userCaseInsensitive || !userCaseInsensitive.wallet) {
          // No user found, stop chain
          break;
        }

        // Use the found user
        upline.push({
          userId: userCaseInsensitive.id,
          walletId: userCaseInsensitive.wallet.id,
          referralCode: userCaseInsensitive.referralCode,
        });

        currentRefCode = userCaseInsensitive.referredBy;
        level++;
        continue;
      }

      if (!user.wallet) {
        // User exists but no wallet - continue chain but don't add to upline
        // This allows chain to continue even if intermediate user has no wallet
        currentRefCode = user.referredBy;
        level++;
        continue;
      }

      upline.push({
        userId: user.id,
        walletId: user.wallet.id,
        referralCode: user.referralCode,
      });

      currentRefCode = user.referredBy;
      level++;
    } catch (error) {
      console.error(`Error getting upline for ${currentRefCode}:`, error);
      break; // Stop on error
    }
  }

  return upline;
}

interface ProcessRoiResult {
  processed: number;
  skipped: number;
  totalRoiPaid: Decimal;
  totalReferralPaid: Decimal;
  failedItems: Array<{ investmentId: string; error: string }>;
}

export async function processDailyRoi(
  skipIdempotencyCheck: boolean = false
): Promise<ProcessRoiResult> {
  const result: ProcessRoiResult = {
    processed: 0,
    skipped: 0,
    totalRoiPaid: new Decimal(0),
    totalReferralPaid: new Decimal(0),
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
      const dailyROIValue = new Decimal(investment.dailyROI);
      const investmentAmount = new Decimal(investment.amount);
      const roiAmount = investmentAmount.mul(dailyROIValue).div(100);

      // Process ROI and referral commissions in a single transaction
      await prisma.$transaction(async (tx) => {
        const beforeBalance = new Decimal(investment.wallet.balance);

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
        // Only pay commissions to users who have at least one active investment
        for (let level = 0; level < uplineChain.length && level < REFERRAL_COMMISSION_PERCENTS.length; level++) {
          const uplineUser = uplineChain[level];
          const commissionPercent = new Decimal(REFERRAL_COMMISSION_PERCENTS[level]);
          const commissionAmount = roiAmount.mul(commissionPercent).div(100);

          if (commissionAmount.gt(0)) {
            // Check if upline user has at least one active investment
            const activeInvestmentCount = await tx.investment.count({
              where: {
                userId: uplineUser.userId,
                isActive: true,
                status: 'ACTIVE',
              },
            });

            // Skip this user if they don't have any active investments
            // But continue to the next level (chain doesn't break)
            if (activeInvestmentCount === 0) {
              continue; // Skip this level, continue to next
            }

            // Get upline wallet before update
            const uplineWallet = await tx.wallet.findUnique({
              where: { id: uplineUser.walletId },
              select: { balance: true },
            });

            const beforeUplineBalance = new Decimal(uplineWallet?.balance || 0);

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

            result.totalReferralPaid = result.totalReferralPaid.add(commissionAmount);
          }
        }

        result.totalRoiPaid = result.totalRoiPaid.add(roiAmount);
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

