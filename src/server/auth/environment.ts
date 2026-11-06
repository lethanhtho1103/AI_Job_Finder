export function allowsDevelopmentAccounts(
  environment: Record<string, string | undefined> = process.env,
) {
  return (
    environment.NODE_ENV === 'development' &&
    !environment.VERCEL &&
    environment.VERCEL_ENV !== 'production'
  );
}

export function getAuthSecret() {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error('AUTH_UNAVAILABLE');
  return secret;
}

export function isAuthConfigured() {
  try {
    getAuthSecret();
    const url = new URL(process.env.NEXTAUTH_URL ?? '');
    return (
      Boolean(process.env.DATABASE_URL) &&
      (url.protocol === 'https:' ||
        (url.protocol === 'http:' &&
          ['localhost', '127.0.0.1'].includes(url.hostname)))
    );
  } catch {
    return false;
  }
}
