'use client';

import { useEffect, useState } from 'react';

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

export default function InvestmentsList() {
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

  // Show data immediately, only show loading if we have no data
  if (loading && investments.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Active Investments
        </h3>
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">
        Active Investments
      </h3>
      {investments.length === 0 ? (
        <div className="text-center py-8 text-gray-700 font-medium">
          <p>No active investments yet.</p>
          <p className="text-sm mt-2 text-gray-600 font-medium">Start investing to see your portfolio here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {investments.map((investment) => (
            <div
              key={investment.id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900">
                      ${investment.amount.toFixed(2)}
                    </p>
                    <span className="text-xs text-gray-700 font-medium">
                      • {investment.packageName}
                    </span>
                  </div>
                  <p className="text-sm text-indigo-600 mt-1">
                    {investment.dailyROI}% daily ROI
                  </p>
                  <p className="text-sm text-gray-700 font-medium mt-1">
                    Started: {new Date(investment.startDate).toLocaleDateString()}
                  </p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                  {investment.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

