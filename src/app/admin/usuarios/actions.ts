'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { verifySession, hasRole } from '@/lib/auth/dal';

const ASSIGNABLE_ROLES = ['user', 'verificador', 'admin'] as const;

export async function changeUserRole(userId: string, role: string) {
    const session = await verifySession();
    if (!session || !hasRole(session.role, 'admin')) {
        throw new Error('No autorizado');
    }
    if (!ASSIGNABLE_ROLES.includes(role as typeof ASSIGNABLE_ROLES[number])) {
        throw new Error('Rol inválido');
    }

    await db.update(users).set({ role }).where(eq(users.id, userId));
    revalidatePath('/admin/usuarios');
}
