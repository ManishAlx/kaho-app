import Link from 'next/link';
import { getSessionUser } from '@/lib/auth';
import { APP_NAME } from '@/lib/config';
import LogoutButton from './LogoutButton';

export default async function Header() {
  const user = await getSessionUser();
  return (
    <header className="sticky top-3 z-40 mx-auto my-3 flex w-full max-w-4xl items-center justify-between rounded-full border border-white/10 bg-[#12071d]/70 px-5 py-2.5 shadow-2xl backdrop-blur-xl transition-all">
      <Link href="/" className="flex items-center gap-2.5 text-lg font-black tracking-tight text-white group">
        <span
          className="grid h-9 w-9 place-items-center rounded-xl text-base font-black text-white shadow-md shadow-[#EC1187]/40 transition-transform duration-200 group-hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #EC1187 0%, #FF4500 50%, #FF8D10 100%)' }}
          aria-hidden
        >
          K
        </span>
        <span className="flex items-baseline gap-1.5">
          <span className="bg-gradient-to-r from-white via-white to-pink-200 bg-clip-text text-transparent">
            {APP_NAME}
          </span>
          <span className="text-[11px] font-bold text-pink-400/80 tracking-wide">कहो</span>
        </span>
      </Link>

      <nav className="flex items-center gap-2 text-xs sm:text-sm font-extrabold">
        {user ? (
          <>
            <Link
              href="/inbox"
              className="rounded-full bg-white/10 px-4 py-2 text-white hover:bg-white/20 active:scale-95 transition"
            >
              Inbox 📬
            </Link>
            <Link
              href="/settings"
              className="rounded-full px-2.5 sm:px-3 py-2 text-white/70 hover:text-white transition flex items-center gap-1"
              title="Settings"
            >
              <span className="hidden sm:inline">Settings</span>
              <span>⚙️</span>
            </Link>
            <LogoutButton />
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="rounded-full px-4 py-2 text-white/80 hover:text-white transition"
            >
              Log in
            </Link>
            <Link
              href="/login?mode=signup"
              className="rounded-full px-4 sm:px-5 py-2 text-white shadow-md shadow-[#EC1187]/40 hover:brightness-110 active:scale-95 transition-all font-black text-xs sm:text-sm"
              style={{ background: 'linear-gradient(135deg, #EC1187 0%, #FF4500 50%, #FF8D10 100%)' }}
            >
              Get my link ⚡
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
