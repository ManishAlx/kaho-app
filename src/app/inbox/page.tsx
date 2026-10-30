import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import InboxClient from '@/components/InboxClient';
import { getSessionUser } from '@/lib/auth';

export const metadata: Metadata = { title: 'Inbox', robots: { index: false } };

export default async function InboxPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  return <InboxClient username={user.username} />;
}
