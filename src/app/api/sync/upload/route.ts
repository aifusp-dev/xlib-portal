import { NextRequest, NextResponse } from 'next/server';
import { generateToken, saveSyncFile } from '@/lib/bridge';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const token = generateToken('SYNC');
        
        await saveSyncFile(token, buffer);

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
