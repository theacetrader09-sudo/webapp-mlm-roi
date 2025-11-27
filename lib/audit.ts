import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

interface AuditLogData {
  userId?: string;
  action: string;
  amount?: number | Decimal;
  before?: number | Decimal;
  after?: number | Decimal;
  meta?: Record<string, unknown>;
}

export async function createAuditLog(data: AuditLogData) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId || null,
        action: data.action,
        amount: data.amount ? new Decimal(data.amount) : null,
        before: data.before ? new Decimal(data.before) : null,
        after: data.after ? new Decimal(data.after) : null,
        meta: (data.meta as Prisma.InputJsonValue) || Prisma.JsonNull,
      },
    });
  } catch (error) {
    // Don't throw - audit logging should not break main flow
    console.error('Failed to create audit log:', error);
  }
}

