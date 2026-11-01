'use client';

import { useTransition } from 'react';

export default function DeleteItemButton({
    id,
    action,
}: {
    id: string;
    action: (id: string) => Promise<void>;
}) {
    const [isPending, startTransition] = useTransition();

    return (
        <button
            className="btn btn-ghost text-red-400"
            disabled={isPending}
            onClick={() => {
                if (!confirm('¿Borrar esto?')) return;
                startTransition(async () => {
                    try {
                        await action(id);
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
