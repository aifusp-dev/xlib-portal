import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const SYNC_DIR = path.join(process.cwd(), 'tmp_sync');

// Ensure sync directory exists
if (!fs.existsSync(SYNC_DIR)) {
    fs.mkdirSync(SYNC_DIR, { recursive: true });
}

export const generateToken = (prefix: string = 'XLIB') => {
    const random = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `${prefix}-${random}`;
};

export const saveSyncFile = async (token: string, buffer: Buffer) => {
    const filePath = path.join(SYNC_DIR, `${token}.zip`);
    fs.writeFileSync(filePath, buffer);
    
    // Auto-delete after 15 minutes
    setTimeout(() => {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`[Bridge] Expired token ${token} deleted.`);
        }
    }, 15 * 60 * 1000);

    return filePath;
};

export const getSyncFile = (token: string) => {
    const filePath = path.join(SYNC_DIR, `${token}.zip`);
    if (fs.existsSync(filePath)) {
        return filePath;
    }
    return null;
};

export const deleteSyncFile = (token: string) => {
    const filePath = path.join(SYNC_DIR, `${token}.zip`);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
};

export const cleanupOldFiles = () => {
    const now = Date.now();
    const files = fs.readdirSync(SYNC_DIR);
    files.forEach(file => {
        const filePath = path.join(SYNC_DIR, file);
        const stats = fs.statSync(filePath);
        const age = now - stats.mtimeMs;
        if (age > 15 * 60 * 1000) {
            fs.unlinkSync(filePath);
        }
    });
};
