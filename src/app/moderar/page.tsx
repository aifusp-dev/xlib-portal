import { redirect } from 'next/navigation';
import { eq, desc } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { presets, users } from '@/lib/db/schema';
import { verifySession, hasRole } from '@/lib/auth/dal';
import PendingPresetCard from './PendingPresetCard';

export default async function ModerarPage() {
    const session = await verifySession();
    if (!session || !hasRole(session.role, 'verificador')) {
        redirect('/');
    }

    const pending = await db
        .select({ preset: presets, author: users })
        .from(presets)
        .innerJoin(users, eq(presets.authorId, users.id))
        .where(eq(presets.status, 'pending'))
        .orderBy(desc(presets.createdAt));

    return (
        <div className="max-w-4xl mx-auto py-12 px-6 space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-ink">Moderar envíos</h1>
                <p className="eyebrow mt-1">{pending.length} pendiente{pending.length === 1 ? '' : 's'}</p>
            </div>

            <div className="space-y-6">
                {pending.map(({ preset, author }) => (
                    <PendingPresetCard key={preset.id} preset={preset} author={author} />
                ))}
                {pending.length === 0 && (
                    <p className="text-center text-ink-3 text-sm py-12">No hay envíos pendientes ahora mismo.</p>
                )}
            </div>
        </div>
    );
}
