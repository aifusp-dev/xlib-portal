'use client';

import { useTransition } from 'react';
import { deleteAnnouncement } from './actions';

export default function DeleteButton({ id }: { id: string }) {
    const [isPending, startTransition] = useTransition();

    return (
        <button
            className="btn btn-ghost text-red-400"
            disabled={isPending}
            onClick={() => {
                if (!confirm('¿Borrar este anuncio?')) return;
                startTransition(async () => {
                    try {
                        await deleteAnnouncement(id);
                    } catch (err) {
                        alert('No se pudo borrar: ' + (err as Error).message);
                    }
                });
            }}
        >
            Borrar
        </button>
    );
}
