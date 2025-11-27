'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Investment {
  id: string;
  amount: number;
  packageName: string;
  dailyROI: number;
  status: string;
  startDate: string;
  createdAt: string;
  updatedAt: string;
}

export default function ActiveInvestmentsCard() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInvestments() {
      try {
        const response = await fetch('/api/investments', {
          credentials: 'include',
          cache: 'no-store',
        });
        if (response.ok) {
          const data = await response.json();
          if (data.investments && Array.isArray(data.investments)) {
            setInvestments(data.investments);
          } else {
            setInvestments([]);
          }
        } else {
          console.error('Failed to fetch investments:', response.status);
          setInvestments([]);
        }
      } catch (error) {
        console.error('Error fetching investments:', error);
        setInvestments([]);
      } finally {
        setLoading(false);
      }
    }

    fetchInvestments();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <svg
            className="w-5 h-5 text-purple-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          Active Investments
        </h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
  const totalDailyReturn = investments.reduce((sum, inv) => sum + (inv.amount * inv.dailyROI) / 100, 0);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <svg
            className="w-5 h-5 text-purple-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          Active Investments
        </h3>
        {investments.length > 0 && (
          <Link
            href="/dashboard/packages"
            className="text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            View All →
          </Link>
        )}
      </div>

      {investments.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <p className="text-gray-700 font-semibold">No active investments yet</p>
          <p className="text-sm text-gray-600 font-medium mt-2">Start investing to see your portfolio here</p>
          <Link
            href="/dashboard/packages"
            className="inline-block mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
          >
            Browse Packages
          </Link>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-200">
              <p className="text-xs text-gray-600 mb-1">Total Invested</p>
              <p className="text-xl font-bold text-gray-900">
                ${totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
              <p className="text-xs text-gray-600 mb-1">Daily Returns</p>
              <p className="text-xl font-bold text-green-600">
                ${totalDailyReturn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Investments List */}
          <div className="space-y-3">
            {investments.slice(0, 3).map((investment) => (
              <div
                key={investment.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-semibold text-gray-900">
                        ${investment.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                        {investment.packageName}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-indigo-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        <span className="font-medium">{investment.dailyROI}% daily ROI</span>
                      </div>
                      <span className="text-gray-700 font-medium">
                        Started: {new Date(investment.startDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                    {investment.status}
                  </span>
                </div>
              </div>
            ))}
            {investments.length > 3 && (
              <Link
                href="/dashboard/packages"
                className="block text-center text-sm text-purple-600 hover:text-purple-700 font-medium py-2"
              >
                View {investments.length - 3} more investment{investments.length - 3 !== 1 ? 's' : ''} →
              </Link>
            )}
          </div>
        </>
      )}
    </div>
  );
}

