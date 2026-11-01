'use client';

import { useState } from 'react';
import { LayoutGrid, Rows3 } from 'lucide-react';
import type { roadmapPhases, changelogEntries } from '@/lib/db/schema';
import BoardView from './BoardView';
import TimelineView from './TimelineView';

type Phase = typeof roadmapPhases.$inferSelect;
type Entry = typeof changelogEntries.$inferSelect;

export default function RoadmapViews({ phases, entries }: { phases: Phase[]; entries: Entry[] }) {
    const [view, setView] = useState<'board' | 'timeline'>('board');

    return (
        <div className="space-y-6">
            <div className="flex gap-2">
                <button className="tab" data-active={view === 'board'} onClick={() => setView('board')}>
                    <LayoutGrid className="w-3.5 h-3.5" />
                    Tablero
                </button>
                <button className="tab" data-active={view === 'timeline'} onClick={() => setView('timeline')}>
                    <Rows3 className="w-3.5 h-3.5" />
                    Timeline por release
                </button>
            </div>

            {view === 'board' ? <BoardView phases={phases} entries={entries} /> : <TimelineView phases={phases} />}
        </div>
    );
}
