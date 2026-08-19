import { previewPresetBundle } from '@/lib/preset-preview';
import DecideButtons from './DecideButtons';
import type { presets, users } from '@/lib/db/schema';

type Preset = typeof presets.$inferSelect;
type User = typeof users.$inferSelect;

/** Server Component async: RSC sí sabe renderizar `<Async />` como JSX, a diferencia de un
 * `.map(async ...)` embebido directamente en el arbol (eso deja promesas sin resolver). */
export default async function PendingPresetCard({ preset, author }: { preset: Preset; author: User }) {
    const ymlFiles = await previewPresetBundle(preset.bundle);

    return (
        <div className="bg-surface-0 rounded-3xl border border-white/5 overflow-hidden">
            <div className="p-6 space-y-2 border-b border-white/5">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-ink">{preset.title}</h2>
                        <p className="text-[11px] text-ink-3">
                            {preset.pluginEditor} · {preset.itemId} · por {author.name || author.email}
                        </p>
                    </div>
                    <span className="eyebrow flex-shrink-0">{(preset.bundleSize / 1024).toFixed(1)} KB</span>
                </div>
                {preset.description && <p className="text-sm text-ink-2">{preset.description}</p>}
            </div>

            <div className="p-6 space-y-4 max-h-96 overflow-auto bg-black/20">
                {ymlFiles.map((f) => (
                    <div key={f.path}>
                        <p className="text-[10px] font-mono text-yellow-400/70 mb-1">{f.path}</p>
                        <pre className="text-[11px] font-mono text-blue-200 whitespace-pre-wrap break-words">{f.content}</pre>
                    </div>
                ))}
                {ymlFiles.length === 0 && <p className="text-sm text-ink-3">Este paquete no incluye ningún .yml (raro — revísalo con cuidado).</p>}
            </div>

            <div className="p-6 border-t border-white/5">
                <DecideButtons presetId={preset.id} />
            </div>
        </div>
    );
}
