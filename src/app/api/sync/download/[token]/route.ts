import { NextRequest, NextResponse } from 'next/server';
import { getSyncFile, deleteSyncFile } from '@/lib/bridge';
import fs from 'fs';

export async function GET(
    req: NextRequest,
    context: any
) {
    try {
        const { token } = await context.params;
        const filePath = getSyncFile(token);

        if (!filePath) {
            return NextResponse.json({ error: 'Token invalid or expired' }, { status: 404 });
        }

        const fileBuffer = fs.readFileSync(filePath);
        
        // Delete file after download for security (one-time use)
        deleteSyncFile(token);

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="xlib_sync_${token}.zip"`,
            },
        });
    } catch (err) {
        console.error('[Bridge API] Download failed:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
