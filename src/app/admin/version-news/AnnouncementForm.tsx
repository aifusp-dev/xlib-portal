'use client';

import { useRef, useState, useTransition } from 'react';
import { createAnnouncement } from './actions';

export default function AnnouncementForm() {
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
                const version = (form.elements.namedItem('version') as HTMLInputElement).value;
                const title = (form.elements.namedItem('title') as HTMLInputElement).value;
                const message = (form.elements.namedItem('message') as HTMLTextAreaElement).value;

                setError(null);
                startTransition(async () => {
                    try {
                        await createAnnouncement(version, title, message);
                        formRef.current?.reset();
                    } catch (err) {
                        setError((err as Error).message);
                    }
                });
            }}
        >
            <div>
                <label className="text-xs text-ink-3 block mb-1">Versión (ej. 1.4.0)</label>
                <input name="version" className="input w-full" maxLength={32} required disabled={isPending} />
            </div>
            <div>
                <label className="text-xs text-ink-3 block mb-1">Título</label>
                <input name="title" className="input w-full" maxLength={120} required disabled={isPending} />
            </div>
            <div>
                <label className="text-xs text-ink-3 block mb-1">Mensaje</label>
                <textarea name="message" className="input w-full min-h-[100px]" maxLength={2000} required disabled={isPending} />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button type="submit" className="btn btn-primary" disabled={isPending}>
                {isPending ? 'Publicando…' : 'Publicar anuncio'}
            </button>
        </form>
    );
}
