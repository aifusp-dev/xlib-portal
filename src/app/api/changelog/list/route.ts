import { NextResponse } from 'next/server';
import { desc } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { changelogEntries } from '@/lib/db/schema';

/**
 * Feed público (sin auth) de changelog del ecosistema RPX/xLib, consumido por /roadmap.
 * No se marca `force-static`: en Next 16 los route handlers GET ya corren sin caché por
 * defecto (ver api/version-news/list/route.ts, mismo patrón).
 */
export async function GET() {
  const rows = await db
    .select({
      plugin: changelogEntries.plugin,
      version: changelogEntries.version,
      section: changelogEntries.section,
      content: changelogEntries.content,
      entryDate: changelogEntries.entryDate,
      source: changelogEntries.source,
    })
    .from(changelogEntries)
    .orderBy(desc(changelogEntries.entryDate));

  return NextResponse.json(rows);
}
