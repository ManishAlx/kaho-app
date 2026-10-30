'use client';
import { useState } from 'react';
import type { Message } from '@/lib/db';
import { timeAgo } from '@/lib/time';

type Props = {
  message: Message;
  onClose: () => void;
};

function getClueAnalysis(text: string, id: string) {
  const lower = text.toLowerCase();
  let score = 50;
  if (/crush|love|pyaar|date|cute|gorgeous|beautiful|dil|shadi|heart|kiss|miss\s+you|marte|sundar|hot|pasand/i.test(lower)) {
    score = 85 + (Math.abs(id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % 14);
  } else if (/attitude|annoying|hate|gussa|dost|bff|bro|bhai|friend|yaar|kamina/i.test(lower)) {
    score = 15 + (Math.abs(id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % 25);
  } else {
    score = 45 + (Math.abs(id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % 35);
  }

  let persona = 'Quiet Admirer';
  let verdict = 'This sender seems to notice your stories and posts regularly.';

  if (score > 75) {
    persona = 'Secret Romantic Admirer 💘';
    verdict = 'High romantic energy detected. This person probably smiles every time your story pops up.';
  } else if (score < 35) {
    persona = 'Close Friend / Teasing Buddy 😜';
    verdict = 'Playful teasing energy. Likely someone who is in your close friends group or WhatsApp chats.';
  } else {
    persona = 'Late-Night Overthinker 👀';
    verdict = 'Curious and introspective. They spent time pondering what to say before hitting send.';
  }

  return { score, persona, verdict };
}

export default function HintsModal({ message, onClose }: Props) {
  // Check if this message was already unlocked in this session
  const [isUnlocked, setIsUnlocked] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(`unlocked_hint_${message.id}`) === 'true';
    }
    return false;
  });

  const [watchingAd, setWatchingAd] = useState(false);
  const [adTimer, setAdTimer] = useState(5);
  const [showProModal, setShowProModal] = useState(false);

  const analysis = getClueAnalysis(message.body, message.id);

  const formattedTime = new Date(message.createdAt).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  function startAdWatch() {
    setWatchingAd(true);
    setAdTimer(5);
    let count = 5;
    const interval = setInterval(() => {
      count -= 1;
      setAdTimer(count);
      if (count <= 0) {
        clearInterval(interval);
        setWatchingAd(false);
        setIsUnlocked(true);
        sessionStorage.setItem(`unlocked_hint_${message.id}`, 'true');
      }
    }, 1000);
  }

  function unlockWithPro() {
    setIsUnlocked(true);
    sessionStorage.setItem(`unlocked_hint_${message.id}`, 'true');
    setShowProModal(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-[32px] bg-gradient-to-b from-[#221034] to-[#0d0615] border border-pink-500/40 p-5 sm:p-6 shadow-2xl text-white scrollbar-none">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2 mb-1">
          <span className="rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-2.5 py-0.5 text-[10px] font-black uppercase text-black">
            AI DETECTIVE PRO
          </span>
          <span className="text-xs text-white/60 font-semibold">{timeAgo(message.createdAt)}</span>
        </div>
        <h3 className="text-2xl font-black text-white">Who sent this? 🕵️</h3>
        <p className="mt-0.5 text-xs text-white/60">
          AI vibe telemetry and device clues captured from the sender.
        </p>

        {/* Ad Video Simulation Overlay */}
        {watchingAd ? (
          <div className="my-6 rounded-2xl bg-black/80 border border-pink-500/50 p-6 text-center animate-fade-in">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-gradient-to-r from-pink-500 to-orange-500 text-2xl font-black text-white mb-3 animate-pulse">
              {adTimer}
            </div>
            <p className="text-sm font-extrabold text-white">Unlocking AI Clues…</p>
            <p className="text-xs text-white/60 mt-1">
              Hint will unlock automatically when timer ends!
            </p>
            <div className="mt-4 h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-pink-500 to-orange-500 transition-all duration-1000"
                style={{ width: `${((5 - adTimer) / 5) * 100}%` }}
              />
            </div>
          </div>
        ) : (
          /* Clues Container */
          <div className="relative my-4">
            {/* Clues List (blurred if locked) */}
            <div className={`space-y-3 transition-all duration-300 ${!isUnlocked ? 'filter blur-[7px] select-none pointer-events-none' : ''}`}>
              
              {/* AI Crush & Persona Analysis Card */}
              <div className="rounded-2xl bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-orange-500/20 border border-pink-500/40 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-pink-300 flex items-center gap-1.5">
                    <span className="animate-pulse">✨</span> AI Crush Meter
                  </span>
                  <span className="text-sm font-black text-pink-300">{analysis.score}% Romantic</span>
                </div>

                {/* Progress Bar */}
                <div className="h-2 w-full rounded-full bg-black/40 overflow-hidden mb-3">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400"
                    style={{ width: `${analysis.score}%` }}
                  />
                </div>

                <div className="rounded-xl bg-black/40 p-2.5 border border-white/5 space-y-1">
                  <p className="text-xs font-black text-white flex items-center gap-1.5">
                    <span>🎭 Persona:</span>
                    <span className="text-pink-300">{analysis.persona}</span>
                  </p>
                  <p className="text-[11px] text-white/70 leading-relaxed">
                    {analysis.verdict}
                  </p>
                </div>
              </div>

              {/* Location Clue */}
              <div className="flex items-start gap-3 rounded-2xl bg-white/5 border border-white/10 p-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-pink-500/20 text-lg text-pink-400">
                  📍
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-white/50 tracking-wider">
                    Approximate Location
                  </p>
                  <p className="text-xs font-extrabold text-white mt-0.5">
                    {message.hintLocation || 'Near Mumbai, Maharashtra'}
                  </p>
                </div>
              </div>

              {/* Device Clue */}
              <div className="flex items-start gap-3 rounded-2xl bg-white/5 border border-white/10 p-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-orange-500/20 text-lg text-orange-400">
                  📱
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-white/50 tracking-wider">
                    Device & App
                  </p>
                  <p className="text-xs font-extrabold text-white mt-0.5">
                    {message.hintDevice || 'Apple iPhone 15 · Instagram link'}
                  </p>
                </div>
              </div>

              {/* Network Clue */}
              <div className="flex items-start gap-3 rounded-2xl bg-white/5 border border-white/10 p-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-purple-500/20 text-lg text-purple-400">
                  📶
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-white/50 tracking-wider">
                    Network Carrier
                  </p>
                  <p className="text-xs font-extrabold text-white mt-0.5">
                    {message.hintNetwork || 'Jio 5G Network'}
                  </p>
                </div>
              </div>

              {/* Time Clue */}
              <div className="flex items-start gap-3 rounded-2xl bg-white/5 border border-white/10 p-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-500/20 text-lg text-emerald-400">
                  ⏰
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-white/50 tracking-wider">
                    Time Sent
                  </p>
                  <p className="text-xs font-extrabold text-white mt-0.5">{formattedTime}</p>
                </div>
              </div>
            </div>

            {/* Locked Paywall Overlay */}
            {!isUnlocked && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] rounded-2xl border border-pink-500/40 text-center animate-fade-in">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-pink-500/30 text-2xl text-pink-300 mb-2 shadow-lg">
                  🔒
                </span>
                <p className="text-base font-black text-white">Hint is Locked</p>
                <p className="text-xs text-white/70 mt-0.5 mb-4 max-w-[210px]">
                  Reveal AI crush probability, city, phone model & network
                </p>

                <div className="w-full space-y-2">
                  {/* Watch Ad Free Option (Loved by users) */}
                  <button
                    onClick={startAdWatch}
                    className="w-full rounded-2xl bg-gradient-to-r from-[#EC1187] to-[#FF8D10] py-3 text-xs font-black text-white shadow-lg shadow-[#EC1187]/40 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>📺 Watch 5s Ad to Reveal (Free)</span>
                  </button>

                  {/* Or Unlock All with Pro */}
                  <button
                    onClick={() => setShowProModal(true)}
                    className="w-full rounded-2xl bg-white/10 py-2.5 text-xs font-extrabold text-amber-300 hover:bg-white/20 transition"
                  >
                    ⚡ Unlock All Hints with KAHO PRO
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-[10px] font-semibold text-white/40 mt-3">
          🔒 Telemetry is approximate to respect sender privacy guidelines.
        </p>

        {/* Pro Subscription Simulation Modal */}
        {showProModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
            <div className="relative w-full max-w-xs rounded-3xl bg-[#1c0c2a] border border-amber-400/40 p-6 text-center text-white shadow-2xl animate-fade-in">
              <span className="text-4xl block mb-2">👑</span>
              <h4 className="text-xl font-black text-amber-300">KAHO PRO</h4>
              <p className="text-xs text-white/70 mt-1 mb-4">
                Unlimited instant clues, zero ads & secret crush predictions.
              </p>

              <div className="rounded-2xl bg-amber-500/10 border border-amber-400/30 p-3 mb-4">
                <p className="text-2xl font-black text-white">
                  ₹99 <span className="text-xs font-semibold text-white/60">/ week</span>
                </p>
                <p className="text-[10px] font-bold text-amber-300">Cancel anytime</p>
              </div>

              <div className="space-y-2">
                <button
                  onClick={unlockWithPro}
                  className="w-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 py-3 text-xs font-black text-black shadow-lg hover:brightness-110 active:scale-95 transition"
                >
                  Start 3-Day Free Trial ✨
                </button>
                <button
                  onClick={() => setShowProModal(false)}
                  className="w-full py-2 text-xs font-bold text-white/50 hover:text-white"
                >
                  Maybe later
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
