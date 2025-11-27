import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(request: NextRequest) {
  try {
    // Test database connection first
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (dbConnectError: any) {
      console.error('Database connection failed:', dbConnectError);
      console.error('Database error details:', {
        code: dbConnectError.code,
        message: dbConnectError.message,
      });
      return NextResponse.json(
        { error: 'Database connection error. Please try again later.' },
        { status: 500 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (parseError: any) {
      console.error('JSON parse error:', parseError);
      return NextResponse.json(
        { error: 'Invalid request format. Please try again.' },
        { status: 400 }
      );
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request data. Please try again.' },
        { status: 400 }
      );
    }

    const { name, email, password, referralCode } = body;
    
    // Log incoming request for debugging (remove sensitive data)
    console.log('Signup request received:', {
      email: email ? `${email.substring(0, 3)}***` : 'missing',
      hasPassword: !!password,
      hasReferralCode: !!referralCode,
      referralCodeLength: referralCode?.length || 0,
    });

    // Validation - ensure email and password are strings
    if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Password length validation
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Trim and normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    let existingUser;
    try {
      existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });
    } catch (dbError: any) {
      console.error('Error checking existing user:', dbError);
      return NextResponse.json(
        { error: 'Database error. Please try again later.' },
        { status: 500 }
      );
    }

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    let hashedPassword: string;
    try {
      hashedPassword = await bcrypt.hash(password, 10);
    } catch (hashError) {
      console.error('Password hashing error:', hashError);
      return NextResponse.json(
        { error: 'Failed to process password. Please try again.' },
        { status: 500 }
      );
    }

    // Generate unique referral code (with retry limit to prevent infinite loop)
    let newReferralCode = generateReferralCode();
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;
    
    try {
      while (!isUnique && attempts < maxAttempts) {
        try {
          const existing = await prisma.user.findUnique({
            where: { referralCode: newReferralCode },
          });
          if (!existing) {
            isUnique = true;
          } else {
            newReferralCode = generateReferralCode();
            attempts++;
          }
        } catch (checkError: any) {
          console.error('Error checking referral code uniqueness:', checkError);
          // If check fails, assume it's unique and continue
          isUnique = true;
          break;
        }
      }
    } catch (error: any) {
      console.error('Error in referral code generation loop:', error);
      return NextResponse.json(
        { error: 'Unable to generate referral code. Please try again.' },
        { status: 500 }
      );
    }

    if (!isUnique) {
      console.error('Failed to generate unique referral code after', maxAttempts, 'attempts');
      return NextResponse.json(
        { error: 'Unable to create account. Please try again.' },
        { status: 500 }
      );
    }

    // Check if referral code is valid (if provided)
    // Make it case-insensitive and trim whitespace
    let referredBy = null;
    if (referralCode) {
      try {
        // Handle both string and null/undefined cases
        const refCodeStr = typeof referralCode === 'string' ? referralCode : String(referralCode || '');
        const cleanReferralCode = refCodeStr.trim().toUpperCase();
        
        // Only check if referral code is not empty after cleaning
        if (cleanReferralCode.length > 0 && cleanReferralCode.length <= 20) {
          try {
            // Add timeout to prevent hanging
            const referrer = await Promise.race([
              prisma.user.findUnique({
                where: { referralCode: cleanReferralCode },
                select: { referralCode: true },
              }),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Database query timeout')), 5000)
              )
            ]) as { referralCode: string } | null;
            
            if (referrer) {
              referredBy = referrer.referralCode; // Use the actual code from DB
              console.log('Referral code validated:', cleanReferralCode);
            } else {
              console.log('Referral code not found:', cleanReferralCode, '- continuing without referral');
              // Don't fail signup if referral code is invalid - just continue without it
            }
          } catch (dbLookupError: any) {
            // If database lookup fails, log but continue without referral
            console.error('Database error during referral code lookup:', dbLookupError);
            // Don't throw - allow signup to continue without referral
            // This prevents signup from failing if referral code lookup has issues
          }
        } else {
          console.log('Invalid referral code format:', cleanReferralCode);
        }
      } catch (refError: any) {
        // If referral code processing fails, continue without it (don't block signup)
        console.error('Referral code processing error:', refError);
        // Don't throw - allow signup to continue without referral
      }
    }
    
    // Prevent self-referral
    if (referredBy === newReferralCode) {
      console.log('Self-referral detected, removing referral');
      referredBy = null;
    }

    // Create user and wallet in a transaction
    let user;
    try {
      console.log('Creating user with data:', {
        email: normalizedEmail.substring(0, 3) + '***',
        hasReferralCode: !!referredBy,
        referralCode: newReferralCode.substring(0, 3) + '***',
      });
      
      // Use transaction to ensure atomicity
      user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            name: name?.trim() || null,
            email: normalizedEmail,
            password: hashedPassword,
            referralCode: newReferralCode,
            referredBy,
            wallet: {
              create: {
                balance: 0,
                depositBalance: 0,
                roiTotal: 0,
                referralTotal: 0,
              },
            },
          },
          include: {
            wallet: true,
          },
        });
        return newUser;
      });
      
      console.log('User created successfully:', user.id);
    } catch (dbError: any) {
      console.error('Database error during signup:', dbError);
      console.error('Error code:', dbError.code);
      console.error('Error message:', dbError.message);
      console.error('Error meta:', JSON.stringify(dbError.meta, null, 2));
      
      // Handle specific Prisma errors
      if (dbError.code === 'P2002') {
        // Unique constraint violation
        const target = dbError.meta?.target || [];
        const targetArray = Array.isArray(target) ? target : [target];
        
        if (targetArray.includes('email') || targetArray.some((t: string) => t.includes('email'))) {
          return NextResponse.json(
            { error: 'User with this email already exists' },
            { status: 400 }
          );
        }
        if (targetArray.includes('referralCode') || targetArray.some((t: string) => t.includes('referralCode'))) {
          return NextResponse.json(
            { error: 'Unable to create account. Please try again.' },
            { status: 500 }
          );
        }
        return NextResponse.json(
          { error: 'This account already exists. Please try logging in.' },
          { status: 400 }
        );
      }
      
      // Handle connection errors
      if (dbError.code === 'P1001' || dbError.code === 'P1000' || dbError.code === 'P1017') {
        return NextResponse.json(
          { error: 'Database connection error. Please try again later.' },
          { status: 500 }
        );
      }
      
      // Return detailed error in development, generic in production
      const errorMessage = process.env.NODE_ENV === 'development'
        ? `Database error: ${dbError.message || 'Unknown error'} (Code: ${dbError.code || 'N/A'})`
        : 'Unable to create account. Please try again later.';
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }

    // Remove password from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      {
        success: true,
        user: userWithoutPassword,
        message: 'User created successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Signup error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      name: error.name,
    });
    
    // Handle JSON parsing errors
    if (error instanceof SyntaxError || error.message?.includes('JSON')) {
      return NextResponse.json(
        { error: 'Invalid request data. Please check your input.' },
        { status: 400 }
      );
    }
    
    // Handle Prisma connection errors
    if (error.code === 'P1001' || error.message?.includes('connect')) {
      return NextResponse.json(
        { error: 'Database connection error. Please try again later.' },
        { status: 500 }
      );
    }
    
    // Handle other errors with more detail in development
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? (error.message || 'Unable to create account. Please try again later.')
      : 'Unable to create account. Please try again later.';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

