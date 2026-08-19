import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { presets } from '@/lib/db/schema';
import { verifySession } from '@/lib/auth/dal';
import { MAX_UPLOAD_BYTES } from '@/lib/bridge';

const VALID_EDITORS = ['xfoods', 'xcrops', 'xmachines', 'xpods', 'xautomation'];

export async function POST(req: NextRequest) {
    const session = await verifySession();
    if (!session) {
        return NextResponse.json({ error: 'Tienes que loguearte con Google para publicar en Descubrir.' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const title = formData.get('title') as string | null;
    const description = formData.get('description') as string | null;
    const pluginEditor = formData.get('pluginEditor') as string | null;
    const itemId = formData.get('itemId') as string | null;

    if (!file || !title || !pluginEditor || !itemId) {
        return NextResponse.json({ error: 'Faltan campos obligatorios.' }, { status: 400 });
    }
    if (!VALID_EDITORS.includes(pluginEditor)) {
        return NextResponse.json({ error: 'Sección no reconocida.' }, { status: 400 });
    }
    if (file.size > MAX_UPLOAD_BYTES) {
        return NextResponse.json({ error: 'El paquete es demasiado grande.' }, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const inserted = await db.insert(presets).values({
        title: title.slice(0, 120),
        description: description?.slice(0, 2000) || null,
        pluginEditor,
        itemId,
        bundle: buffer.toString('base64'),
        bundleSize: buffer.byteLength,
        status: 'pending',
        authorId: session.userId,
    }).returning({ id: presets.id });

    return NextResponse.json({ success: true, id: inserted[0].id });
}
