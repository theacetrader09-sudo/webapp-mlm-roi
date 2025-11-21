'use client';

import { useState, useEffect } from 'react';
import { PackageInfo } from '@/lib/package-assignment';
import PackageInvestmentModal from './package-investment-modal';

interface PackageCardProps {
  packageInfo: PackageInfo;
  depositBalance: number;
}

export default function PackageCard({ packageInfo, depositBalance }: PackageCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleInvestNow = () => {
    setIsModalOpen(true);
  };

  const handleSuccess = () => {
    // Refresh the page to show updated data
    window.location.reload();
  };

  const getPackageColor = (name: string) => {
    switch (name) {
      case 'Starter':
        return {
          gradient: 'from-green-500 to-emerald-600',
          bg: 'bg-green-50',
          text: 'text-green-700',
          border: 'border-green-200',
        };
      case 'Silver':
        return {
          gradient: 'from-gray-400 to-gray-600',
          bg: 'bg-gray-50',
          text: 'text-gray-700',
          border: 'border-gray-200',
        };
      case 'Gold':
        return {
          gradient: 'from-yellow-400 to-yellow-600',
          bg: 'bg-yellow-50',
          text: 'text-yellow-700',
          border: 'border-yellow-200',
        };
      default:
        return {
          gradient: 'from-purple-500 to-purple-600',
          bg: 'bg-purple-50',
          text: 'text-purple-700',
          border: 'border-purple-200',
        };
    }
  };

  const colors = getPackageColor(packageInfo.name);

  return (
    <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 hover:border-purple-300 transition-all hover:shadow-xl overflow-hidden">
      {/* Package Header */}
      <div className={`bg-gradient-to-br ${colors.gradient} p-6 text-white`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-2xl font-bold">{packageInfo.name}</h3>
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            {packageInfo.name === 'Starter' && (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            )}
            {packageInfo.name === 'Silver' && (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941a3.709 3.709 0 01-1.599-.921c-.247-.167-.5-.319-.762-.454A2 2 0 007 10H5a2 2 0 00-2 2v1a2 2 0 002 2h2a2 2 0 002-2v-1a2 2 0 00-.293-1.025c.247-.167.5-.319.762-.454.626-.319 1.354-.546 2.008-.645A4.535 4.535 0 0011 9.092V7.151c.391.127.74.29 1.049.478A2 2 0 0013 8h2a2 2 0 002-2v1a2 2 0 00-2-2h-2a2 2 0 00-.293 1.025c-.247-.167-.5-.319-.762-.454A3.709 3.709 0 0111 5.05V3z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            {packageInfo.name === 'Gold' && (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941a3.709 3.709 0 01-1.599-.921c-.247-.167-.5-.319-.762-.454A2 2 0 007 10H5a2 2 0 00-2 2v1a2 2 0 002 2h2a2 2 0 002-2v-1a2 2 0 00-.293-1.025c.247-.167.5-.319.762-.454.626-.319 1.354-.546 2.008-.645A4.535 4.535 0 0011 9.092V7.151c.391.127.74.29 1.049.478A2 2 0 0013 8h2a2 2 0 002-2v1a2 2 0 00-2-2h-2a2 2 0 00-.293 1.025c-.247-.167-.5-.319-.762-.454A3.709 3.709 0 0111 5.05V3z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
        </div>
        <p className="text-white/90 text-sm">Investment Package</p>
      </div>

      {/* Package Details */}
      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-3xl font-bold text-gray-900">
              {packageInfo.dailyROI}%
            </span>
            <span className="text-gray-600">daily ROI</span>
          </div>
          <div className={`${colors.bg} ${colors.border} border rounded-lg p-4 mb-4`}>
            <p className="text-xs text-gray-600 mb-1">Investment Range</p>
            <p className="text-lg font-semibold text-gray-900">
              ${packageInfo.minAmount.toLocaleString()} - ${packageInfo.maxAmount.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <svg
              className="w-5 h-5 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Daily returns guaranteed
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <svg
              className="w-5 h-5 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Automatic daily payments
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <svg
              className="w-5 h-5 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Instant activation
          </div>
        </div>

        {/* Invest Now Button */}
        <button
          onClick={handleInvestNow}
          className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          Invest Now
        </button>
      </div>

      {/* Investment Modal */}
      <PackageInvestmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
        packageInfo={packageInfo}
        depositBalance={depositBalance}
      />
    </div>
  );
}

