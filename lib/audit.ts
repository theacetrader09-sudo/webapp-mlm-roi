import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

interface AuditLogData {
  userId?: string;
  action: string;
  amount?: number;
  before?: number;
  after?: number;
  meta?: Record<string, unknown>;
}

export async function createAuditLog(data: AuditLogData) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId || null,
        action: data.action,
        amount: data.amount || null,
        before: data.before || null,
        after: data.after || null,
        meta: (data.meta as Prisma.InputJsonValue) || Prisma.JsonNull,
      },
    });
  } catch (error) {
    // Don't throw - audit logging should not break main flow
    console.error('Failed to create audit log:', error);
  }
}

