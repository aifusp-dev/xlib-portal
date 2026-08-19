import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decryptSession } from '@/lib/auth/session';

// Chequeo optimista (solo lee la cookie, sin tocar la DB): la comprobación
// real de rol se repite siempre en el route handler / DAL correspondiente,
// tal como recomienda la guía de autenticación de Next para este proyecto
// (node_modules/next/dist/docs/01-app/02-guides/authentication.md).
const PROTECTED_PREFIXES = ['/discover/submit', '/moderar', '/admin'];

export default async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
    if (!isProtected) return NextResponse.next();

    const cookie = request.cookies.get('xlib_session')?.value;
    const session = await decryptSession(cookie);

    if (!session) {
        const loginUrl = new URL('/api/auth/google/start', request.url);
        loginUrl.searchParams.set('next', pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/discover/submit/:path*', '/moderar/:path*', '/admin/:path*'],
};
