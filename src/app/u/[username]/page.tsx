import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import SendForm from '@/components/SendForm';
import { findUserByUsername } from '@/lib/db';

type Props = { params: { username: string } };

export function generateMetadata({ params }: Props): Metadata {
  const u = findUserByUsername(params.username.toLowerCase());
  if (!u) return { title: 'User not found' };
  const title = `Send @${u.username} an anonymous message 🤫`;
  const description = `No filter. Just honesty. Zero identity. 100% truth. Send an anonymous confession to ${u.displayName} on KAHO!`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'profile',
      images: ['/icon.svg'],
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
    robots: { index: false },
  };
}

export default function PublicProfile({ params }: Props) {
  const user = findUserByUsername(params.username.toLowerCase());
  if (!user) notFound();

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      style={{
        background: '#EC1187 linear-gradient(135deg, #EC1187 0%, #FF4500 50%, #FF8D10 100%)',
      }}
    >
      <div className="mx-auto w-full max-w-lg px-3 py-6">
        <SendForm
          username={user.username}
          displayName={user.displayName}
          accepting={user.acceptingMessages}
        />
      </div>
    </div>
  );
}
