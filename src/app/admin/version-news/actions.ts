'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db/client';
import { versionAnnouncements } from '@/lib/db/schema';
import { verifySession, hasRole } from '@/lib/auth/dal';

export async function createAnnouncement(version: string, title: string, message: string) {
    const session = await verifySession();
    if (!session || !hasRole(session.role, 'admin')) {
        throw new Error('No autorizado');
    }

    const cleanVersion = version.trim().slice(0, 32);
    const cleanTitle = title.trim().slice(0, 120);
    const cleanMessage = message.trim().slice(0, 2000);
    if (!cleanVersion || !cleanTitle || !cleanMessage) {
        throw new Error('Versión, título y mensaje son obligatorios');
    }

    await db.insert(versionAnnouncements).values({
        version: cleanVersion,
        title: cleanTitle,
        message: cleanMessage,
        authorId: session.userId,
    });
    revalidatePath('/admin/version-news');
}

export async function deleteAnnouncement(id: string) {
    const session = await verifySession();
    if (!session || !hasRole(session.role, 'admin')) {
        throw new Error('No autorizado');
    }

    await db.delete(versionAnnouncements).where(eq(versionAnnouncements.id, id));
    revalidatePath('/admin/version-news');
}
