import 'server-only';
import { cache } from 'react';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { readSessionCookie } from './session';

export type Role = 'user' | 'verificador' | 'admin';

/**
 * Comprobación de sesión, cacheada por render (React cache()) para no volver
 * a decodificar el JWT en cada llamada dentro del mismo request. Devuelve
 * null si no hay sesión válida — quien la llame decide si eso implica
 * redirigir o simplemente ocultar UI.
 */
export const verifySession = cache(async () => {
  const session = await readSessionCookie();
  if (!session) return null;
  return session;
});

/** Usuario completo desde la DB (para email/nombre/avatar), o null. */
export const getCurrentUser = cache(async () => {
  const session = await verifySession();
  if (!session) return null;

  const rows = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  return rows[0] ?? null;
});

const ROLE_RANK: Record<Role, number> = { user: 0, verificador: 1, admin: 2 };

export const hasRole = (role: string | undefined, min: Role) =>
  ROLE_RANK[(role as Role) ?? 'user'] >= ROLE_RANK[min];
