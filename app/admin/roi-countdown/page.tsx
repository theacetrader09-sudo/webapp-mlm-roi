import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ROICountdown from '@/components/roi-countdown';
import { prisma } from '@/lib/prisma';

export default async function AdminROICountdownPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  // Get recent cron logs to show last ROI execution
  const recentCronLogs = await prisma.cronRunLog.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      createdAt: true,
      processed: true,
      skipped: true,
      totalRoiPaid: true,
      totalReferralPaid: true,
    },
  });

  // Get next ROI time calculation
  const now = new Date();
  const utcNow = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    now.getUTCHours(),
    now.getUTCMinutes(),
    now.getUTCSeconds()
  ));
  
  const todayMidnight = new Date(Date.UTC(
    utcNow.getUTCFullYear(),
    utcNow.getUTCMonth(),
    utcNow.getUTCDate(),
    0, 0, 0, 0
  ));
  
  const nextROI = new Date(todayMidnight);
  if (utcNow >= todayMidnight) {
    nextROI.setUTCDate(nextROI.getUTCDate() + 1);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">ROI Countdown Management</h1>
        <p className="mt-2 text-gray-600">Monitor the countdown to next daily ROI credit (00:00 UTC)</p>
      </div>

      {/* Countdown Display */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-8 text-white shadow-xl mb-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Next Daily ROI Credit</h2>
          <ROICountdown showLabel={true} size="large" />
          <div className="mt-6 pt-6 border-t border-white/20">
            <p className="text-sm opacity-90">
              Next execution: {nextROI.toUTCString()}
            </p>
            <p className="text-xs opacity-75 mt-2">
              Current UTC time: {utcNow.toUTCString()}
            </p>
          </div>
        </div>
      </div>

      {/* Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            How It Works
          </h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-1">•</span>
              <span>ROI credits are processed automatically at 00:00 UTC daily</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-1">•</span>
              <span>The countdown shows time remaining until the next credit</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-1">•</span>
              <span>You can manually trigger ROI processing from the Cron Jobs page</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-1">•</span>
              <span>All active investments receive their daily ROI at this time</span>
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Quick Actions
          </h3>
          <div className="space-y-3">
            <a
              href="/admin/cron"
              className="block w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-center font-medium"
            >
              Go to Cron Jobs
            </a>
            <a
              href="/admin/investments"
              className="block w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-center font-medium"
            >
              View All Investments
            </a>
            <a
              href="/admin/reports"
              className="block w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-center font-medium"
            >
              View ROI Reports
            </a>
          </div>
        </div>
      </div>

      {/* Recent Cron Logs */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent ROI Executions</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {recentCronLogs.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No ROI executions yet
            </div>
          ) : (
            recentCronLogs.map((log) => (
              <div key={log.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(log.createdAt).toUTCString()}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>Processed: {log.processed}</span>
                      <span>Skipped: {log.skipped}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-green-600">
                      ROI: ${typeof log.totalRoiPaid === 'object' && log.totalRoiPaid !== null && 'toNumber' in log.totalRoiPaid
                        ? (log.totalRoiPaid as { toNumber: () => number }).toNumber().toFixed(2)
                        : Number(log.totalRoiPaid).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Referral: ${typeof log.totalReferralPaid === 'object' && log.totalReferralPaid !== null && 'toNumber' in log.totalReferralPaid
                        ? (log.totalReferralPaid as { toNumber: () => number }).toNumber().toFixed(2)
                        : Number(log.totalReferralPaid).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

