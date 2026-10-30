import type { Metadata } from 'next';
import Prose from '@/components/Prose';
import { APP_NAME } from '@/lib/config';

export const metadata: Metadata = { title: 'Terms of Service' };

export default function Terms() {
  return (
    <Prose title="Terms of Service" updated="2026">
      <p>By using {APP_NAME} you agree to these terms. If you do not agree, please do not use the service.</p>
      <h2>Who can use it</h2>
      <p>You must be at least 13 years old. If you are under the age of majority where you live, you need a parent or guardian&apos;s permission.</p>
      <h2>Be kind</h2>
      <p>You must not send messages that harass, threaten, bully, sexually exploit, or spread hate. You must not share other people&apos;s personal information. Messages are automatically filtered, and accounts that abuse the service can be removed.</p>
      <h2>Anonymity</h2>
      <p>Senders are anonymous to recipients. We do not reveal sender identity to recipients, and we do not create fake messages that pretend to come from real people.</p>
      <h2>Your account</h2>
      <p>You are responsible for your password. You can delete your account and all your messages at any time in Settings.</p>
      <h2>No warranty</h2>
      <p>The service is provided &quot;as is&quot;. We may change or stop it at any time.</p>
    </Prose>
  );
}
