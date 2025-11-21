import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { getStartOfDayUTC } from '@/lib/roi-processor';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const searchParams = request.nextUrl.searchParams;
    const dateParam = searchParams.get('date');

    let targetDate: Date;
    if (dateParam) {
      targetDate = new Date(dateParam);
      if (isNaN(targetDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date format. Use YYYY-MM-DD' },
          { status: 400 }
        );
      }
    } else {
      targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - 1);
    }

    const dateStart = getStartOfDayUTC(targetDate);
    const dateEnd = new Date(dateStart);
    dateEnd.setUTCDate(dateEnd.getUTCDate() + 1);

    // Get all earnings for the date
    const earnings = await prisma.earnings.findMany({
      where: {
        createdAt: {
          gte: dateStart,
          lt: dateEnd,
        },
      },
      include: {
        user: {
          select: {
            email: true,
            name: true,
            referralCode: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Generate CSV
    const csvHeader = 'Date,Type,User Email,User Name,Referral Code,Amount,Description\n';
    const csvRows = earnings.map((earning) => {
      const date = earning.createdAt.toISOString().split('T')[0];
      const email = earning.user?.email || 'N/A';
      const name = earning.user?.name || 'N/A';
      const refCode = earning.user?.referralCode || 'N/A';
      const description = (earning.description || '').replace(/"/g, '""');
      return `${date},"${earning.type}","${email}","${name}","${refCode}",${earning.amount},"${description}"`;
    });

    const csv = csvHeader + csvRows.join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="daily-summary-${dateStart.toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error generating CSV:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

