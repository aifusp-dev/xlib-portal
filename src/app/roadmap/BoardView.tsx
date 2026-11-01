import type { roadmapPhases, changelogEntries } from '@/lib/db/schema';
import PluginRoadmapCard from './PluginRoadmapCard';

type Phase = typeof roadmapPhases.$inferSelect;
type Entry = typeof changelogEntries.$inferSelect;

export default function BoardView({ phases, entries }: { phases: Phase[]; entries: Entry[] }) {
    const plugins = Array.from(new Set([...phases.map((p) => p.plugin), ...entries.map((e) => e.plugin)])).sort();

    return (
        <div className="space-y-6">
            {plugins.map((plugin) => (
                <PluginRoadmapCard
                    key={plugin}
                    plugin={plugin}
                    phases={phases.filter((p) => p.plugin === plugin)}
                    entries={entries.filter((e) => e.plugin === plugin)}
                />
            ))}
            {plugins.length === 0 && (
                <p className="text-center text-ink-3 text-sm py-16">
                    Todavía no hay roadmap ni changelog publicado.
                </p>
            )}
        </div>
    );
}
