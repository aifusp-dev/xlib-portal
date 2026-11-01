'use client';

import { useRef, useState, useTransition } from 'react';
import { createPhase } from './actions';

export default function PhaseForm() {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const formRef = useRef<HTMLFormElement>(null);

    return (
        <form
            ref={formRef}
            className="bg-surface-0 rounded-3xl border border-white/5 p-6 space-y-4"
            onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const plugin = (form.elements.namedItem('plugin') as HTMLInputElement).value;
                const phaseName = (form.elements.namedItem('phaseName') as HTMLInputElement).value;
                const status = (form.elements.namedItem('status') as HTMLSelectElement).value;
                const description = (form.elements.namedItem('description') as HTMLTextAreaElement).value;
                const orderIndex = Number((form.elements.namedItem('orderIndex') as HTMLInputElement).value || 0);
                const progressPercent = Number((form.elements.namedItem('progressPercent') as HTMLInputElement).value || 0);

                setError(null);
                startTransition(async () => {
                    try {
                        await createPhase(plugin, phaseName, status, description, orderIndex, progressPercent);
                        formRef.current?.reset();
                    } catch (err) {
                        setError((err as Error).message);
                    }
                });
            }}
        >
            <p className="text-sm font-semibold text-ink">Nueva fase</p>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-xs text-ink-3 block mb-1">Plugin (ej. RPXCore)</label>
                    <input name="plugin" className="input w-full" maxLength={64} required disabled={isPending} />
                </div>
                <div>
                    <label className="text-xs text-ink-3 block mb-1">Orden</label>
                    <input name="orderIndex" type="number" defaultValue={0} className="input w-full" disabled={isPending} />
                </div>
            </div>
            <div>
                <label className="text-xs text-ink-3 block mb-1">Nombre de fase</label>
                <input name="phaseName" className="input w-full" maxLength={120} required disabled={isPending} />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-xs text-ink-3 block mb-1">Estado</label>
                    <select name="status" className="input w-full" defaultValue="planned" disabled={isPending}>
                        <option value="planned">Planeado</option>
                        <option value="in_progress">En progreso</option>
                        <option value="done">Completo</option>
                    </select>
                </div>
                <div>
                    <label className="text-xs text-ink-3 block mb-1">Progreso (%)</label>
                    <input
                        name="progressPercent"
                        type="number"
                        min={0}
                        max={100}
                        defaultValue={0}
                        className="input w-full"
                        disabled={isPending}
                    />
                </div>
            </div>
            <div>
                <label className="text-xs text-ink-3 block mb-1">Descripción</label>
                <textarea name="description" className="input w-full min-h-[80px]" maxLength={2000} disabled={isPending} />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button type="submit" className="btn btn-primary" disabled={isPending}>
                {isPending ? 'Guardando…' : 'Añadir fase'}
            </button>
        </form>
    );
}
