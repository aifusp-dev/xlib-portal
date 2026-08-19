import 'server-only';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

const globalForDb = globalThis as unknown as { _xlibPortalSql?: ReturnType<typeof postgres> };

// Reusa la conexión entre hot-reloads en dev; en prod cada proceso crea la suya.
const sql = globalForDb._xlibPortalSql ?? postgres(process.env.DATABASE_URL!, { max: 5 });
if (process.env.NODE_ENV !== 'production') globalForDb._xlibPortalSql = sql;

export const db = drizzle(sql, { schema });
