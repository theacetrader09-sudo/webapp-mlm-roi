'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log the error silently
    console.error('Application error:', error);
    
    // Auto-redirect to dashboard after 2 seconds
    const timer = setTimeout(() => {
      router.push('/dashboard');
    }, 2000);

    return () => clearTimeout(timer);
  }, [error, router]);

  // Return null - users won't see this screen, they'll be redirected
  return null;
}


