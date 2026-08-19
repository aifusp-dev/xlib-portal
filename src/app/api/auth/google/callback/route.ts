import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { createSession } from '@/lib/auth/session';

const OAUTH_STATE_COOKIE = 'xlib_oauth_state';

export async function GET(req: NextRequest) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;
    const errorRedirect = (msg: string) =>
        NextResponse.redirect(`${baseUrl}/login?error=${encodeURIComponent(msg)}`);

    const code = req.nextUrl.searchParams.get('code');
    const state = req.nextUrl.searchParams.get('state');
    const stateCookie = req.cookies.get(OAUTH_STATE_COOKIE)?.value;

    if (!code || !state || !stateCookie) return errorRedirect('missing_code_or_state');

    const [expectedState, safeNext] = stateCookie.split(':');
    if (state !== expectedState) return errorRedirect('state_mismatch');

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) return errorRedirect('oauth_not_configured');

    // 1. Canjear el code por tokens.
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: `${baseUrl}/api/auth/google/callback`,
            grant_type: 'authorization_code',
        }),
    });
    if (!tokenRes.ok) return errorRedirect('token_exchange_failed');
    const tokenData = await tokenRes.json();

    // 2. Pedir el perfil con el access_token.
    const profileRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (!profileRes.ok) return errorRedirect('profile_fetch_failed');
    const profile = await profileRes.json() as { sub: string; email: string; name?: string; picture?: string };

    // 3. Upsert del usuario. El email de ADMIN_EMAIL siempre queda como
    // admin (también si ya existía con otro rol, para poder recuperarlo
    // sin tocar la DB a mano).
    const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
    const isAdminEmail = adminEmail && profile.email.toLowerCase() === adminEmail;

    const existing = await db.select().from(users).where(eq(users.googleSub, profile.sub)).limit(1);

    let userId: string;
    let role: string;

    if (existing[0]) {
        role = isAdminEmail ? 'admin' : existing[0].role;
        await db.update(users)
            .set({ email: profile.email, name: profile.name ?? null, avatarUrl: profile.picture ?? null, role })
            .where(eq(users.id, existing[0].id));
        userId = existing[0].id;
    } else {
        const inserted = await db.insert(users).values({
            googleSub: profile.sub,
            email: profile.email,
            name: profile.name ?? null,
            avatarUrl: profile.picture ?? null,
            role: isAdminEmail ? 'admin' : 'user',
        }).returning({ id: users.id });
        userId = inserted[0].id;
        role = isAdminEmail ? 'admin' : 'user';
    }

    await createSession({ userId, role });

    const res = NextResponse.redirect(`${baseUrl}${safeNext || '/'}`);
    res.cookies.delete(OAUTH_STATE_COOKIE);
    return res;
}
