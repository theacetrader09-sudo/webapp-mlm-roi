'use client';

import { useEffect, useState } from 'react';
import DashboardStats from './dashboard-stats';

interface DashboardClientProps {
  userName: string;
  referralLink: string;
  availableBalance: number;
}

export default function DashboardClient({
  userName,
  referralLink,
  availableBalance,
}: DashboardClientProps) {
  const [todayIncome, setTodayIncome] = useState(0);
  const [teamIncome, setTeamIncome] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch today's income
        const todayRes = await fetch('/api/user/today-income', {
          credentials: 'include',
          cache: 'no-store',
        });
        if (todayRes.ok) {
          const todayData = await todayRes.json();
          setTodayIncome(Number(todayData.todayTotal) || 0);
        } else {
          console.error('Failed to fetch today income:', todayRes.status);
          setTodayIncome(0);
        }

        // Fetch team income
        const teamRes = await fetch('/api/user/team-income', {
          credentials: 'include',
          cache: 'no-store',
        });
        if (teamRes.ok) {
          const teamData = await teamRes.json();
          setTeamIncome(Number(teamData.totalTeamIncome) || 0);
        } else {
          console.error('Failed to fetch team income:', teamRes.status);
          setTeamIncome(0);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Set defaults on error
        setTodayIncome(0);
        setTeamIncome(0);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Show data immediately even if still loading (optimistic UI)
  // Only show loading spinner if we have no data at all
  if (loading && todayIncome === 0 && teamIncome === 0) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <DashboardStats
      todayIncome={todayIncome}
      teamIncome={teamIncome}
      availableBalance={availableBalance}
      userName={userName}
      referralLink={referralLink}
    />
  );
}

