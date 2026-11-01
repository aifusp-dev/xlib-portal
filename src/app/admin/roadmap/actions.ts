'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db/client';
import { roadmapPhases, changelogEntries } from '@/lib/db/schema';
import { verifySession, hasRole } from '@/lib/auth/dal';

async function requireAdmin() {
    const session = await verifySession();
    if (!session || !hasRole(session.role, 'admin')) {
        throw new Error('No autorizado');
    }
    return session;
}

export async function createPhase(
    plugin: string,
    phaseName: string,
    status: string,
    description: string,
    orderIndex: number
) {
    const session = await requireAdmin();

    const cleanPlugin = plugin.trim().slice(0, 64);
    const cleanPhaseName = phaseName.trim().slice(0, 120);
    const cleanDescription = description.trim().slice(0, 2000);
    if (!cleanPlugin || !cleanPhaseName) {
        throw new Error('Plugin y nombre de fase son obligatorios');
    }
    if (!['planned', 'in_progress', 'done'].includes(status)) {
        throw new Error('Estado inválido');
    }

    await db.insert(roadmapPhases).values({
        plugin: cleanPlugin,
        phaseName: cleanPhaseName,
        status,
        description: cleanDescription || null,
        orderIndex,
        authorId: session.userId,
    });
    revalidatePath('/admin/roadmap');
    revalidatePath('/roadmap');
}

export async function deletePhase(id: string) {
    await requireAdmin();
    await db.delete(roadmapPhases).where(eq(roadmapPhases.id, id));
    revalidatePath('/admin/roadmap');
    revalidatePath('/roadmap');
}

export async function createChangelogEntry(
    plugin: string,
    version: string,
    section: string,
    content: string
) {
    const session = await requireAdmin();

    const cleanPlugin = plugin.trim().slice(0, 64);
    const cleanVersion = version.trim().slice(0, 32);
    const cleanSection = section.trim().slice(0, 32);
    const cleanContent = content.trim().slice(0, 2000);
    if (!cleanPlugin || !cleanVersion || !cleanContent) {
        throw new Error('Plugin, versión y contenido son obligatorios');
    }

    await db.insert(changelogEntries).values({
        plugin: cleanPlugin,
        version: cleanVersion,
        section: cleanSection || null,
        content: cleanContent,
        source: 'manual',
        authorId: session.userId,
    });
    revalidatePath('/admin/roadmap');
    revalidatePath('/roadmap');
}

export async function deleteChangelogEntry(id: string) {
    await requireAdmin();
    await db.delete(changelogEntries).where(eq(changelogEntries.id, id));
    revalidatePath('/admin/roadmap');
    revalidatePath('/roadmap');
}
