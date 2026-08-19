import { NextRequest, NextResponse } from 'next/server';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { presets } from '@/lib/db/schema';
import { verifySession } from '@/lib/auth/dal';

export async function POST(req: NextRequest, context: any) {
    const session = await verifySession();
    if (!session) {
        return NextResponse.json({ error: 'Tienes que iniciar sesión con Google para instalar.' }, { status: 401 });
    }

    const { id } = await context.params;
    const rows = await db.select().from(presets).where(eq(presets.id, id)).limit(1);
    const preset = rows[0];
    if (!preset || preset.status !== 'approved') {
        return NextResponse.json({ error: 'Config no encontrada o no publicada.' }, { status: 404 });
    }

    await db.update(presets).set({ installCount: sql`${presets.installCount} + 1` }).where(eq(presets.id, id));

    const buffer = Buffer.from(preset.bundle, 'base64');
    return new NextResponse(buffer, {
        headers: {
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="${preset.itemId}.zip"`,
        },
    });
}
