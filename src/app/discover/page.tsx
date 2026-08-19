import { eq, desc } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { presets, users } from '@/lib/db/schema';
import { verifySession } from '@/lib/auth/dal';

const EDITOR_LABELS: Record<string, string> = {
    xfoods: 'Comida (xFoods)',
    xcrops: 'Cultivo (xCrops)',
    xmachines: 'Estación (xFoods)',
    xpods: 'Macetero (xCrops)',
    xautomation: 'Automatización (xCrops)',
};

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
                    <div key={preset.id} className="bg-surface-0 rounded-3xl border border-white/5 p-6 flex flex-col gap-4">
                        <div className="space-y-1">
                            <span className="badge badge-ia w-fit">{EDITOR_LABELS[preset.pluginEditor] || preset.pluginEditor}</span>
                            <h2 className="text-lg font-bold text-ink leading-tight">{preset.title}</h2>
                            <p className="text-[11px] text-ink-3">por {author.name || author.email}</p>
                        </div>
                        {preset.description && (
                            <p className="text-sm text-ink-2 line-clamp-4 flex-1">{preset.description}</p>
                        )}
                        <div className="flex items-center justify-between pt-2 border-t border-white/5">
                            <span className="eyebrow">{preset.installCount} instalación{preset.installCount === 1 ? '' : 'es'}</span>
                            <a
                                href={`/studio?installPreset=${preset.id}`}
                                className="px-4 py-2 rounded-xl bg-accent text-white text-xs font-bold uppercase tracking-wide hover:bg-accent/90 transition-colors"
                            >
                                Instalar
                            </a>
                        </div>
                    </div>
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
