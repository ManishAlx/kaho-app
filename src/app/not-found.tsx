import Link from 'next/link';
import { APP_NAME } from '@/lib/config';

export default function NotFound() {
  return (
    <div className="mx-auto my-12 max-w-lg px-4 text-center">
      <div className="card relative overflow-hidden border border-white/10 bg-[#160b20] p-8 shadow-[0_20px_60px_rgba(236,17,135,0.25)]">
        {/* Glow ambient background effect */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-48 rounded-full bg-gradient-to-r from-pink-500/30 to-orange-500/30 blur-3xl" />

        {/* Floating fun badges */}
        <div className="mb-4 flex items-center justify-center gap-2 text-3xl animate-bounce">
          <span>🛸</span>
          <span>✨</span>
          <span>🤫</span>
        </div>

        <span className="inline-block rounded-full bg-white/10 border border-white/15 px-3 py-1 text-xs font-black uppercase tracking-wider text-pink-300">
          404 • Unclaimed Territory
        </span>

        <h1 className="mt-4 text-3xl font-black text-white tracking-tight">
          Nobody is here… yet!
        </h1>

        <p className="mt-2 text-sm text-white/70 max-w-sm mx-auto leading-relaxed">
          This username or page hasn&apos;t been claimed. Claim your link on {APP_NAME} in 5 seconds and start receiving anonymous confessions, crush hints, and real truth.
        </p>

        {/* Action CTAs */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="btn btn-primary w-full sm:w-auto !py-3 !px-6 text-sm font-black shadow-lg active:scale-95"
            style={{ background: 'linear-gradient(135deg, #EC1187 0%, #FF4500 50%, #FF8D10 100%)' }}
          >
            Claim Your Username ⚡
          </Link>
          <Link
            href="/"
            className="btn border border-white/20 bg-white/5 text-white/80 hover:text-white hover:bg-white/10 w-full sm:w-auto text-sm font-bold"
          >
            Explore KAHO 🏠
          </Link>
        </div>

        <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-center gap-4 text-xs font-bold text-white/40">
          <span>🔒 100% Anonymous</span>
          <span>•</span>
          <span>⚡ Zero Friction</span>
          <span>•</span>
          <span>📸 Story Ready</span>
        </div>
      </div>
    </div>
  );
}
