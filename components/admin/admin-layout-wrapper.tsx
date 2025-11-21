'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import AdminSidebar from './admin-sidebar';

interface AdminLayoutWrapperProps {
  children: React.ReactNode;
}

export default function AdminLayoutWrapper({ children }: AdminLayoutWrapperProps) {
  // ALL hooks must be called unconditionally in the same order
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Initialize mounted state
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle authentication check
  useEffect(() => {
    if (!mounted) return;

    // Skip auth check for login page
    if (pathname === '/admin/login') {
      setIsAuthorized(true);
      return;
    }

    // Wait for session to load
    if (status === 'loading') {
      return;
    }

    // Check authentication and role
    const checkAuth = async () => {
      if (status === 'unauthenticated') {
        router.push('/admin/login');
        return;
      }

      if (session?.user) {
        try {
          const response = await fetch('/api/user/me');
          if (!response.ok) {
            router.push('/admin/login');
            return;
          }
          
          const data = await response.json();
          
          if (data.role !== 'ADMIN') {
            router.push('/dashboard');
            return;
          }
          
          setIsAuthorized(true);
        } catch (error) {
          router.push('/admin/login');
          return;
        }
      } else {
        router.push('/admin/login');
        return;
      }
    };

    checkAuth();
  }, [mounted, status, session, router, pathname]);

  // Don't apply layout to login page
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // Show loading while checking auth
  if (!mounted || status === 'loading' || !isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="lg:pl-64">
        <main className="py-6">
          {children}
        </main>
      </div>
    </div>
  );
}

