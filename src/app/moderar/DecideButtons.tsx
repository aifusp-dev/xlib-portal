'use client';

import { useState, useTransition } from 'react';
import { decidePreset } from './actions';

export default function DecideButtons({ presetId }: { presetId: string }) {
    const [note, setNote] = useState('');
    const [isPending, startTransition] = useTransition();
    const [done, setDone] = useState<'approved' | 'rejected' | null>(null);

    if (done) {
        return (
            <p className="text-sm font-medium text-ink-2">
                {done === 'approved' ? 'Aprobado.' : 'Rechazado.'}
            </p>
        );
    }

    const decide = (decision: 'approved' | 'rejected') => {
        startTransition(async () => {
            try {
                await decidePreset(presetId, decision, note);
                setDone(decision);
            } catch (err) {
                alert('No se pudo guardar la decisión: ' + (err as Error).message);
            }
        });
    };

    return (
        <div className="space-y-3">
            <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Nota opcional (se guarda siempre; solo el autor verá por qué se rechazó)"
                className="input"
                rows={2}
            />
            <div className="flex gap-3">
                <button
                    disabled={isPending}
                    onClick={() => decide('approved')}
                    className="px-4 py-2 rounded-xl bg-green-500/15 text-green-400 text-sm font-semibold hover:bg-green-500/25 transition-colors disabled:opacity-50"
                >
                    Aprobar y publicar
                </button>
                <button
                    disabled={isPending}
                    onClick={() => decide('rejected')}
                    className="px-4 py-2 rounded-xl bg-red-500/15 text-red-400 text-sm font-semibold hover:bg-red-500/25 transition-colors disabled:opacity-50"
                >
                    Rechazar
                </button>
            </div>
        </div>
    );
}
