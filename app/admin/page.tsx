import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma, testDatabaseConnection } from '@/lib/prisma';
import AdminDashboardStats from '@/components/admin/admin-dashboard-stats';

// Mark as dynamic to ensure fresh data
export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      redirect('/admin/login');
    }

    if (user.role !== 'ADMIN') {
      redirect('/dashboard');
    }

  // Test database connection first with error handling
  let isConnected = false;
  let dbInfo: any = null;
  try {
    isConnected = await testDatabaseConnection();
    if (isConnected) {
      const { getDatabaseInfo } = await import('@/lib/prisma');
      dbInfo = await getDatabaseInfo();
      console.log('Admin Dashboard - Database info:', {
        database: dbInfo.database,
        isLocal: dbInfo.isLocal,
        environment: process.env.NODE_ENV,
      });
      
      // Warn if using local database in production
      if (dbInfo.isLocal && process.env.NODE_ENV === 'production') {
        console.error('❌ CRITICAL: Production is using localhost database!');
      }
    }
  } catch (error) {
    console.error('Admin Dashboard - Database connection test failed:', error);
    isConnected = false;
  }

  if (!isConnected) {
    console.error('Admin Dashboard - Database connection failed');
    // Return error state instead of crashing
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">Welcome back, {user.name || 'Admin'}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Database Connection Error</h2>
          <p className="text-red-700 mb-2">
            Unable to connect to the database. Please check your database connection and try again.
          </p>
          {dbInfo && (
            <div className="mt-4 p-3 bg-red-100 rounded text-sm">
              <p className="font-semibold">Database Info:</p>
              <p>Database: {dbInfo.database || 'unknown'}</p>
              <p>Is Local: {dbInfo.isLocal ? 'YES ⚠️' : 'NO'}</p>
              {dbInfo.error && <p className="text-red-600">Error: {dbInfo.error}</p>}
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // Show warning if using local database in production
  if (dbInfo?.isLocal && process.env.NODE_ENV === 'production') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">Welcome back, {user.name || 'Admin'}</p>
        </div>
        <div className="bg-red-50 border-2 border-red-500 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-red-800 mb-2">⚠️ CRITICAL WARNING</h2>
          <p className="text-red-700 font-bold">
            Production environment is connected to localhost database!
          </p>
          <p className="text-sm text-red-600 mt-2">
            Database: {dbInfo.database || 'unknown'} | URL: {dbInfo.url || 'unknown'}
          </p>
          <p className="text-sm text-red-600 mt-1">
            Please update DATABASE_URL environment variable to use production database.
          </p>
        </div>
      </div>
    );
  }

  // Get statistics with error handling
  let totalUsers = 0;
  let totalDeposits = 0;
  let totalWithdrawals = 0;
  let activeInvestments = 0;
  let pendingDeposits = 0;
  let pendingWithdrawals = 0;
  let totalRevenueAmount = 0;
  let totalPayoutsAmount = 0;
  let recentDeposits: any[] = [];
  let recentWithdrawals: any[] = [];

  try {
    console.log('Admin Dashboard - Fetching statistics...');
    
    const [
      usersCount,
      depositsCount,
      withdrawalsCount,
      investmentsCount,
      pendingDepositsCount,
      pendingWithdrawalsCount,
      revenue,
      payouts,
    ] = await Promise.all([
      prisma.user.count().catch((e) => {
        console.error('Error counting users:', e);
        return 0;
      }),
      prisma.deposit.count({ where: { status: 'APPROVED' } }).catch((e) => {
        console.error('Error counting deposits:', e);
        return 0;
      }),
      prisma.withdrawal.count({ where: { status: 'APPROVED' } }).catch((e) => {
        console.error('Error counting withdrawals:', e);
        return 0;
      }),
      prisma.investment.count({ where: { status: 'ACTIVE' } }).catch((e) => {
        console.error('Error counting investments:', e);
        return 0;
      }),
      prisma.deposit.count({ where: { status: 'PENDING' } }).catch((e) => {
        console.error('Error counting pending deposits:', e);
        return 0;
      }),
      prisma.withdrawal.count({ where: { status: 'PENDING' } }).catch((e) => {
        console.error('Error counting pending withdrawals:', e);
        return 0;
      }),
      prisma.deposit.aggregate({
        where: { status: 'APPROVED' },
        _sum: { amount: true },
      }).catch((e) => {
        console.error('Error aggregating revenue:', e);
        return { _sum: { amount: null } };
      }),
      prisma.withdrawal.aggregate({
        where: { status: 'APPROVED' },
        _sum: { amount: true },
      }).catch((e) => {
        console.error('Error aggregating payouts:', e);
        return { _sum: { amount: null } };
      }),
    ]);

    totalUsers = usersCount;
    totalDeposits = depositsCount;
    totalWithdrawals = withdrawalsCount;
    activeInvestments = investmentsCount;
    pendingDeposits = pendingDepositsCount;
    pendingWithdrawals = pendingWithdrawalsCount;

    totalRevenueAmount = revenue._sum.amount
      ? typeof revenue._sum.amount === 'object' && 'toNumber' in revenue._sum.amount
        ? revenue._sum.amount.toNumber()
        : Number(revenue._sum.amount)
      : 0;

    totalPayoutsAmount = payouts._sum.amount
      ? typeof payouts._sum.amount === 'object' && 'toNumber' in payouts._sum.amount
        ? payouts._sum.amount.toNumber()
        : Number(payouts._sum.amount)
      : 0;

    console.log('Admin Dashboard - Statistics fetched:', {
      totalUsers,
      totalDeposits,
      totalWithdrawals,
      activeInvestments,
    });

    // Get recent activity
    try {
      recentDeposits = await prisma.deposit.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              email: true,
              name: true,
            },
          },
        },
      });
    } catch (e) {
      console.error('Error fetching recent deposits:', e);
      recentDeposits = [];
    }

    try {
      recentWithdrawals = await prisma.withdrawal.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              email: true,
              name: true,
            },
          },
        },
      });
    } catch (e) {
      console.error('Error fetching recent withdrawals:', e);
      recentWithdrawals = [];
    }
  } catch (error) {
    console.error('Admin Dashboard - Error fetching statistics:', error);
    // Continue with default values (all zeros)
  }


  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-2 text-gray-600">Welcome back, {user.name || 'Admin'}</p>
      </div>

      <AdminDashboardStats
        totalUsers={totalUsers}
        totalDeposits={totalDeposits}
        totalWithdrawals={totalWithdrawals}
        activeInvestments={activeInvestments}
        pendingDeposits={pendingDeposits}
        pendingWithdrawals={pendingWithdrawals}
        totalRevenue={totalRevenueAmount}
        totalPayouts={totalPayoutsAmount}
        recentDeposits={recentDeposits.map((d) => {
          try {
            return {
              id: d.id,
              amount: typeof d.amount === 'object' && 'toNumber' in d.amount ? d.amount.toNumber() : Number(d.amount || 0),
              status: d.status,
              createdAt: d.createdAt.toISOString(),
              user: d.user || { email: null, name: null },
            };
          } catch (e) {
            console.error('Error mapping deposit:', e, d);
            return {
              id: d.id || '',
              amount: 0,
              status: d.status || 'UNKNOWN',
              createdAt: d.createdAt?.toISOString() || new Date().toISOString(),
              user: d.user || { email: null, name: null },
            };
          }
        })}
        recentWithdrawals={recentWithdrawals.map((w) => {
          try {
            return {
              id: w.id,
              amount: typeof w.amount === 'object' && 'toNumber' in w.amount ? w.amount.toNumber() : Number(w.amount || 0),
              status: w.status,
              createdAt: w.createdAt.toISOString(),
              user: w.user || { email: null, name: null },
            };
          } catch (e) {
            console.error('Error mapping withdrawal:', e, w);
            return {
              id: w.id || '',
              amount: 0,
              status: w.status || 'UNKNOWN',
              createdAt: w.createdAt?.toISOString() || new Date().toISOString(),
              user: w.user || { email: null, name: null },
            };
          }
        })}
      />
    </div>
    );
  } catch (error) {
    console.error('Admin Dashboard - Fatal error:', error);
    // Return error page instead of crashing
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Dashboard</h2>
          <p className="text-red-700 mb-4">
            An error occurred while loading the dashboard. Please try refreshing the page.
          </p>
          <p className="text-sm text-red-600">
            {error instanceof Error ? error.message : 'Unknown error occurred'}
          </p>
        </div>
      </div>
    );
  }
}

