import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import AdminDashboardStats from '@/components/admin/admin-dashboard-stats';

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/admin/login');
  }

  if (user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  // Get statistics
  const [
    totalUsers,
    totalDeposits,
    totalWithdrawals,
    activeInvestments,
    pendingDeposits,
    pendingWithdrawals,
    totalRevenue,
    totalPayouts,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.deposit.count({ where: { status: 'APPROVED' } }),
    prisma.withdrawal.count({ where: { status: 'APPROVED' } }),
    prisma.investment.count({ where: { status: 'ACTIVE' } }),
    prisma.deposit.count({ where: { status: 'PENDING' } }),
    prisma.withdrawal.count({ where: { status: 'PENDING' } }),
    prisma.deposit.aggregate({
      where: { status: 'APPROVED' },
      _sum: { amount: true },
    }),
    prisma.withdrawal.aggregate({
      where: { status: 'APPROVED' },
      _sum: { amount: true },
    }),
  ]);

  const totalRevenueAmount = totalRevenue._sum.amount
    ? typeof totalRevenue._sum.amount === 'object' && 'toNumber' in totalRevenue._sum.amount
      ? totalRevenue._sum.amount.toNumber()
      : Number(totalRevenue._sum.amount)
    : 0;

  const totalPayoutsAmount = totalPayouts._sum.amount
    ? typeof totalPayouts._sum.amount === 'object' && 'toNumber' in totalPayouts._sum.amount
      ? totalPayouts._sum.amount.toNumber()
      : Number(totalPayouts._sum.amount)
    : 0;

  // Get recent activity
  const recentDeposits = await prisma.deposit.findMany({
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

  const recentWithdrawals = await prisma.withdrawal.findMany({
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
        recentDeposits={recentDeposits.map((d) => ({
          id: d.id,
          amount: typeof d.amount === 'object' && 'toNumber' in d.amount ? d.amount.toNumber() : Number(d.amount),
          status: d.status,
          createdAt: d.createdAt.toISOString(),
          user: d.user,
        }))}
        recentWithdrawals={recentWithdrawals.map((w) => ({
          id: w.id,
          amount: typeof w.amount === 'object' && 'toNumber' in w.amount ? w.amount.toNumber() : Number(w.amount),
          status: w.status,
          createdAt: w.createdAt.toISOString(),
          user: w.user,
        }))}
      />
    </div>
  );
}

