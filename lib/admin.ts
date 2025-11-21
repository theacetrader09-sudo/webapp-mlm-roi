import { getCurrentUser } from '@/lib/auth';
import { UserRole } from '@prisma/client';

export async function requireAdmin() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  if (user.role !== UserRole.ADMIN) {
    throw new Error('Forbidden: Admin access required');
  }

  return user;
}

