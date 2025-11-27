'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    // Auto-redirect to dashboard immediately
    router.push('/dashboard');
  }, [router]);

  // Return null - users won't see this screen, they'll be redirected
  return null;
}


