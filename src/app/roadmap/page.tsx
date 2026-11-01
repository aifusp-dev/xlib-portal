import { asc, desc } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { roadmapPhases, changelogEntries } from '@/lib/db/schema';
import RoadmapViews from './RoadmapViews';

// Sin cookies()/verifySession() que opte automáticamente por dynamic (a diferencia de
// /discover o /admin/*), así que Next intentaría prerenderizar esta página en build time
// y fallaría si la BD no es alcanzable entonces. Forzado explícito, además de que el
// contenido debe ser siempre fresco (igual que /api/version-news/list).
export const dynamic = 'force-dynamic';

export default async function RoadmapPage() {
    const [phases, entries] = await Promise.all([
        db.select().from(roadmapPhases).orderBy(asc(roadmapPhases.plugin), asc(roadmapPhases.orderIndex)),
        db.select().from(changelogEntries).orderBy(desc(changelogEntries.entryDate)),
    ]);

    return (
        <div className="max-w-6xl mx-auto py-12 px-6 space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-ink">Roadmap RPX</h1>
                <p className="eyebrow mt-1">
                    Fases de desarrollo y changelog del ecosistema RPX + xLib. El changelog se genera
                    automáticamente desde el CHANGELOG.md de cada plugin.
                </p>
            </div>

            <RoadmapViews phases={phases} entries={entries} />
        </div>
    );
}
