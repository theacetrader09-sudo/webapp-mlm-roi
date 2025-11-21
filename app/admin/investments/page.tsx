import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import AdminInvestmentsView from '@/components/admin/investments-view';

export default async function AdminInvestmentsPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  // Get all investments
  const investments = await prisma.investment.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    take: 100,
    select: {
      id: true,
      userId: true,
      amount: true,
      packageName: true,
      dailyROI: true,
      status: true,
      isActive: true,
      startDate: true,
      lastRoiAt: true,
      createdAt: true,
      user: {
        select: {
          email: true,
          name: true,
          referralCode: true,
        },
      },
    },
  });

  // Convert Decimal to number and serialize dates
  const investmentsWithNumbers = investments.map((inv) => ({
    id: inv.id,
    userId: inv.userId,
    amount: inv.amount,
    packageName: inv.packageName,
    dailyROI: typeof inv.dailyROI === 'object' && 'toNumber' in inv.dailyROI
      ? inv.dailyROI.toNumber()
      : Number(inv.dailyROI),
    status: inv.status,
    isActive: inv.isActive,
    startDate: inv.startDate.toISOString(),
    lastRoiAt: inv.lastRoiAt ? inv.lastRoiAt.toISOString() : null,
    createdAt: inv.createdAt.toISOString(),
    user: inv.user,
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Investments Management</h1>
        <p className="mt-2 text-gray-600">View and manage all user investments</p>
      </div>

      <AdminInvestmentsView initialInvestments={investmentsWithNumbers} />
    </div>
  );
}

