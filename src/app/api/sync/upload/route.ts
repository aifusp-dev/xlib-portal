import { NextRequest, NextResponse } from 'next/server';
import { generateToken, saveSyncFile, MAX_UPLOAD_BYTES } from '@/lib/bridge';

export async function POST(req: NextRequest) {
    console.log('[Bridge API] Received upload request from server');
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            console.error('[Bridge API] No file found in formData from server');
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        if (file.size > MAX_UPLOAD_BYTES) {
            console.error(`[Bridge API] Upload rejected: ${file.size} bytes exceeds limit`);
            return NextResponse.json({ error: 'File too large' }, { status: 413 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const token = generateToken('SYNC');
        
        await saveSyncFile(token, buffer);
        console.log(`[Bridge API] Successfully saved upload with token: ${token}`);

        return NextResponse.json({ 
            success: true, 
            token,
            expiresIn: '15m'
        });
    } catch (err) {
        console.error('[Bridge API] Upload failed:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
