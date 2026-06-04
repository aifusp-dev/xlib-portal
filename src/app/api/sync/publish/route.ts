import { NextRequest, NextResponse } from 'next/server';
import { generateToken, saveSyncFile } from '@/lib/bridge';

export async function POST(req: NextRequest) {
    console.log('[Bridge API] Received publish request');
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            console.error('[Bridge API] No file found in formData');
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const token = generateToken('XLIB');
        
        await saveSyncFile(token, buffer);
        console.log(`[Bridge API] Successfully published token: ${token}`);

        return NextResponse.json({ 
            success: true, 
            token,
            expiresIn: '15m'
        });
    } catch (err) {
        console.error('[Bridge API] Publish failed:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
