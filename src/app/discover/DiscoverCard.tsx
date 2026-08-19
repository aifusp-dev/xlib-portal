import { buildInstallPreview } from '@/lib/preset-preview';
import { EDITOR_LABELS, PluginEditor, leafId } from '@/lib/studio';
import type { presets, users } from '@/lib/db/schema';

type Preset = typeof presets.$inferSelect;
type User = typeof users.$inferSelect;

/** Server Component async, igual que PendingPresetCard en /moderar: previsualiza el contenido
 * real del paquete (yml + texturas) sin que quien lo mire tenga que instalarlo primero. */
export default async function DiscoverCard({ preset, author }: { preset: Preset; author: User }) {
    const preview = await buildInstallPreview(preset.bundle);

    return (
        <div className="bg-surface-0 rounded-3xl border border-white/5 p-6 flex flex-col gap-4">
            <div className="space-y-1">
                <span className="badge badge-ia w-fit">{EDITOR_LABELS[preset.pluginEditor as PluginEditor] || preset.pluginEditor}</span>
                <h2 className="text-lg font-bold text-ink leading-tight">{preset.title}</h2>
                <p className="text-[11px] text-ink-3">por {author.name || author.email}</p>
            </div>

            {preset.description && (
                <p className="text-sm text-ink-2 line-clamp-4">{preset.description}</p>
            )}

            {preview.textures.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {preview.textures.slice(0, 6).map((t) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={t.path} src={t.dataUri} alt="" title={t.path} className="w-10 h-10 object-contain bg-black/40 rounded-lg border border-white/10 [image-rendering:pixelated]" />
                    ))}
                </div>
            )}

            {preset.items.length > 1 && (
                <div className="flex flex-wrap gap-1.5">
                    {preset.items.map((it) => (
                        <span key={`${it.editor}:${it.itemId}`} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-ink-3">
                            {leafId(it.itemId)}
                        </span>
                    ))}
                </div>
            )}

            <details className="group">
                <summary className="text-[11px] text-yellow-400/80 cursor-pointer hover:text-yellow-400 select-none list-none flex items-center gap-1">
                    <span className="group-open:hidden">Ver qué incluye ▾</span>
                    <span className="hidden group-open:inline">Ocultar ▴</span>
                </summary>
                <div className="mt-3 space-y-3 max-h-64 overflow-auto bg-black/20 rounded-xl p-3">
                    {preview.ymlFiles.map((f) => (
                        <div key={f.path}>
                            <p className="text-[9px] font-mono text-yellow-400/60 mb-1">{f.path}</p>
                            <pre className="text-[10px] font-mono text-blue-200 whitespace-pre-wrap break-words">{f.content}</pre>
                        </div>
                    ))}
                </div>
            </details>

            <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-auto">
                <span className="eyebrow">{preset.installCount} instalación{preset.installCount === 1 ? '' : 'es'}</span>
                <a
                    href={`/studio?installPreset=${preset.id}`}
                    className="px-4 py-2 rounded-xl bg-accent text-white text-xs font-bold uppercase tracking-wide hover:bg-accent/90 transition-colors"
                >
                    Instalar
                </a>
            </div>
        </div>
    );
}
