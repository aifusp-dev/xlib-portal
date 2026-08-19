'use client';

import { useState, useTransition } from 'react';
import { changeUserRole } from './actions';

export default function RoleSelect({ userId, role }: { userId: string; role: string }) {
    const [value, setValue] = useState(role);
    const [isPending, startTransition] = useTransition();

    return (
        <select
            value={value}
            disabled={isPending}
            onChange={(e) => {
                const newRole = e.target.value;
                setValue(newRole);
                startTransition(async () => {
                    try {
                        await changeUserRole(userId, newRole);
                    } catch (err) {
                        alert('No se pudo cambiar el rol: ' + (err as Error).message);
                        setValue(role);
                    }
                });
            }}
            className="input"
        >
            <option value="user">user</option>
            <option value="verificador">verificador</option>
            <option value="admin">admin</option>
        </select>
    );
}
