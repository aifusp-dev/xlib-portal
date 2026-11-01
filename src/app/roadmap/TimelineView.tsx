import type { roadmapPhases } from '@/lib/db/schema';
import { colorForPlugin } from '@/lib/roadmap-colors';

type Phase = typeof roadmapPhases.$inferSelect;

const STATUS_LABEL: Record<string, string> = {
    planned: 'Planeado',
    in_progress: 'En progreso',
    done: 'Completo',
};

/**
 * "Release View" del RSI tracker: columnas = release (agrupadas por `phaseName` a través de
 * TODOS los plugins), tarjetas dentro = qué entrega cada plugin en esa release. Sin changelog
 * aquí a propósito, igual que el original — es la vista de alto nivel, no el detalle fino.
 */
export default function TimelineView({ phases }: { phases: Phase[] }) {
    const releaseNames = Array.from(new Set(phases.map((p) => p.phaseName)));
    const releases = releaseNames
        .map((name) => {
            const items = phases.filter((p) => p.phaseName === name);
            const minOrder = Math.min(...items.map((p) => p.orderIndex));
            return { name, items, minOrder };
        })
        .sort((a, b) => a.minOrder - b.minOrder);

    if (releases.length === 0) {
        return (
            <p className="text-center text-ink-3 text-sm py-16">
                Todavía no hay ninguna fase sembrada para agrupar por release.
            </p>
        );
    }

    return (
        <div className="flex gap-4 overflow-x-auto pb-2">
            {releases.map((release) => (
                <div key={release.name} className="w-72 shrink-0 bg-surface-0 rounded-3xl border border-white/5 overflow-hidden">
                    <div className="px-5 py-4 border-b border-white/5">
                        <h2 className="eyebrow text-[13px] tracking-widest text-ink">{release.name}</h2>
                    </div>
                    <div className="p-4 space-y-3">
                        {release.items.map((phase) => {
                            const color = colorForPlugin(phase.plugin);
                            return (
                                <div key={phase.id} className="bg-surface-1 rounded-xl border border-white/5 p-3 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
                                        <span className="text-xs font-semibold text-ink">{phase.plugin}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="progress-track flex-1" style={{ '--roadmap-color': color } as React.CSSProperties}>
                                            <div className="progress-fill" style={{ width: `${phase.progressPercent}%` }} />
                                        </div>
                                        <span className="text-[10px] text-ink-3 font-mono tabular-nums">
                                            {phase.progressPercent}%
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-ink-3">{STATUS_LABEL[phase.status] ?? phase.status}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}
