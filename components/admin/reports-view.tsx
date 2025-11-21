'use client';

import { useState } from 'react';

interface DailySummary {
  date: string;
  summary: {
    investmentsProcessed: number;
    totalRoiPaid: number;
    totalReferralPaid: number;
    totalEarnings: number;
    roiEarningsCount: number;
    referralEarningsCount: number;
  };
  topReferralEarners: Array<{
    userId: string;
    amount: number;
    user: {
      name: string | null;
      email: string;
      referralCode: string;
    } | null;
  }>;
}

export default function ReportsView() {
  const [date, setDate] = useState(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  });
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/reports/daily-summary?date=${date}`);
      const data = await response.json();

      if (data.success) {
        setSummary(data);
      } else {
        setError(data.error || 'Failed to fetch summary');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    window.open(`/api/admin/reports/daily-summary/csv?date=${date}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Date Picker */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Daily Summary</h2>
        <div className="flex gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <button
            onClick={fetchSummary}
            disabled={loading}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Generate Report'}
          </button>
          {summary && (
            <button
              onClick={exportCSV}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Export CSV
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {summary && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Investments Processed</h3>
              <p className="text-3xl font-bold text-gray-900">
                {summary.summary.investmentsProcessed}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Total ROI Paid</h3>
              <p className="text-3xl font-bold text-indigo-600">
                ${summary.summary.totalRoiPaid.toFixed(2)}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Total Referral Paid</h3>
              <p className="text-3xl font-bold text-green-600">
                ${summary.summary.totalReferralPaid.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Top Earners */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Top 10 Referral Earners ({summary.date})
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Rank
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Referral Code
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {summary.topReferralEarners.map((earner, index) => (
                    <tr key={earner.userId}>
                      <td className="px-4 py-3 text-sm text-gray-900">{index + 1}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {earner.user?.name || 'N/A'}
                        <br />
                        <span className="text-gray-500 text-xs">{earner.user?.email}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                          {earner.user?.referralCode || 'N/A'}
                        </code>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-green-600">
                        ${earner.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {summary.topReferralEarners.length === 0 && (
                <p className="text-center py-8 text-gray-500">No referral earnings for this date</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

