'use client';

interface Referral {
  id: string;
  name: string | null;
  email: string;
  referralCode: string;
  createdAt: Date;
}

interface ReferralTreeProps {
  directReferrals: Referral[];
}

export default function ReferralTree({ directReferrals }: ReferralTreeProps) {

  if (directReferrals.length === 0) {
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
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        <p className="text-lg font-medium">No referrals yet</p>
        <p className="text-sm mt-2">Start sharing your referral link to build your team!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {directReferrals.map((referral) => (
        <div
          key={referral.id}
          className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 font-semibold">
                  {(referral.name || referral.email)[0].toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  {referral.name || 'Unknown User'}
                </p>
                <p className="text-sm text-gray-500">{referral.email}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Code: {referral.referralCode} • Joined:{' '}
                  {new Date(referral.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                Level 1
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

