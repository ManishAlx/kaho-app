import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import SettingsClient from '@/components/SettingsClient';
import { getSessionUser } from '@/lib/auth';

export const metadata: Metadata = { title: 'Settings', robots: { index: false } };

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  return (
    <SettingsClient
      username={user.username}
      email={user.email}
      displayName={user.displayName}
      acceptingMessages={user.acceptingMessages}
      blockedWords={user.blockedWords ?? ''}
    />
  );
}
