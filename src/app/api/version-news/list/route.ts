import { NextResponse } from 'next/server';
import { desc } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { versionAnnouncements } from '@/lib/db/schema';

/**
 * Feed público (sin auth) que consume la app "Notificaciones Versión" de xPhone, vía HTTP
 * directo desde el plugin (no desde el navegador) — ver VersionNewsApp en el plugin.
 * No se marca `force-static`: en Next 16 los route handlers GET ya corren sin caché por
 * defecto, así que cada petición del plugin lee el estado real de la tabla.
 */
export async function GET() {
  const rows = await db
    .select({
      version: versionAnnouncements.version,
      title: versionAnnouncements.title,
      message: versionAnnouncements.message,
      createdAt: versionAnnouncements.createdAt,
    })
    .from(versionAnnouncements)
    .orderBy(desc(versionAnnouncements.createdAt))
    .limit(50);

  return NextResponse.json(rows);
}
