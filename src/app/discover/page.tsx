import { eq, desc } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { presets, users } from '@/lib/db/schema';
import { verifySession } from '@/lib/auth/dal';
import DiscoverCard from './DiscoverCard';

export default async function DiscoverPage() {
    const session = await verifySession();

    const approved = await db
        .select({ preset: presets, author: users })
        .from(presets)
        .innerJoin(users, eq(presets.authorId, users.id))
        .where(eq(presets.status, 'approved'))
        .orderBy(desc(presets.createdAt));

    return (
        <div className="max-w-5xl mx-auto py-12 px-6 space-y-8">
            <div className="flex items-end justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-bold text-ink">Descubrir</h1>
                    <p className="eyebrow mt-1">Configs de xFoods y xFoodsCrops verificadas, listas para instalar en tu proyecto del Studio</p>
                </div>
                {!session && (
                    <a href="/login?next=/studio" className="text-[11px] text-yellow-400 hover:underline">
                        Inicia sesión para poder publicar la tuya
                    </a>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {approved.map(({ preset, author }) => (
                    <DiscoverCard key={preset.id} preset={preset} author={author} />
                ))}
                {approved.length === 0 && (
                    <p className="col-span-full text-center text-ink-3 text-sm py-16">
                        Todavía no hay ninguna config publicada. ¡Sé el primero desde el Studio!
                    </p>
                )}
            </div>
        </div>
    );
}
