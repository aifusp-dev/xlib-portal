import { redirect } from 'next/navigation';
import { desc } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { versionAnnouncements } from '@/lib/db/schema';
import { verifySession, hasRole } from '@/lib/auth/dal';
import AnnouncementForm from './AnnouncementForm';
import DeleteButton from './DeleteButton';

export default async function VersionNewsAdminPage() {
    const session = await verifySession();
    if (!session || !hasRole(session.role, 'admin')) {
        redirect('/');
    }

    const announcements = await db
        .select()
        .from(versionAnnouncements)
        .orderBy(desc(versionAnnouncements.createdAt));

    return (
        <div className="max-w-4xl mx-auto py-12 px-6 space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-ink">Notificaciones Versión</h1>
                <p className="eyebrow mt-1">
                    Lo que ve cualquier xPhone en &quot;Notificaciones Versión&quot; (app preinstalada, no
                    desinstalable). Público en /api/version-news/list.
                </p>
            </div>

            <AnnouncementForm />

            <div className="bg-surface-0 rounded-3xl border border-white/5 divide-y divide-white/5">
                {announcements.map((a) => (
                    <div key={a.id} className="flex items-start justify-between gap-4 px-6 py-4">
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-ink">
                                <span className="text-yellow-400">v{a.version}</span> — {a.title}
                            </p>
                            <p className="text-xs text-ink-3 mt-1 whitespace-pre-wrap">{a.message}</p>
                            <p className="text-[11px] text-ink-3 mt-1">{a.createdAt.toLocaleString('es-ES')}</p>
                        </div>
                        <DeleteButton id={a.id} />
                    </div>
                ))}
                {announcements.length === 0 && (
                    <p className="px-6 py-8 text-center text-ink-3 text-sm">Todavía no hay ningún anuncio publicado.</p>
                )}
            </div>
        </div>
    );
}
