import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { withAuth } from 'next-auth/middleware';

// Handle referral links FIRST - before any auth middleware
// This ensures mobile users go directly to signup, not any Telegram page
function handleReferralRedirect(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const ref = req.nextUrl.searchParams.get('ref');
  
  // If ANY page has referral code, redirect to signup immediately
  // This catches all cases including direct /signup?ref=CODE links
  if (ref) {
    const cleanRef = ref.trim().toUpperCase();
    if (cleanRef && cleanRef.length > 0 && cleanRef.length <= 20) {
      // If already on signup page, just allow it
      if (path === '/signup') {
        return null;
      }
      // Otherwise redirect to signup with referral code
      const signupUrl = new URL('/signup', req.url);
      signupUrl.searchParams.set('ref', cleanRef);
      // Use 307 redirect (temporary redirect, preserves method) for better mobile compatibility
      return NextResponse.redirect(signupUrl, 307);
    }
  }
  
  return null;
}

// Main middleware function
export default withAuth(
  function middleware(req) {
    const path = req.nextUrl.pathname;
    const token = req.nextauth.token;
    
    // Handle referral redirects FIRST (before auth checks)
    const referralRedirect = handleReferralRedirect(req);
    if (referralRedirect) {
      return referralRedirect;
    }
    
    // Admin login page - allow access without auth
    if (path === '/admin/login') {
      return NextResponse.next();
    }
    
    // Admin routes require ADMIN role
    if (path.startsWith('/admin')) {
      if (token?.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
      return NextResponse.next();
    }

    // Dashboard and deposit routes - allow if authenticated
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        const publicPaths = ['/', '/signup', '/login', '/admin/login'];
        const isPublicPath = publicPaths.includes(path) || path.startsWith('/api/');

        if (isPublicPath) {
          return true;
        }

        return !!token;
      },
    },
  }
);

export const config = {
  matcher: ['/', '/signup', '/login', '/dashboard/:path*', '/admin/:path*', '/deposit/:path*'],
};
