import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const SYNC_DIR = path.join(process.cwd(), 'tmp_sync');
const EXPIRY_MS = 15 * 60 * 1000;
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // 20MB

// Ensure sync directory exists
if (!fs.existsSync(SYNC_DIR)) {
    fs.mkdirSync(SYNC_DIR, { recursive: true });
}

export const generateToken = (prefix: string = 'XLIB') => {
    // 16 random bytes (128 bits) so the download endpoint, which has no auth
    // or rate limiting, can't realistically be brute-forced within the
    // token's lifetime.
    const random = crypto.randomBytes(16).toString('hex').toUpperCase();
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
    }, EXPIRY_MS);

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
        if (age > EXPIRY_MS) {
            fs.unlinkSync(filePath);
        }
    });
};

// Safety net: the setTimeout scheduled per-file above is lost on process
// restart, so also sweep periodically for anything that outlived its window.
setInterval(cleanupOldFiles, 5 * 60 * 1000);
