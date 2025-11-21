interface TeamStatsProps {
  directReferrals: number;
  teamCount: number;
}

export default function TeamStats({
  directReferrals,
  teamCount,
}: TeamStatsProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Team Statistics</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Direct Referrals</p>
          <p className="text-2xl font-bold text-blue-600">{directReferrals}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Total Team</p>
          <p className="text-2xl font-bold text-green-600">{teamCount}</p>
        </div>
      </div>
    </div>
  );
}

