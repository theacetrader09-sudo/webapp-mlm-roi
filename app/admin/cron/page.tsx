import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import CronManagement from '@/components/admin/cron-management';

export default async function AdminCronPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  // Get recent logs and serialize dates
  const recentLogsRaw = await prisma.cronRunLog.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    take: 10,
  });

  const recentLogs = recentLogsRaw.map((log) => ({
    id: log.id,
    createdAt: log.createdAt.toISOString(),
    processed: log.processed,
    skipped: log.skipped,
    totalRoiPaid: log.totalRoiPaid,
    totalReferralPaid: log.totalReferralPaid,
    failedItems: log.failedItems as Array<{ investmentId: string; error: string }> | null,
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Cron Jobs Management</h1>
        <p className="mt-2 text-gray-600">Manage ROI cron jobs and view execution logs</p>
      </div>

      <CronManagement initialLogs={recentLogs} />
    </div>
  );
}

