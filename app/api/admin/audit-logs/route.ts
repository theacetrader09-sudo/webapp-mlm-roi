import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');
    const skip = (page - 1) * limit;
    const action = searchParams.get('action');
    const userId = searchParams.get('userId');

    const where: any = {};
    if (action) {
      where.action = { contains: action, mode: 'insensitive' };
    }
    if (userId) {
      where.userId = userId;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        // userId is a field, not a relation, so no include needed
      }),
      prisma.auditLog.count({ where }),
    ]);

    // Get user emails for logs
    const userIds = Array.from(new Set(logs.map((log) => log.userId).filter((id): id is string => Boolean(id))));
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true, name: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    const logsWithUsers = logs.map((log) => ({
      id: log.id,
      userId: log.userId,
      user: log.userId ? userMap.get(log.userId) : null,
      action: log.action,
      amount: log.amount,
      before: log.before,
      after: log.after,
      meta: log.meta,
      createdAt: log.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      logs: logsWithUsers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

