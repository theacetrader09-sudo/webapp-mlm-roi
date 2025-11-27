import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { prisma, testDatabaseConnection } from '@/lib/prisma';

// Mark route as dynamic to avoid static rendering issues
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('Admin users API - Starting request...');
    
    // Check admin access with error handling
    let adminUser;
    try {
      adminUser = await requireAdmin();
      console.log('Admin users API - Admin access granted for:', adminUser.email);
    } catch (authError: any) {
      console.error('Admin users API - Auth error:', authError);
      if (authError.message === 'Unauthorized' || authError.message.includes('Forbidden')) {
        return NextResponse.json(
          { error: authError.message },
          { status: authError.message === 'Unauthorized' ? 401 : 403 }
        );
      }
      // If it's a different error, log it and return 500
      return NextResponse.json(
        { 
          error: 'Authentication error', 
          details: authError.message || 'Unknown authentication error'
        },
        { status: 500 }
      );
    }

    // Test database connection first with error handling
    let isConnected = false;
    let dbInfo: any = null;
    try {
      isConnected = await testDatabaseConnection();
      if (isConnected) {
        // Get database info to verify we're using the correct database
        const { getDatabaseInfo } = await import('@/lib/prisma');
        dbInfo = await getDatabaseInfo();
        console.log('Admin users API - Database info:', {
          database: dbInfo.database,
          isLocal: dbInfo.isLocal,
        });
        
        // Warn if using local database in production
        if (dbInfo.isLocal && process.env.NODE_ENV === 'production') {
          console.error('❌ CRITICAL: Production is using localhost database!');
        }
      }
    } catch (connError) {
      console.error('Admin users API - Database connection test failed:', connError);
      isConnected = false;
    }
    
    if (!isConnected) {
      console.error('Admin users API - Database connection failed');
      return NextResponse.json(
        { 
          error: 'Database connection error', 
          details: 'Unable to connect to database. Please check your database connection.',
          code: 'CONNECTION_ERROR',
          databaseInfo: dbInfo
        },
        { status: 503 }
      );
    }
    console.log('Admin users API - Database connection verified');

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { referralCode: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role && (role === 'USER' || role === 'ADMIN')) {
      where.role = role;
    }

    console.log('Admin users API - Query params:', { search, role, page, limit, where });

    // Execute database queries with timeout protection
    let users: any[] = [];
    let total: number = 0;
    
    try {
      console.log('Admin users API - Executing database queries...');
      
      // First, get the count (simpler query)
      try {
        total = await prisma.user.count({ where });
        console.log('Admin users API - Count query successful, total:', total);
      } catch (countError: any) {
        console.error('Admin users API - Count query error:', countError);
        total = 0; // Default to 0 if count fails
      }
      
      // Then, get the users (with simplified query)
      try {
        // Use include instead of select to ensure all fields are available
        // This avoids issues with null fields in the database
        users = await prisma.user.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            wallet: {
              select: {
                balance: true,
                depositBalance: true,
                roiTotal: true,
                referralTotal: true,
              },
            },
          },
        });
        
        console.log('Admin users API - Users query successful, found:', users.length);
        console.log('Admin users API - Sample user:', users.length > 0 ? {
          id: users[0].id,
          email: users[0].email,
          hasWallet: !!users[0].wallet,
        } : 'No users');
        
        // Now get counts separately for each user (simpler approach)
        if (users.length > 0) {
          const userIds = users.map(u => u.id);
          
          // Get counts using simpler queries - count for each user individually
          // This is more reliable than groupBy
          const countPromises = userIds.map(async (userId) => {
            try {
              const [investments, deposits, withdrawals] = await Promise.all([
                prisma.investment.count({ where: { userId } }).catch(() => 0),
                prisma.deposit.count({ where: { userId } }).catch(() => 0),
                prisma.withdrawal.count({ where: { userId } }).catch(() => 0),
              ]);
              
              return {
                userId,
                investments,
                deposits,
                withdrawals,
              };
            } catch (error) {
              console.error(`Error getting counts for user ${userId}:`, error);
              return {
                userId,
                investments: 0,
                deposits: 0,
                withdrawals: 0,
              };
            }
          });
          
          const counts = await Promise.all(countPromises);
          const countsMap = new Map(counts.map(c => [c.userId, c]));
          
          // Add counts to users
          users = users.map(user => ({
            ...user,
            _count: countsMap.get(user.id) || {
              investments: 0,
              deposits: 0,
              withdrawals: 0,
            },
          }));
        }
        
        console.log('Admin users API - All queries successful, users:', users.length, 'total:', total);
      } catch (usersError: any) {
        console.error('Admin users API - Users query error:', usersError);
        console.error('Users query error details:', {
          message: usersError.message,
          code: usersError.code,
          meta: usersError.meta,
        });
        users = []; // Default to empty array if query fails
      }
      
    } catch (queryError: any) {
      console.error('Admin users API - Query error:', queryError);
      console.error('Query error details:', {
        message: queryError.message,
        code: queryError.code,
        meta: queryError.meta,
        stack: queryError.stack,
      });
      
      // Return specific error instead of throwing
      return NextResponse.json(
        { 
          error: 'Database query error', 
          details: queryError.message || 'Failed to fetch users from database',
          code: queryError.code || 'QUERY_ERROR',
          hint: 'Please check your database connection and try again.'
        },
        { status: 500 }
      );
    }

    console.log('Admin users API - Found users:', users.length, 'Total:', total);

    // Convert Decimal to number helper
    const convertToNumber = (value: any): number => {
      if (value === null || value === undefined) return 0;
      if (typeof value === 'number') return isNaN(value) ? 0 : value;
      if (typeof value === 'object' && value !== null) {
        if ('toNumber' in value && typeof value.toNumber === 'function') {
          try {
            return value.toNumber();
          } catch (e) {
            return 0;
          }
        }
        if ('toString' in value) {
          const parsed = parseFloat(value.toString());
          return isNaN(parsed) ? 0 : parsed;
        }
      }
      const parsed = parseFloat(String(value));
      return isNaN(parsed) ? 0 : parsed;
    };

    // Map users with error handling for each user
    let usersWithNumbers: any[] = [];
    try {
      usersWithNumbers = users.map((user: any) => {
        try {
          // Ensure we have all required fields
          const userData = {
            id: user.id || '',
            name: user.name || null,
            email: user.email || null, // Allow null email
            referralCode: user.referralCode || '',
            referredBy: user.referredBy || null,
            role: user.role || 'USER',
            createdAt: user.createdAt ? user.createdAt.toISOString() : new Date().toISOString(),
            wallet: user.wallet
              ? {
                  balance: convertToNumber(user.wallet.balance),
                  depositBalance: convertToNumber(user.wallet.depositBalance),
                  roiTotal: convertToNumber(user.wallet.roiTotal),
                  referralTotal: convertToNumber(user.wallet.referralTotal),
                }
              : null,
            counts: user._count || {
              investments: 0,
              deposits: 0,
              withdrawals: 0,
            },
          };
          
          // Log if email is missing (for debugging)
          if (!userData.email) {
            console.warn('User without email:', userData.id, userData.referralCode);
          }
          
          return userData;
        } catch (mapError) {
          console.error('Error mapping user:', mapError, user);
          // Return a safe default user object
          return {
            id: user?.id || '',
            name: user?.name || null,
            email: user?.email || null,
            referralCode: user?.referralCode || '',
            referredBy: user?.referredBy || null,
            role: user?.role || 'USER',
            createdAt: user?.createdAt ? user.createdAt.toISOString() : new Date().toISOString(),
            wallet: null,
            counts: {
              investments: 0,
              deposits: 0,
              withdrawals: 0,
            },
          };
        }
      });
      
      console.log('Admin users API - Mapped users:', usersWithNumbers.length);
    } catch (mappingError) {
      console.error('Admin users API - Error mapping users array:', mappingError);
      // Return empty array if mapping fails
      usersWithNumbers = [];
    }

    console.log('Admin users API - Returning', usersWithNumbers.length, 'users');
    console.log('Admin users API - Sample user:', usersWithNumbers.length > 0 ? {
      id: usersWithNumbers[0].id,
      email: usersWithNumbers[0].email,
      name: usersWithNumbers[0].name,
      hasWallet: !!usersWithNumbers[0].wallet,
    } : 'No users');

    return NextResponse.json({
      success: true,
      users: usersWithNumbers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      debug: {
        queryTotal: total,
        returnedCount: usersWithNumbers.length,
      },
    });
  } catch (error) {
    console.error('Admin users API - Error:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      if (error.message === 'Unauthorized' || error.message.includes('Forbidden')) {
        return NextResponse.json(
          { error: error.message },
          { status: error.message === 'Unauthorized' ? 401 : 403 }
        );
      }
    }

    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

