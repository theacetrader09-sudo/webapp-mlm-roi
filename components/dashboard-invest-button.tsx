'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import InvestModal from './invest-modal';

interface DashboardInvestButtonProps {
  userBalance: number;
  onInvestmentCreated?: () => void;
}

export default function DashboardInvestButton({
  userBalance,
  onInvestmentCreated,
}: DashboardInvestButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const handleSuccess = () => {
    setIsModalOpen(false);
    // Refresh the page to show updated data
    router.refresh();
    // Also trigger callback if provided
    onInvestmentCreated?.();
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-md"
      >
        Invest Now
      </button>
      <InvestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
        userBalance={userBalance}
      />
    </>
  );
}

