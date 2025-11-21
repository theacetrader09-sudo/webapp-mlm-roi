'use client';

import { useEffect, useState } from 'react';

interface Earnings {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  createdAt: string;
}

export default function EarningsFeed() {
  const [earnings, setEarnings] = useState<Earnings[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEarnings() {
      try {
        const response = await fetch('/api/wallet/earnings?limit=10');
        const data = await response.json();
        if (data.earnings) {
          setEarnings(data.earnings);
        }
      } catch (error) {
        console.error('Error fetching earnings:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchEarnings();
  }, []);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'roi':
        return 'bg-blue-100 text-blue-800';
      case 'referral':
        return 'bg-green-100 text-green-800';
      case 'bonus':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Recent Earnings
        </h3>
        <p className="text-gray-700 font-medium">Loading...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">
        Recent Earnings
      </h3>
      {earnings.length === 0 ? (
        <div className="text-center py-8 text-gray-700 font-medium">
          <p>No earnings yet.</p>
          <p className="text-sm mt-2 text-gray-600 font-medium">Your earnings will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {earnings.map((earning) => (
            <div
              key={earning.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(earning.type)}`}
                  >
                    {earning.type.toUpperCase()}
                  </span>
                  <p className="font-semibold text-gray-900">
                    +${earning.amount.toFixed(2)}
                  </p>
                </div>
                {earning.description && (
                  <p className="text-sm text-gray-700 font-medium mt-1">
                    {earning.description}
                  </p>
                )}
                <p className="text-xs text-gray-600 font-medium mt-1">
                  {new Date(earning.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

