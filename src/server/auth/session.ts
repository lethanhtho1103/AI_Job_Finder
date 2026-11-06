import 'server-only';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { getAuthOptions } from './options';
import { isAuthConfigured } from './environment';

export const getCurrentUser = cache(async () => {
  if (!isAuthConfigured()) return null;
  const session = await getServerSession(getAuthOptions());
  return session?.user ?? null;
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return user;
}
