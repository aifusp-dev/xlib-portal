'use client';

import { useRef, useState, useTransition } from 'react';
import { createChangelogEntry } from './actions';

export default function ChangelogEntryForm() {
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
                const version = (form.elements.namedItem('version') as HTMLInputElement).value;
                const section = (form.elements.namedItem('section') as HTMLInputElement).value;
                const content = (form.elements.namedItem('content') as HTMLTextAreaElement).value;

                setError(null);
                startTransition(async () => {
                    try {
                        await createChangelogEntry(plugin, version, section, content);
                        formRef.current?.reset();
                    } catch (err) {
                        setError((err as Error).message);
                    }
                });
            }}
        >
            <p className="text-sm font-semibold text-ink">Nueva entrada de changelog manual</p>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-xs text-ink-3 block mb-1">Plugin (ej. RPXCore)</label>
                    <input name="plugin" className="input w-full" maxLength={64} required disabled={isPending} />
                </div>
                <div>
                    <label className="text-xs text-ink-3 block mb-1">Versión</label>
                    <input name="version" className="input w-full" maxLength={32} required disabled={isPending} />
                </div>
            </div>
            <div>
                <label className="text-xs text-ink-3 block mb-1">Sección (Added / Fixed / Changed, opcional)</label>
                <input name="section" className="input w-full" maxLength={32} disabled={isPending} />
            </div>
            <div>
                <label className="text-xs text-ink-3 block mb-1">Contenido</label>
                <textarea name="content" className="input w-full min-h-[80px]" maxLength={2000} required disabled={isPending} />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button type="submit" className="btn btn-primary" disabled={isPending}>
                {isPending ? 'Guardando…' : 'Añadir entrada'}
            </button>
        </form>
    );
}
