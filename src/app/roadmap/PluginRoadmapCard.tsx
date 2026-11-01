'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { colorForPlugin } from '@/lib/roadmap-colors';
import type { roadmapPhases, changelogEntries } from '@/lib/db/schema';

type Phase = typeof roadmapPhases.$inferSelect;
type Entry = typeof changelogEntries.$inferSelect;

const STATUS_STYLE: Record<string, { label: string; cls: string }> = {
    planned: { label: 'Planeado', cls: 'bg-white/5 text-ink-3 border-white/10' },
    in_progress: { label: 'En progreso', cls: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/30' },
    done: { label: 'Completo', cls: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/30' },
};

function StatusBadge({ status }: { status: string }) {
    const style = STATUS_STYLE[status] ?? STATUS_STYLE.planned;
    return (
        <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full border', style.cls)}>
            {style.label}
        </span>
    );
}

export default function PluginRoadmapCard({
    plugin,
    phases,
    entries,
}: {
    plugin: string;
    phases: Phase[];
    entries: Entry[];
}) {
    const [open, setOpen] = useState(false);
    const color = colorForPlugin(plugin);

    return (
        <div className="bg-surface-0 rounded-3xl border border-white/5 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                <h2 className="eyebrow text-[13px] tracking-widest text-ink">{plugin}</h2>
            </div>

            {phases.length > 0 && (
                <div className="px-6 py-4 space-y-4 border-b border-white/5">
                    {phases.map((phase) => (
                        <div key={phase.id} className="space-y-1.5">
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-ink">{phase.phaseName}</p>
                                    {phase.description && (
                                        <p className="text-xs text-ink-3 mt-0.5">{phase.description}</p>
                                    )}
                                </div>
                                <StatusBadge status={phase.status} />
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="progress-track flex-1" style={{ '--roadmap-color': color } as React.CSSProperties}>
                                    <div className="progress-fill" style={{ width: `${phase.progressPercent}%` }} />
                                </div>
                                <span className="text-[11px] text-ink-3 font-mono tabular-nums w-9 text-right">
                                    {phase.progressPercent}%
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <button
                onClick={() => setOpen((v) => !v)}
                className="w-full flex items-center justify-between px-6 py-3 text-xs font-semibold uppercase tracking-widest text-ink-3 hover:text-ink transition-colors"
            >
                Changelog ({entries.length})
                {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            {open && (
                <div className="px-6 pb-5 space-y-3">
                    {entries.map((entry) => (
                        <div key={entry.id} className="text-sm flex items-start gap-3">
                            <span className="pill shrink-0 mt-0.5">v{entry.version}</span>
                            <div className="min-w-0">
                                <p className="text-ink">{entry.content}</p>
                                <p className="text-[11px] text-ink-3 mt-0.5">
                                    {entry.section && <span className="uppercase tracking-wide">{entry.section}</span>}
                                    {entry.section && ' · '}
                                    {new Date(entry.entryDate).toLocaleDateString('es-ES')}
                                </p>
                            </div>
                        </div>
                    ))}
                    {entries.length === 0 && (
                        <p className="text-ink-3 text-sm">Sin entradas de changelog todavía.</p>
                    )}
                </div>
            )}
        </div>
    );
}
