'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { APP_NAME, GAME_MODES, type GameMode } from '@/lib/config';

export default function InteractiveLanding() {
  const router = useRouter();
  const [claimUsername, setClaimUsername] = useState('');
  const [previewMode, setPreviewMode] = useState<GameMode>(GAME_MODES[0]);
  const [previewText, setPreviewText] = useState(GAME_MODES[0].questions[0]);
  const [isRolling, setIsRolling] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimError, setClaimError] = useState('');

  async function handleClaim(e: React.FormEvent) {
    e.preventDefault();
    const clean = claimUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!clean) {
      router.push('/login?mode=signup');
      return;
    }

    setIsClaiming(true);
    setClaimError('');

    try {
      const res = await fetch('/api/auth/instant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: clean }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? 'Could not claim link');
      }

      if (data.exists) {
        // User already exists with a password, redirect to login
        router.push(`/login?username=${encodeURIComponent(clean)}`);
      } else {
        // Successfully created instant account, direct to inbox!
        router.push('/inbox');
      }
    } catch (err) {
      setClaimError(err instanceof Error ? err.message : 'Error claiming link');
      setIsClaiming(false);
    }
  }

  function rollHeroDice() {
    setIsRolling(true);
    setTimeout(() => setIsRolling(false), 500);
    const questions = previewMode.questions;
    const randomIdx = Math.floor(Math.random() * questions.length);
    setPreviewText(questions[randomIdx]);
  }

  function changePreviewMode(m: GameMode) {
    setPreviewMode(m);
    setPreviewText(m.questions[0]);
  }

  const marqueeItems = [
    '• No filter. Just honesty',
    '• Zero identity. 100% truth',
    '• send me your confessions',
    '• ask me anything',
    '• not gonna lie',
    '• send me a never have I ever',
    '• describe me in 3 words',
    '• tell me who your crush is',
    '• flood your inbox',
  ];

  return (
    <div className="relative overflow-hidden pt-2 pb-16">
      {/* Background Ambient Glowing Orbs */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[600px] rounded-full bg-gradient-to-tr from-[#EC1187]/25 to-[#FF8D10]/20 blur-[130px] -z-10" />

      {/* Top Infinite Marquee Ticker */}
      <div className="relative -mx-4 mb-10 overflow-hidden border-y border-white/10 bg-white/[0.03] py-3 backdrop-blur-md">
        <div className="animate-marquee flex gap-8 whitespace-nowrap text-xs font-black uppercase tracking-widest text-[#FF4500]">
          {[...marqueeItems, ...marqueeItems, ...marqueeItems].map((item, idx) => (
            <span key={idx} className="flex items-center gap-2">
              <span className="bg-gradient-to-r from-[#EC1187] to-[#FF8D10] bg-clip-text text-transparent">
                {item}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Hero Section */}
      <section className="grid items-center gap-12 py-6 md:grid-cols-2 md:py-16">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-pink-500/30 bg-gradient-to-r from-pink-500/15 to-orange-500/15 px-4 py-1.5 text-xs font-black tracking-wide text-pink-300 backdrop-blur-md shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[#EC1187] animate-ping" />
            <span>ANONYMOUS Q&A • कहो DIL KI BAAT</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black leading-[1.08] tracking-tight text-white">
            No filter.{' '}
            <span className="bg-gradient-to-r from-[#EC1187] via-[#FF4500] to-[#FF8D10] bg-clip-text text-transparent">
              Just honesty.
            </span>
            <br />
            <span className="text-2xl sm:text-4xl font-black text-white/90 tracking-tight mt-1.5 block">
              Zero identity.{' '}
              <span className="bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">
                100% truth.
              </span>
            </span>
          </h1>

          <p className="mt-5 max-w-lg text-base sm:text-lg font-semibold text-white/70 leading-relaxed">
            <strong className="text-white font-extrabold">{APP_NAME}</strong> gives you a private anonymous link for your Instagram & Snapchat story. Share your link, let friends speak their truth without fear, and reply with viral 9:16 story stickers.
          </p>

          {/* Quick Username Claimer Bar */}
          <form onSubmit={handleClaim} className="mt-8 flex flex-col sm:flex-row gap-2 max-w-md">
            <div className="relative flex-1 flex items-center rounded-full border border-white/20 bg-white/10 px-4 focus-within:border-[#EC1187] focus-within:ring-4 focus-within:ring-[#EC1187]/20 backdrop-blur-md transition-all">
              <span className="text-xs font-black text-white/40 select-none">kaho.link/u/</span>
              <input
                type="text"
                placeholder="yourname"
                value={claimUsername}
                onChange={(e) => setClaimUsername(e.target.value.toLowerCase())}
                className="w-full bg-transparent px-1.5 py-3.5 text-sm font-black text-white outline-none placeholder:text-white/30"
              />
            </div>
            <button
              type="submit"
              disabled={isClaiming}
              className="rounded-full px-7 py-3.5 text-sm font-black text-white shadow-xl shadow-[#EC1187]/40 hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all whitespace-nowrap flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #EC1187 0%, #FF4500 50%, #FF8D10 100%)' }}
            >
              {isClaiming ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Creating…
                </>
              ) : (
                'Get my link ⚡'
              )}
            </button>
          </form>

          {claimError && (
            <p className="mt-2 text-xs font-bold text-red-400 bg-red-950/60 border border-red-500/30 rounded-xl px-3 py-1.5 inline-block">
              ⚠️ {claimError}
            </p>
          )}

          <div className="mt-4 flex items-center gap-4 text-xs font-bold text-white/50">
            <span>⚡ No app needed for senders</span>
            <span>•</span>
            <Link href="/u/demo" className="text-pink-400 hover:text-pink-300 underline font-extrabold">
              Open demo card (@demo) →
            </Link>
          </div>
        </div>

        {/* 3D Phone Mockup with Floating Stickers */}
        <div className="relative mx-auto w-full max-w-[360px]">
          {/* Floating Bubble Sticker Top Left */}
          <div className="absolute -top-6 -left-6 z-20 hidden sm:block rounded-2xl bg-white/95 px-3.5 py-2 text-xs font-black text-gray-900 shadow-xl border border-white rotate-[-6deg] animate-pulse">
            🤫 &quot;stalked your feed last night 👀&quot;
          </div>

          {/* Floating Bubble Sticker Bottom Right */}
          <div className="absolute -bottom-6 -right-6 z-20 hidden sm:block rounded-2xl bg-gradient-to-r from-[#EC1187] to-[#FF8D10] px-4 py-2 text-xs font-black text-white shadow-xl rotate-[5deg]">
            ✨ &quot;spicy, gorgeous, iconic 💅&quot;
          </div>

          {/* Glow backdrop */}
          <div className="absolute -inset-4 rounded-[44px] bg-gradient-to-r from-[#EC1187]/40 via-[#FF4500]/30 to-[#FF8D10]/40 blur-2xl -z-10" />

          {/* Phone Shell */}
          <div
            className="rounded-[40px] p-2 shadow-[0_25px_60px_rgba(0,0,0,0.5)] transition-all"
            style={{ background: 'linear-gradient(135deg, #EC1187 0%, #FF4500 50%, #FF8D10 100%)' }}
          >
            {/* Inner White Bubble Card */}
            <div className="rounded-[34px] bg-white p-5 text-gray-900 shadow-inner">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-tr from-[#EC1187] to-[#FF8D10] text-sm font-black text-white shadow-md">
                    S
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="font-black text-sm text-gray-900">@sarah</span>
                      <span className="text-pink-500 text-xs font-black">✓</span>
                    </div>
                    <p className="text-[11px] font-bold text-gray-400">{previewMode.defaultPrompt}</p>
                  </div>
                </div>
                <span className="rounded-full bg-pink-100 px-2.5 py-0.5 text-[9px] font-black text-pink-700 uppercase tracking-wider">
                  {previewMode.badge}
                </span>
              </div>

              {/* Game Mode Selector in Mockup */}
              <div className="my-3 flex gap-1 overflow-x-auto pb-1 scrollbar-none">
                {GAME_MODES.slice(0, 4).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => changePreviewMode(m)}
                    className={`rounded-full px-2.5 py-1 text-[10px] font-black transition-all ${
                      previewMode.id === m.id
                        ? 'bg-black text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {m.icon} {m.name}
                  </button>
                ))}
              </div>

              {/* Connected Bubble Area */}
              <div className="relative rounded-2xl bg-gray-50 border border-gray-200/80 p-4">
                <p className="text-sm font-black text-gray-900 leading-snug min-h-[44px]">
                  {previewText}
                </p>

                {/* Dice Button in Hero Preview */}
                <button
                  type="button"
                  onClick={rollHeroDice}
                  className={`absolute right-3 bottom-3 grid h-8 w-8 place-items-center rounded-full bg-white text-base shadow-md border border-gray-200 active:scale-90 transition-transform ${
                    isRolling ? 'animate-dice' : ''
                  }`}
                  title="Tap to roll another question"
                >
                  🎲
                </button>

                <div className="mt-2 text-[10px] font-black text-gray-400 flex items-center justify-between">
                  <span>🔒 anonymous</span>
                  <span className="text-[#EC1187]">Tap 🎲 to roll</span>
                </div>
              </div>

              {/* Send Button */}
              <Link
                href="/login?mode=signup"
                className="mt-3 block w-full rounded-full bg-black py-3.5 text-center text-xs font-black text-white shadow-lg shadow-black/20 hover:bg-neutral-900 transition-all"
              >
                Send! 🚀
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5 Game Modes Showcase Cards */}
      <section className="py-14 border-t border-white/10">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="rounded-full bg-gradient-to-r from-[#EC1187]/20 to-[#FF8D10]/20 border border-[#EC1187]/40 px-3 py-1 text-[11px] font-black uppercase text-pink-300">
            PLAY ALL 5 MODES
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-3">
            Never Run Out of Fun Prompts
          </h2>
          <p className="mt-2 text-sm font-semibold text-white/60">
            Switch modes instantly with one tap. Friends roll the dice and reply without needing an app.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GAME_MODES.map((m) => (
            <div
              key={m.id}
              onClick={() => changePreviewMode(m)}
              className="card group hover:border-[#EC1187]/60 hover:shadow-[0_15px_35px_rgba(236,17,135,0.25)] transition-all cursor-pointer bg-[#140822] border-white/10"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 text-2xl group-hover:scale-110 transition-transform">
                  {m.icon}
                </span>
                <span className="rounded-full bg-pink-500/10 border border-pink-500/30 px-2.5 py-0.5 text-[10px] font-black text-pink-300">
                  {m.badge}
                </span>
              </div>
              <h3 className="text-lg font-black text-white">{m.name}</h3>
              <p className="text-xs font-bold text-white/60 mt-1">&quot;{m.tagline}&quot;</p>
              <div className="mt-3 rounded-xl bg-white/5 p-2.5 text-xs text-white/80 font-bold border border-white/5">
                {m.questions[0]}
              </div>
            </div>
          ))}

          {/* Pro Clues Card */}
          <div className="card border-amber-500/40 bg-gradient-to-br from-[#2a133d] to-[#12071d] shadow-[0_15px_35px_rgba(245,158,11,0.15)]">
            <div className="flex items-center justify-between mb-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-500/20 text-2xl">
                🕵️
              </span>
              <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 text-[10px] font-black text-amber-300">
                PRO HINTS
              </span>
            </div>
            <h3 className="text-lg font-black text-white">Who Sent This Clues</h3>
            <p className="text-xs font-bold text-white/60 mt-1">
              Approximate city, device model, and carrier clues without violating sender privacy.
            </p>
            <div className="mt-3 rounded-xl bg-amber-500/10 border border-amber-500/20 p-2.5 text-xs text-amber-200 font-black">
              ✓ Watch 5s Ad to Reveal for Free
            </div>
          </div>
        </div>
      </section>

      {/* Safety & AI Shield */}
      <section className="py-10 mb-8 rounded-[36px] bg-gradient-to-br from-[#240c34] via-[#150621] to-[#08020d] border border-pink-500/30 p-8 sm:p-12 text-center shadow-2xl relative overflow-hidden">
        <div className="pointer-events-none absolute -bottom-20 left-1/2 -translate-x-1/2 h-[300px] w-[500px] rounded-full bg-[#EC1187]/20 blur-[100px] -z-10" />

        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-tr from-[#EC1187] to-[#FF8D10] text-3xl mb-4 shadow-lg text-white">
          🛡️
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white">
          AI Moderated · Zero Cyberbullying
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm font-semibold text-white/70 leading-relaxed">
          Every message is checked in milliseconds before reaching your inbox. Bullying, harassment,
          threats, and phone/email leaks are automatically blocked.
        </p>

        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link
            href="/login?mode=signup"
            className="rounded-full px-8 py-3.5 text-sm font-black text-white shadow-xl hover:brightness-110 active:scale-95 transition-all"
            style={{ background: 'linear-gradient(135deg, #EC1187 0%, #FF4500 50%, #FF8D10 100%)' }}
          >
            Claim your link now ⚡
          </Link>
          <Link href="/terms" className="rounded-full bg-white/10 px-6 py-3.5 text-sm font-bold text-white hover:bg-white/20 transition">
            Terms & Safety
          </Link>
        </div>
      </section>
    </div>
  );
}
