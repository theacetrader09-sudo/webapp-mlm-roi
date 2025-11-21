import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { processDailyRoi } from '@/lib/roi-processor';

// Simple in-memory rate limiting (30 minutes)
const lastRunTime = new Map<string, number>();
const RATE_LIMIT_MS = 30 * 60 * 1000; // 30 minutes

export async function POST(request: NextRequest) {
  try {
    // Check admin access
    await requireAdmin();

    // Check CRON_SECRET header
    const cronSecret = request.headers.get('x-cron-key');
    const expectedSecret = process.env.CRON_SECRET;

    if (expectedSecret && cronSecret !== expectedSecret) {
      return NextResponse.json(
        { error: 'Invalid CRON_SECRET' },
        { status: 401 }
      );
    }

    // Rate limiting (unless forced)
    const force = request.nextUrl.searchParams.get('force') === 'true';
    const adminId = 'admin'; // In production, use actual admin user ID

    if (!force) {
      const lastRun = lastRunTime.get(adminId);
      const now = Date.now();
      if (lastRun && now - lastRun < RATE_LIMIT_MS) {
        return NextResponse.json(
          {
            error: 'Rate limited. Please wait 30 minutes or use ?force=true',
            nextRunAt: new Date(lastRun + RATE_LIMIT_MS).toISOString(),
          },
          { status: 429 }
        );
      }
    }

    lastRunTime.set(adminId, Date.now());

    // Process ROI (skip idempotency check for manual runs)
    const result = await processDailyRoi(true);

    // Create CronRunLog entry
    const cronLog = await prisma.cronRunLog.create({
      data: {
        processed: result.processed,
        skipped: result.skipped,
        totalRoiPaid: result.totalRoiPaid,
        totalReferralPaid: result.totalReferralPaid,
        failedItems: result.failedItems.length > 0 ? result.failedItems : Prisma.JsonNull,
        rawOutput: JSON.stringify(result, null, 2),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'ROI cron executed successfully',
      summary: {
        processed: result.processed,
        skipped: result.skipped,
        totalRoiPaid: result.totalRoiPaid,
        totalReferralPaid: result.totalReferralPaid,
        failedCount: result.failedItems.length,
      },
      cronLog: {
        id: cronLog.id,
        createdAt: cronLog.createdAt,
        processed: cronLog.processed,
        skipped: cronLog.skipped,
        totalRoiPaid: cronLog.totalRoiPaid,
        totalReferralPaid: cronLog.totalReferralPaid,
        failedItems: cronLog.failedItems,
      },
    });
  } catch (error) {
    console.error('Admin cron run-now error:', error);

    // Sentry error tracking (optional - configure via sentry.server.config.ts if needed)
    // Errors are logged to console and can be captured by Sentry if configured

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

