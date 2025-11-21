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
        const todayRes = await fetch('/api/user/today-income');
        if (todayRes.ok) {
          const todayData = await todayRes.json();
          setTodayIncome(todayData.todayTotal || 0);
        }

        // Fetch team income
        const teamRes = await fetch('/api/user/team-income');
        if (teamRes.ok) {
          const teamData = await teamRes.json();
          setTeamIncome(teamData.totalTeamIncome || 0);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
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

