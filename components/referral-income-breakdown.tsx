'use client';

import { useEffect, useState } from 'react';

interface UserBreakdown {
  referralCode: string;
  totalEarnings: number;
  dailyEarnings: number;
  transactions: number;
  lastEarning: string;
  userName: string;
  userEmail: string;
  userId: string;
  joinedDate: string | null;
}

export default function ReferralIncomeBreakdown() {
  const [breakdown, setBreakdown] = useState<UserBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [dailyDetails, setDailyDetails] = useState<Array<{
    investmentId?: string;
    investmentAmount?: number;
    packageName?: string;
    dailyROI?: number;
    dailyROIAmount?: number;
    dailyCommission?: number;
    percent?: number;
    date?: string;
    amount?: number;
  }>>([]);

  useEffect(() => {
    async function fetchBreakdown() {
      try {
        const response = await fetch('/api/user/referral-income-breakdown', {
          credentials: 'include',
          cache: 'no-store',
        });
        if (response.ok) {
          const data = await response.json();
          setBreakdown(data.breakdown || []);
        } else {
          console.error('Failed to fetch referral income breakdown:', response.status);
          setBreakdown([]);
        }
      } catch (error) {
        console.error('Error fetching referral income breakdown:', error);
        setBreakdown([]);
      } finally {
        setLoading(false);
      }
    }

    fetchBreakdown();
  }, []);

  const handleUserClick = async (referralCode: string) => {
    if (selectedUser === referralCode) {
      setSelectedUser(null);
      setDailyDetails([]);
      return;
    }

    setSelectedUser(referralCode);
    // Fetch daily ROI details for this user
    try {
      const response = await fetch(`/api/user/referral-daily-details?refCode=${referralCode}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      if (response.ok) {
        const data = await response.json();
        setDailyDetails(data.details || []);
      } else {
        console.error('Failed to fetch daily details:', response.status);
        setDailyDetails([]);
      }
    } catch (error) {
      console.error('Error fetching daily details:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (breakdown.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <svg
          className="w-16 h-16 mx-auto mb-4 text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="text-lg font-medium">No referral income yet</p>
        <p className="text-sm mt-2">Earnings will appear here when your referrals start investing</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {breakdown.map((user) => (
        <div
          key={user.referralCode}
          className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
        >
          <button
            onClick={() => handleUserClick(user.referralCode)}
            className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
              <div className="flex items-center gap-3 flex-1 w-full min-w-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-600 font-semibold text-sm sm:text-base">
                    {user.userName[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">{user.userName}</p>
                  <p className="text-xs sm:text-sm text-gray-700 font-medium truncate">{user.userEmail}</p>
                  <p className="text-xs text-gray-600 font-medium mt-1">
                    Code: {user.referralCode}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                <div className="text-left sm:text-right">
                  <p className="text-base sm:text-lg font-bold text-purple-600">
                    ${user.totalEarnings.toFixed(2)}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-700 font-medium">
                    ${user.dailyEarnings.toFixed(2)}/day
                  </p>
                </div>
                <div className="ml-auto sm:ml-4">
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${
                      selectedUser === user.referralCode ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </button>

          {selectedUser === user.referralCode && (
            <div className="border-t border-gray-200 bg-gray-50 p-4">
              <h4 className="font-semibold text-gray-900 mb-3">
                Daily ROI Contribution
              </h4>
              {dailyDetails.length > 0 ? (
                <div className="space-y-2">
                  {dailyDetails.map((detail, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-lg p-3 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {detail.date || 'Today'}
                        </p>
                        <p className="text-xs text-gray-700 font-medium">
                          Investment: ${((detail.investmentAmount || 0) as number).toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-green-600">
                          +${((detail.amount || detail.dailyCommission || 0) as number).toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-700 font-medium">
                          {detail.percent || '10'}% commission
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-700 font-medium text-center py-4">
                  Loading daily details...
                </p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

