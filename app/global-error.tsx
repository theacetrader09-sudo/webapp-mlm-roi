'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log the error silently
    console.error('Global error:', error);
    
    // Auto-redirect to dashboard after 1 second
    const timer = setTimeout(() => {
      router.push('/dashboard');
    }, 1000);

    return () => clearTimeout(timer);
  }, [error, router]);

  // Return null - users won't see this screen, they'll be redirected
  return null;
}


