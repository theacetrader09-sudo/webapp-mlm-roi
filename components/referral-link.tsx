'use client';

import { useState } from 'react';

interface ReferralLinkProps {
  link: string;
}

export default function ReferralLink({ link }: ReferralLinkProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={link}
        readOnly
        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
      />
      <button
        onClick={handleCopy}
        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );
}

