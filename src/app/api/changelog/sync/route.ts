import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { changelogEntries } from '@/lib/db/schema';

type SyncEntry = {
  version: string;
  section: string | null;
  content: string;
  entry_date: string | null; // YYYY-MM-DD o null (ej. "Unreleased")
};
type SyncPlugin = { name: string; entries: SyncEntry[] };

/**
 * Recibe el changelog parseado de scripts/sync-changelogs.sh (host, fuera de este contenedor
 * — los repos de plugins son privados y no se le dan credenciales git al contenedor).
 * Reemplaza, por plugin, solo las filas `source='sync'` — las añadidas a mano desde
 * /admin/roadmap (`source='manual'`) nunca se tocan aquí.
 */
export async function POST(req: NextRequest) {
  const token = req.headers.get('x-sync-token');
  if (!token || token !== process.env.CHANGELOG_SYNC_TOKEN) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = (await req.json()) as { plugins?: SyncPlugin[] };
  const plugins = body.plugins ?? [];

  let totalInserted = 0;
  await db.transaction(async (tx) => {
    for (const plugin of plugins) {
      await tx
        .delete(changelogEntries)
        .where(and(eq(changelogEntries.plugin, plugin.name), eq(changelogEntries.source, 'sync')));

      if (plugin.entries.length === 0) continue;

      await tx.insert(changelogEntries).values(
        plugin.entries.map((e) => ({
          plugin: plugin.name,
          version: e.version,
          section: e.section,
          content: e.content,
          entryDate: e.entry_date ? new Date(e.entry_date) : new Date(),
          source: 'sync' as const,
        }))
      );
      totalInserted += plugin.entries.length;
    }
  });

  return NextResponse.json({ plugins: plugins.length, entries: totalInserted });
}
