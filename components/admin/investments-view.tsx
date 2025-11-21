'use client';

import { useState } from 'react';

interface Investment {
  id: string;
  userId: string;
  amount: number;
  packageName: string;
  dailyROI: number;
  status: string;
  isActive: boolean;
  startDate: string;
  lastRoiAt: string | null;
  createdAt: string;
  user: {
    email: string;
    name: string | null;
    referralCode: string;
  };
}

interface AdminInvestmentsViewProps {
  initialInvestments: Investment[];
}

export default function AdminInvestmentsView({ initialInvestments }: AdminInvestmentsViewProps) {
  const [investments] = useState<Investment[]>(initialInvestments);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">All Investments</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                User
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Package
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Daily ROI
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Start Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Last ROI
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {investments.map((investment) => (
              <tr key={investment.id}>
                <td className="px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium text-gray-900">
                      {investment.user.name || 'N/A'}
                    </p>
                    <p className="text-gray-700 text-xs font-medium">{investment.user.email}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                  ${investment.amount.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-xs font-medium">
                    {investment.packageName}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-indigo-600 font-medium">
                  {investment.dailyROI}%
                </td>
                <td className="px-4 py-3 text-sm">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      investment.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {investment.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700 font-medium">
                  {new Date(investment.startDate).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {investment.lastRoiAt
                    ? new Date(investment.lastRoiAt).toLocaleDateString()
                    : 'Never'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {investments.length === 0 && (
          <p className="text-center py-8 text-gray-500">No investments found</p>
        )}
      </div>
    </div>
  );
}

