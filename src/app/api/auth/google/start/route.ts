import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

const OAUTH_STATE_COOKIE = 'xlib_oauth_state';

export async function GET(req: NextRequest) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (!clientId || !baseUrl) {
        return NextResponse.json({ error: 'Google OAuth no está configurado (faltan GOOGLE_CLIENT_ID / NEXT_PUBLIC_BASE_URL)' }, { status: 500 });
    }

    // CSRF: state aleatorio guardado en una cookie de corta vida, comparado
    // en el callback contra el que devuelve Google.
    const state = randomBytes(16).toString('hex');

    // Adónde volver tras loguearse (p.ej. la página de Descubrir desde la
    // que se pulsó "Publicar"). Solo se acepta una ruta relativa propia.
    const next = req.nextUrl.searchParams.get('next');
    const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : '/';

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', `${baseUrl}/api/auth/google/callback`);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'openid email profile');
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('prompt', 'select_account');

    const res = NextResponse.redirect(authUrl);
    res.cookies.set(OAUTH_STATE_COOKIE, `${state}:${safeNext}`, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 10,
    });
    return res;
}
