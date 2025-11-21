import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import BottomNavigation from '@/components/bottom-navigation';
import ReferralTreeEnhanced from '@/components/referral-tree-enhanced';
import ReferralIncomeBreakdown from '@/components/referral-income-breakdown';
import ReferralLinkCopy from '@/components/referral-link-copy';

async function getTeamMembers(userReferralCode: string) {
  try {
    // Get direct referrals
    const directReferrals = await prisma.user.findMany({
      where: {
        referredBy: userReferralCode,
      },
      select: {
        id: true,
        name: true,
        email: true,
        referralCode: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get all team members (all levels)
    const teamMembers = new Set<string>();
    const teamMap = new Map<string, {
      id: string;
      name: string | null;
      email: string;
      referralCode: string;
      createdAt: Date;
    }>();
    let currentLevel = [userReferralCode];
    const processed = new Set<string>();

    while (currentLevel.length > 0) {
      const nextLevel: string[] = [];

      for (const refCode of currentLevel) {
        if (processed.has(refCode)) continue;
        processed.add(refCode);

        const referrals = await prisma.user.findMany({
          where: {
            referredBy: refCode,
          },
          select: {
            id: true,
            name: true,
            email: true,
            referralCode: true,
            createdAt: true,
          },
        });

        for (const referral of referrals) {
          teamMembers.add(referral.id);
          teamMap.set(referral.id, referral);
          nextLevel.push(referral.referralCode);
        }
      }

      currentLevel = nextLevel;
    }

    return {
      directReferrals,
      totalTeamCount: teamMembers.size,
      allTeamMembers: Array.from(teamMap.values()),
    };
  } catch (error) {
    console.error('Error fetching team members:', error);
    return {
      directReferrals: [],
      totalTeamCount: 0,
      allTeamMembers: [],
    };
  }
}

export default async function ReferralPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const referralLink = `${baseUrl}/signup?ref=${user.referralCode}`;
  const teamData = await getTeamMembers(user.referralCode);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
              Referral Network
            </h1>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Manage your team and track referral earnings
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
        {/* Referral Link Card */}
        <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl p-6 text-white shadow-xl mb-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-purple-200 text-sm mb-2">Your Referral Link</p>
              <code className="text-sm font-mono bg-white/20 px-3 py-2 rounded-lg block break-all">
                {referralLink}
              </code>
            </div>
            <ReferralLinkCopy referralLink={referralLink} />
          </div>
        </div>

        {/* Team Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
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
              <div>
                <p className="text-sm text-gray-600">Direct Referrals</p>
                <p className="text-2xl font-bold text-gray-900">
                  {teamData.directReferrals.length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
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
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Team</p>
                <p className="text-2xl font-bold text-gray-900">
                  {teamData.totalTeamCount}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Referral Tree */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Referral Tree
          </h2>
          <ReferralTreeEnhanced />
        </div>

        {/* Referral Income Breakdown */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Referral Income Breakdown
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Click on any user to see their daily ROI contribution to your earnings
          </p>
          <ReferralIncomeBreakdown />
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}

