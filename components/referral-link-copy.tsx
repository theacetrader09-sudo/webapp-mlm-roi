'use client';

interface ReferralLinkCopyProps {
  referralLink: string;
}

export default function ReferralLinkCopy({ referralLink }: ReferralLinkCopyProps) {
  const copyToClipboard = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(referralLink);
      // You can add a toast notification here
    }
  };

  return (
    <button
      onClick={copyToClipboard}
      className="p-3 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
    >
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
        />
      </svg>
    </button>
  );
}

