'use client';

import { useState } from 'react';

interface CopyButtonProps {
  referralLink: string;
}

export default function CopyButton({ referralLink }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy link');
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
    >
      {copied ? 'Copied!' : 'Copy Link'}
    </button>
  );
}

