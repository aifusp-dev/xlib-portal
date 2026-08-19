const ERROR_MESSAGES: Record<string, string> = {
    missing_code_or_state: 'Google no devolvió los datos esperados. Inténtalo de nuevo.',
    state_mismatch: 'La sesión de login expiró o es inválida. Inténtalo de nuevo.',
    oauth_not_configured: 'El login con Google no está configurado en este servidor.',
    token_exchange_failed: 'Google rechazó el intercambio de credenciales.',
    profile_fetch_failed: 'No se pudo leer tu perfil de Google.',
};

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string; next?: string }>;
}) {
    const { error, next } = await searchParams;
    const startUrl = `/api/auth/google/start${next ? `?next=${encodeURIComponent(next)}` : ''}`;

    return (
        <div className="h-screen flex flex-col items-center justify-center gap-6 bg-surface-0 px-6 text-center">
            <div className="space-y-2">
                <h1 className="text-xl font-bold text-ink">Entrar en xLib Portal</h1>
                <p className="eyebrow">Necesario para publicar o moderar configs en Descubrir</p>
            </div>
            {error && (
                <p className="text-sm text-red-400 max-w-sm">{ERROR_MESSAGES[error] || 'Error desconocido al iniciar sesión.'}</p>
            )}
            <a
                href={startUrl}
                className="px-6 py-3 rounded-xl bg-yellow-400 text-black font-semibold text-sm hover:bg-yellow-300 transition-colors"
            >
                Continuar con Google
            </a>
        </div>
    );
}
