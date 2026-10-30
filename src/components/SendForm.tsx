'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { GAME_MODES, MAX_MESSAGE_LENGTH, type GameMode } from '@/lib/config';

type Props = {
  username: string;
  displayName: string;
  accepting: boolean;
};

export default function SendForm({ username, displayName, accepting }: Props) {
  const [activeMode, setActiveMode] = useState<GameMode>(GAME_MODES[0]);
  const [promptText, setPromptText] = useState(GAME_MODES[0].defaultPrompt);
  const [body, setBody] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState('');
  const [blocked, setBlocked] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [tapCount, setTapCount] = useState(312);

  useEffect(() => {
    setTapCount(285 + Math.floor(Math.random() * 40));
  }, []);

  function selectMode(m: GameMode) {
    setActiveMode(m);
    setPromptText(m.defaultPrompt);
    setBody('');
    setError('');
  }

  function rollDice() {
    setIsRolling(true);
    setTimeout(() => setIsRolling(false), 500);

    const questions = activeMode.questions;
    const randomIdx = Math.floor(Math.random() * questions.length);
    const chosen = questions[randomIdx];

    setBody(chosen);
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;

    setError('');
    setBlocked(false);
    setState('sending');

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          body,
          gameMode: activeMode.id,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setBlocked(Boolean(data.blocked));
        throw new Error(data.error ?? 'Could not send your message');
      }

      setBody('');
      setState('sent');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send your message');
      setState('idle');
    }
  }

  return (
    <div className="relative min-h-[85vh] flex flex-col items-center justify-start py-6 px-2 sm:px-4">
      {/* Game Mode Pills Carousel */}
      <div className="mb-6 flex w-full max-w-sm items-center justify-start sm:justify-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {GAME_MODES.map((m) => {
          const isActive = activeMode.id === m.id;
          return (
            <button
              key={m.id}
              onClick={() => selectMode(m)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-black transition-all duration-200 active:scale-95 ${
                isActive
                  ? 'bg-white text-black shadow-lg shadow-black/20 scale-105'
                  : 'bg-black/30 text-white/80 border border-white/10 hover:bg-black/50 hover:text-white backdrop-blur-md'
              }`}
            >
              <span>{m.icon}</span>
              <span>{m.name}</span>
            </button>
          );
        })}
      </div>

      {/* Main Form Container */}
      <div className="w-full max-w-[400px]">
        {!accepting ? (
          <div className="rounded-[32px] bg-white p-8 text-center text-gray-900 shadow-2xl">
            <span className="text-4xl block mb-2">⏸️</span>
            <h2 className="text-xl font-black text-gray-900">Paused</h2>
            <p className="mt-1 text-sm font-semibold text-gray-500">
              {displayName} is not accepting new anonymous messages right now.
            </p>
          </div>
        ) : state === 'sent' ? (
          /* NGL Style Sent Celebration Screen */
          <div className="rounded-[32px] bg-white p-7 text-center text-gray-900 shadow-2xl animate-fade-in">
            <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-3xl shadow-inner">
              🎉
            </div>
            <h2 className="text-2xl font-black text-gray-900">Sent!</h2>
            <p className="mt-1 text-sm font-bold text-gray-500">
              @{username} will never know who sent this.
            </p>

            {/* Viral Growth Hook */}
            <div className="mt-8 rounded-2xl bg-gradient-to-br from-pink-50 to-orange-50 border border-pink-100 p-4">
              <p className="text-xs font-black text-[#EC1187]">
                👇 <span className="underline" suppressHydrationWarning>{tapCount} friends</span> just got their own link 👇
              </p>
              <Link
                href="/login?mode=signup"
                className="mt-3 block w-full rounded-full bg-gradient-to-r from-[#EC1187] to-[#FF8D10] py-3.5 text-center text-sm font-black text-white shadow-lg shadow-[#EC1187]/30 hover:brightness-110 active:scale-95 transition-all animate-pulse-growth"
              >
                Get your own messages! 🚀
              </Link>
            </div>

            <div className="mt-5">
              <button
                type="button"
                onClick={() => setState('idle')}
                className="text-xs font-black text-gray-400 hover:text-gray-900 underline transition"
              >
                Send another message
              </button>
            </div>
          </div>
        ) : (
          /* Exact NGL Bubble Card Form */
          <form onSubmit={send} className="w-full">
            {/* The Connected Bubble Card */}
            <div className="overflow-hidden rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.35)] transition-all">
              {/* Header: Pure White with Avatar and Bold Prompt */}
              <div className="bg-white p-5 pb-4">
                <div className="flex items-center gap-3">
                  {/* Avatar with Gradient Ring */}
                  <div className="relative">
                    <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-tr from-[#EC1187] via-[#FF4500] to-[#FF8D10] p-0.5 shadow-md">
                      <div className="grid h-full w-full place-items-center rounded-full bg-[#f4eff3] text-sm font-black text-gray-900">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full bg-emerald-500 text-[8px] text-white font-black ring-2 ring-white">
                      ✓
                    </span>
                  </div>

                  {/* Username & Mode Badge */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-gray-900">@{username}</span>
                      <span className="rounded-full bg-pink-100 px-2 py-0.5 text-[9px] font-black text-pink-700 uppercase tracking-wider">
                        {activeMode.badge}
                      </span>
                    </div>
                    <h1 className="mt-0.5 text-base sm:text-lg font-black text-gray-900 tracking-tight leading-snug">
                      {promptText}
                    </h1>
                  </div>
                </div>
              </div>

              {/* Textarea: Frosted / Cream Background Attached to Header */}
              <div className="relative bg-white/90 backdrop-blur-xl border-t border-gray-100">
                <textarea
                  id="question"
                  className="w-full min-h-[140px] resize-none bg-transparent p-5 pb-12 text-lg sm:text-xl font-bold text-gray-900 outline-none placeholder:text-gray-300 placeholder:font-semibold"
                  placeholder={activeMode.placeholder}
                  value={body}
                  maxLength={MAX_MESSAGE_LENGTH}
                  onChange={(e) => setBody(e.target.value)}
                  autoFocus={false}
                />

                {/* Floating Bottom-Right 3D Dice Button */}
                <button
                  type="button"
                  onClick={rollDice}
                  title="Roll for random question"
                  className={`absolute right-4 bottom-3 grid h-9 w-9 place-items-center rounded-full bg-white text-lg shadow-md border border-gray-200 hover:bg-gray-50 active:scale-90 transition-transform ${
                    isRolling ? 'animate-dice' : ''
                  }`}
                  aria-label="Roll random question"
                >
                  🎲
                </button>

                {/* Bottom-Left Character Counter */}
                <span className="absolute left-5 bottom-3.5 text-[11px] font-black text-gray-400">
                  {body.length}/{MAX_MESSAGE_LENGTH}
                </span>
              </div>
            </div>

            {/* Anonymous Tooltip Badge */}
            <div className="my-3 text-center text-xs font-black text-white/90 drop-shadow-sm flex items-center justify-center gap-1">
              <span>🔒</span> anonymous q&a
            </div>

            {error && (
              <div
                className={`mb-3 rounded-2xl p-3 text-xs font-bold text-center ${
                  blocked
                    ? 'border border-red-400 bg-red-950/80 text-red-200'
                    : 'border border-amber-400 bg-amber-950/80 text-amber-200'
                }`}
                role="alert"
              >
                {error}
              </div>
            )}

            {/* Iconic NGL Black Pill Send Button */}
            <button
              type="submit"
              disabled={state === 'sending' || body.trim().length === 0}
              className="w-full rounded-full bg-black py-4 text-lg font-black text-white shadow-xl shadow-black/40 hover:bg-neutral-900 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
            >
              {state === 'sending' ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Sending secretly…
                </>
              ) : (
                'Send!'
              )}
            </button>
          </form>
        )}

        {/* Bottom Viral Growth Container */}
        <div className="mt-8 text-center">
          <p className="text-xs font-black text-white/95 drop-shadow-sm">
            👇 <span className="underline decoration-pink-300" suppressHydrationWarning>{tapCount} friends</span> just tapped the button 👇
          </p>

          <Link
            href="/login?mode=signup"
            className="mt-3 block w-full rounded-full bg-white py-4 text-center text-base font-black text-[#EC1187] shadow-xl hover:bg-neutral-50 active:scale-95 transition-all duration-200 animate-pulse-growth"
          >
            Get your own messages!
          </Link>

          <div className="mt-5 flex items-center justify-center gap-4 text-[11px] font-bold text-white/60">
            <Link href="/terms" className="hover:text-white underline">
              Terms
            </Link>
            <span>•</span>
            <Link href="/privacy" className="hover:text-white underline">
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
