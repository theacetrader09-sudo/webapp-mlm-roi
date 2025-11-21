'use client';

import { useState } from 'react';

interface CronLog {
  id: string;
  createdAt: string;
  processed: number;
  skipped: number;
  totalRoiPaid: number;
  totalReferralPaid: number;
  failedItems: Array<{ investmentId: string; error: string }> | null | unknown;
}

interface CronManagementProps {
  initialLogs: CronLog[];
}

export default function CronManagement({ initialLogs }: CronManagementProps) {
  const [logs, setLogs] = useState<CronLog[]>(initialLogs);
  const [loading, setLoading] = useState(false);
  const [retryIds, setRetryIds] = useState('');
  const [retryLoading, setRetryLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/admin/cron/logs?limit=50');
      const data = await response.json();
      if (data.success) {
        setLogs(data.logs);
      }
    } catch {
      // Error fetching logs - continue
    }
  };

  const handleRunNow = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch('/api/admin/cron/run-now', {
        method: 'POST',
      });
      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Cron executed successfully!' });
        await fetchLogs();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to run cron' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async () => {
    if (!retryIds.trim()) {
      setMessage({ type: 'error', text: 'Please enter investment IDs' });
      return;
    }

    const ids = retryIds
      .split(',')
      .map((id) => id.trim())
      .filter((id) => id.length > 0);

    if (ids.length === 0) {
      setMessage({ type: 'error', text: 'No valid investment IDs' });
      return;
    }

    setRetryLoading(true);
    setMessage(null);
    try {
      const response = await fetch('/api/admin/cron/retry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ investmentIds: ids }),
      });
      const data = await response.json();

      if (data.success) {
        setMessage({
          type: 'success',
          text: `Retry completed: ${data.results.successCount} succeeded, ${data.results.failedCount} failed`,
        });
        setRetryIds('');
        await fetchLogs();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to retry' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setRetryLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800'
              : 'bg-red-50 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Run Now Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Run Cron Now</h2>
        <button
          onClick={handleRunNow}
          disabled={loading}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Running...' : 'Run Now'}
        </button>
        <p className="text-sm text-gray-500 mt-2">
          Manually trigger the daily ROI cron. Rate limited to once per 30 minutes.
        </p>
      </div>

      {/* Retry Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Retry Failed Investments</h2>
        <div className="space-y-4">
          <textarea
            value={retryIds}
            onChange={(e) => setRetryIds(e.target.value)}
            placeholder="Enter investment IDs separated by commas (e.g., id1, id2, id3)"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            rows={3}
          />
          <button
            onClick={handleRetry}
            disabled={retryLoading || !retryIds.trim()}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {retryLoading ? 'Processing...' : 'Retry'}
          </button>
        </div>
      </div>

      {/* Logs Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Recent Cron Logs</h2>
          <button
            onClick={fetchLogs}
            className="text-sm text-indigo-600 hover:text-indigo-700"
          >
            Refresh
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Processed
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Skipped
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  ROI Paid
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Referral Paid
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Failed
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{log.processed}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{log.skipped}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    ${log.totalRoiPaid.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    ${log.totalReferralPaid.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {log.failedItems &&
                    Array.isArray(log.failedItems) &&
                    log.failedItems.length > 0 ? (
                      <span className="text-red-600">{log.failedItems.length}</span>
                    ) : (
                      <span className="text-green-600">0</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {logs.length === 0 && (
            <p className="text-center py-8 text-gray-500">No logs yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

