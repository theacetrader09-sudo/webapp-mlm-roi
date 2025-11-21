import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { processDailyRoi, getStartOfDayUTC } from '@/lib/roi-processor';

export async function GET() {
  try {
    const todayStart = getStartOfDayUTC();

    // 1. Idempotency guard: Try to create RoiCronRun
    let cronRun;
    try {
      cronRun = await prisma.roiCronRun.create({
        data: {
          runDate: todayStart,
        },
      });
    } catch (error: unknown) {
      // If unique constraint violation, cron already ran today
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        return NextResponse.json(
          {
            status: 'already_run',
            date: todayStart.toISOString(),
            message: 'Daily ROI cron already executed today',
          },
          { status: 200 }
        );
      }
      throw error;
    }

    // 2. Process ROI
    const result = await processDailyRoi(false);

    // 3. Create CronRunLog entry
    const cronLog = await prisma.cronRunLog.create({
      data: {
        runId: cronRun.id,
        processed: result.processed,
        skipped: result.skipped,
        totalRoiPaid: result.totalRoiPaid,
        totalReferralPaid: result.totalReferralPaid,
        failedItems: result.failedItems.length > 0 ? result.failedItems : Prisma.JsonNull,
        rawOutput: JSON.stringify(result, null, 2),
      },
    });

    return NextResponse.json({
      status: 'success',
      date: todayStart.toISOString(),
      message: 'Daily ROI cron completed',
      processed: result.processed,
      skipped: result.skipped,
      totalRoiPaid: result.totalRoiPaid,
      totalReferralPaid: result.totalReferralPaid,
      failedCount: result.failedItems.length,
      cronLogId: cronLog.id,
    });
  } catch (error) {
    console.error('Daily ROI cron error:', error);

    // Try to capture with Sentry if available (optional - won't break if not installed)
    // Sentry integration should be configured via sentry.server.config.ts

    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggers
export async function POST() {
  return GET();
}
