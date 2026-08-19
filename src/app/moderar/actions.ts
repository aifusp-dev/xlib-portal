'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db/client';
import { presets } from '@/lib/db/schema';
import { verifySession, hasRole } from '@/lib/auth/dal';

export async function decidePreset(presetId: string, decision: 'approved' | 'rejected', note?: string) {
    const session = await verifySession();
    if (!session || !hasRole(session.role, 'verificador')) {
        throw new Error('No autorizado');
    }

    await db.update(presets)
        .set({
            status: decision,
            reviewedBy: session.userId,
            reviewNote: note?.slice(0, 2000) || null,
            updatedAt: new Date(),
        })
        .where(eq(presets.id, presetId));

    revalidatePath('/moderar');
    revalidatePath('/discover');
}
