import type { Metadata } from 'next';
import Prose from '@/components/Prose';
import { APP_NAME } from '@/lib/config';

export const metadata: Metadata = { title: 'Privacy Policy' };

export default function Privacy() {
  return (
    <Prose title="Privacy Policy" updated="2026">
      <p>{APP_NAME} collects as little data as possible.</p>
      <h2>What we store</h2>
      <ul>
        <li>Your email, username, display name and a hashed (bcrypt) password.</li>
        <li>Messages sent to you and your replies.</li>
        <li>For each message, a one-way salted hash of the sender&apos;s IP address and browser, which rotates daily. It is used only to rate-limit spam and is never shown to anyone.</li>
      </ul>
      <h2>What we do not do</h2>
      <ul>
        <li>We never reveal who sent a message.</li>
        <li>We do not sell your data and do not show advertising.</li>
      </ul>
      <h2>Safety filtering</h2>
      <p>Messages are checked by an automated multi-layer filter (including our localized safety lexicon and Google Gemini AI) before they reach any inbox.</p>
      <h2>Deleting your data</h2>
      <p>Use Settings, then Delete account, to permanently remove your account and all messages.</p>
    </Prose>
  );
}
