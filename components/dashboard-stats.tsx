'use client';

import { useEffect, useState } from 'react';

interface DashboardStatsProps {
  todayIncome: number;
  teamIncome: number;
  availableBalance: number;
  userName: string;
  referralLink: string;
}

export default function DashboardStats({
  todayIncome,
  teamIncome,
  availableBalance,
  userName,
  referralLink,
}: DashboardStatsProps) {
  const [animatedTodayIncome, setAnimatedTodayIncome] = useState(0);
  const [animatedTeamIncome, setAnimatedTeamIncome] = useState(0);
  const [animatedBalance, setAnimatedBalance] = useState(0);

  useEffect(() => {
    // Animate numbers
    const duration = 1500;
    const steps = 60;
    const stepDuration = duration / steps;

    const animateValue = (
      start: number,
      end: number,
      setter: (value: number) => void
    ) => {
      let currentStep = 0;
      const increment = (end - start) / steps;

      const timer = setInterval(() => {
        currentStep++;
        const value = start + increment * currentStep;
        setter(Math.min(value, end));

        if (currentStep >= steps) {
          clearInterval(timer);
          setter(end);
        }
      }, stepDuration);
    };

    animateValue(0, todayIncome, setAnimatedTodayIncome);
    animateValue(0, teamIncome, setAnimatedTeamIncome);
    animateValue(0, availableBalance, setAnimatedBalance);
  }, [todayIncome, teamIncome, availableBalance]);

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    // You can add a toast notification here
  };

  return (
    <div className="space-y-6">
        {/* User Welcome Card */}
      <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-white/90 text-sm font-medium mb-1">Welcome back,</p>
            <h2 className="text-2xl font-bold text-white">{userName || 'User'}</h2>
          </div>
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
        </div>

        {/* Referral Link */}
        <div className="bg-white/15 backdrop-blur-sm rounded-lg p-3 mt-4 border border-white/20">
          <p className="text-xs text-white/90 font-medium mb-1">Your Referral Link</p>
          <div className="flex items-center gap-2">
            <code className="text-sm text-white font-mono font-semibold flex-1 truncate">
              {referralLink}
            </code>
            <button
              onClick={copyReferralLink}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Today's Income Card */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-green-600"
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
            </div>
            <span className="text-xs font-medium text-gray-500 bg-green-50 text-green-700 px-2 py-1 rounded-full">
              Today
            </span>
          </div>
          <p className="text-sm font-medium text-gray-700 mb-1">Today&apos;s Income</p>
          <p className="text-2xl font-bold text-gray-900">
            ${animatedTodayIncome.toFixed(2)}
          </p>
          <div className="mt-3 flex items-center text-xs text-green-600">
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
            Daily earnings
          </div>
        </div>

        {/* Team Income Card */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <span className="text-xs font-medium text-gray-500 bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
              Team
            </span>
          </div>
          <p className="text-sm font-medium text-gray-700 mb-1">Team Income</p>
          <p className="text-2xl font-bold text-gray-900">
            ${animatedTeamIncome.toFixed(2)}
          </p>
          <div className="mt-3 flex items-center text-xs text-blue-600">
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            From referrals
          </div>
        </div>

        {/* Available Balance Card */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-purple-600"
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
            </div>
            <span className="text-xs font-medium text-gray-500 bg-purple-50 text-purple-700 px-2 py-1 rounded-full">
              Balance
            </span>
          </div>
          <p className="text-sm font-medium text-gray-700 mb-1">Available Balance</p>
          <p className="text-2xl font-bold text-gray-900">
            ${animatedBalance.toFixed(2)}
          </p>
          <div className="mt-3 flex items-center text-xs text-purple-600">
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Ready to use
          </div>
        </div>
      </div>
    </div>
  );
}

