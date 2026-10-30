import type { Metadata } from 'next';
import { isAdminAuthenticated } from '@/lib/auth';
import FounderClient from '@/components/FounderClient';
import { APP_NAME } from '@/lib/config';

export const metadata: Metadata = {
  title: `KAHO Executive HQ • Command Center`,
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function FounderHqPage() {
  const isAuth = await isAdminAuthenticated();
  return <FounderClient initialAuth={isAuth} />;
}
