import { NextRequest, NextResponse } from 'next/server';

// This route is mainly for API calls, but login should use next-auth directly
// For client-side login, use signIn from next-auth/react
// This endpoint can be used for programmatic login if needed

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Note: Actual authentication is handled by next-auth Credentials Provider
    // This endpoint can be used for API-based login if needed
    // For web login, use signIn() from next-auth/react in the login page

    return NextResponse.json(
      {
        message: 'Please use next-auth signIn() function for authentication',
        redirect: '/api/auth/signin',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

