import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import AuthForm from '@/components/AuthForm';
import { getSessionUser } from '@/lib/auth';

export const metadata: Metadata = { title: 'Log in or sign up' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { mode?: string; username?: string };
}) {
  if (await getSessionUser()) redirect('/inbox');
  return (
    <AuthForm
      initialMode={searchParams.mode === 'signup' ? 'signup' : 'login'}
      initialUsername={searchParams.username || ''}
    />
  );
}
