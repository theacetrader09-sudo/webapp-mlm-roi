import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const path = req.nextUrl.pathname;
    const token = req.nextauth.token;
    
    // Admin login page - allow access without auth
    if (path === '/admin/login') {
      return NextResponse.next();
    }
    
    // Admin routes require ADMIN role (except /admin/login)
    // Admin panel is completely hidden from regular users
    if (path.startsWith('/admin')) {
      // Check if user has ADMIN role
      if (token?.role !== 'ADMIN') {
        // Redirect non-admin users away from admin routes
        // Return 404-like behavior to hide admin panel existence
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
      return NextResponse.next();
    }

    // Regular user routes - ALLOW admins to access user dashboard for testing
    // This allows both panels to be open simultaneously
    if (path.startsWith('/dashboard')) {
      // Allow both regular users and admins to access dashboard
      // No redirect - let admins test both panels
      return NextResponse.next();
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to public routes
        const path = req.nextUrl.pathname;
        const publicPaths = ['/', '/signup', '/login', '/admin/login'];
        const isPublicPath = publicPaths.includes(path) || path.startsWith('/api/');

        if (isPublicPath) {
          return true;
        }

        // Require authentication for protected routes (like /dashboard, /admin)
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/deposit/:path*'],
  // Exclude admin/login from authentication requirement
};

