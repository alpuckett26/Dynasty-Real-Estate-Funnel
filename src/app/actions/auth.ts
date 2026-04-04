'use server';

import { signIn, signOut } from '@/auth';

export async function handleSignIn(email: string, password: string) {
  await signIn('credentials', { email, password, redirectTo: '/dashboard' });
}

export async function handleSignOut() {
  await signOut({ redirectTo: '/login' });
}
