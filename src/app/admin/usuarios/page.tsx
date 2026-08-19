import { redirect } from 'next/navigation';
import { desc } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { verifySession, hasRole } from '@/lib/auth/dal';
import RoleSelect from './RoleSelect';

export default async function AdminUsersPage() {
    const session = await verifySession();
    if (!session || !hasRole(session.role, 'admin')) {
        redirect('/');
    }

    const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));

    return (
        <div className="max-w-4xl mx-auto py-12 px-6 space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-ink">Usuarios</h1>
                <p className="eyebrow mt-1">Concede el rol Verificador a quien vaya a revisar envíos de Descubrir</p>
            </div>
            <div className="bg-surface-0 rounded-3xl border border-white/5 divide-y divide-white/5">
                {allUsers.map((u) => (
                    <div key={u.id} className="flex items-center justify-between gap-4 px-6 py-4">
                        <div className="flex items-center gap-3 min-w-0">
                            {u.avatarUrl && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={u.avatarUrl} alt="" className="w-9 h-9 rounded-full flex-shrink-0" />
                            )}
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-ink truncate">{u.name || u.email}</p>
                                <p className="text-[11px] text-ink-3 truncate">{u.email}</p>
                            </div>
                        </div>
                        <RoleSelect userId={u.id} role={u.role} />
                    </div>
                ))}
                {allUsers.length === 0 && (
                    <p className="px-6 py-8 text-center text-ink-3 text-sm">Todavía no se ha logueado nadie.</p>
                )}
            </div>
        </div>
    );
}
