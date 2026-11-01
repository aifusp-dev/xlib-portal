import { redirect } from 'next/navigation';
import { asc, desc } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { roadmapPhases, changelogEntries } from '@/lib/db/schema';
import { verifySession, hasRole } from '@/lib/auth/dal';
import PhaseForm from './PhaseForm';
import ChangelogEntryForm from './ChangelogEntryForm';
import DeleteItemButton from './DeleteItemButton';
import { deletePhase, deleteChangelogEntry } from './actions';

export default async function RoadmapAdminPage() {
    const session = await verifySession();
    if (!session || !hasRole(session.role, 'admin')) {
        redirect('/');
    }

    const [phases, entries] = await Promise.all([
        db.select().from(roadmapPhases).orderBy(asc(roadmapPhases.plugin), asc(roadmapPhases.orderIndex)),
        db.select().from(changelogEntries).orderBy(desc(changelogEntries.entryDate)),
    ]);

    return (
        <div className="max-w-4xl mx-auto py-12 px-6 space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-ink">Roadmap RPX — Admin</h1>
                <p className="eyebrow mt-1">
                    Fases a mano + entradas de changelog manual. Las entradas con origen &quot;sync&quot; vienen
                    de scripts/sync-changelogs.sh y se sobrescriben solas en el próximo sync. Público en
                    /roadmap.
                </p>
            </div>

            <PhaseForm />

            <div className="bg-surface-0 rounded-3xl border border-white/5 divide-y divide-white/5">
                {phases.map((p) => (
                    <div key={p.id} className="flex items-start justify-between gap-4 px-6 py-4">
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-ink">
                                <span className="text-yellow-400">{p.plugin}</span> — {p.phaseName}{' '}
                                <span className="text-xs text-ink-3">({p.status}, {p.progressPercent}%)</span>
                            </p>
                            {p.description && <p className="text-xs text-ink-3 mt-1 whitespace-pre-wrap">{p.description}</p>}
                        </div>
                        <DeleteItemButton id={p.id} action={deletePhase} />
                    </div>
                ))}
                {phases.length === 0 && (
                    <p className="px-6 py-8 text-center text-ink-3 text-sm">Todavía no hay ninguna fase.</p>
                )}
            </div>

            <ChangelogEntryForm />

            <div className="bg-surface-0 rounded-3xl border border-white/5 divide-y divide-white/5">
                {entries.map((e) => (
                    <div key={e.id} className="flex items-start justify-between gap-4 px-6 py-4">
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-ink">
                                <span className="text-yellow-400">{e.plugin}</span> v{e.version}
                                {e.section && <span className="text-xs text-ink-3"> · {e.section}</span>}
                                <span className="text-[11px] text-ink-3"> · {e.source}</span>
                            </p>
                            <p className="text-xs text-ink-3 mt-1 whitespace-pre-wrap">{e.content}</p>
                        </div>
                        <DeleteItemButton id={e.id} action={deleteChangelogEntry} />
                    </div>
                ))}
                {entries.length === 0 && (
                    <p className="px-6 py-8 text-center text-ink-3 text-sm">Todavía no hay ninguna entrada de changelog.</p>
                )}
            </div>
        </div>
    );
}
