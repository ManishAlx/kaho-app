import Link from 'next/link';
import { APP_NAME } from '@/lib/config';

export default function Footer() {
  return (
    <footer className="mx-auto mt-16 w-full max-w-5xl px-4 pb-10 text-sm muted">
      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-6" style={{ borderColor: 'var(--border)' }}>
        <p>© {new Date().getFullYear()} {APP_NAME}. Kindness is required. 13+ only.</p>
        <div className="flex gap-4">
          <Link href="/terms" className="hover:underline">Terms</Link>
          <Link href="/privacy" className="hover:underline">Privacy</Link>
        </div>
      </div>
    </footer>
  );
}
