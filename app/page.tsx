import { redirect } from 'next/navigation';
import Link from 'next/link';

// Force dynamic rendering to ensure redirects work
export const dynamic = 'force-dynamic';

export default function Home({
  searchParams,
}: {
  searchParams: { ref?: string };
}) {
  // Server-side redirect: If referral code is present, redirect immediately to signup
  // This works instantly on all devices including mobile
  // Middleware also handles this, but this is a backup
  if (searchParams.ref) {
    const cleanRef = searchParams.ref.trim().toUpperCase();
    if (cleanRef && cleanRef.length > 0 && cleanRef.length <= 20) {
      // Immediate server-side redirect - no client-side code runs
      redirect(`/signup?ref=${encodeURIComponent(cleanRef)}`);
    }
  }

  // If no referral code, show welcome page
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
            Welcome
          </h1>
          <p className="text-gray-600 mb-8">
            Authentication and referral system
          </p>
        </div>
        <div className="flex gap-4 justify-center">
          <Link
            href="/signup"
            className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Sign Up
          </Link>
          <Link
            href="/login"
            className="px-6 py-3 bg-white text-indigo-600 border border-indigo-600 rounded-md hover:bg-indigo-50 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
