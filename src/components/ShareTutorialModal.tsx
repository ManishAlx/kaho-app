'use client';
import { useState } from 'react';
import { APP_NAME } from '@/lib/config';

type Props = {
  link: string;
  username: string;
  onClose: () => void;
};

export default function ShareTutorialModal({ link, username, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setActiveStep(2);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* fallback */
    }
  }

  const shareText = `Send me anonymous messages & secret confessions on ${APP_NAME}! 🤫🔥\n${link}`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;

  function openInstagram() {
    // Attempt deep link to Instagram camera first, then fallback to web
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = 'instagram://story-camera';
      setTimeout(() => {
        window.open('https://instagram.com', '_blank');
      }, 800);
    } else {
      window.open('https://instagram.com', '_blank');
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-[32px] bg-[#12081f] border border-pink-500/30 text-white shadow-[0_25px_60px_rgba(236,17,135,0.35)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#EC1187] via-[#FF4500] to-[#FF8D10] p-6 text-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 grid h-8 w-8 place-items-center rounded-full bg-black/30 text-white hover:bg-black/50 transition"
            aria-label="Close"
          >
            ✕
          </button>

          <span className="inline-block text-3xl mb-1 animate-bounce">📸</span>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            How to Post on Story
          </h2>
          <p className="mt-1 text-xs font-bold text-white/90">
            3 easy steps to flood your inbox with honest confessions
          </p>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {/* Step Pills */}
          <div className="grid grid-cols-3 gap-2 text-center">
            {[1, 2, 3].map((step) => (
              <button
                key={step}
                onClick={() => setActiveStep(step as 1 | 2 | 3)}
                className={`rounded-xl py-2 text-xs font-black transition-all ${
                  activeStep === step
                    ? 'bg-gradient-to-r from-[#EC1187] to-[#FF4500] text-white shadow-md'
                    : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
                }`}
              >
                Step {step}
              </button>
            ))}
          </div>

          {/* Step 1 Content */}
          {activeStep === 1 && (
            <div className="space-y-3 rounded-2xl bg-white/[0.04] border border-white/10 p-4 text-center">
              <span className="text-3xl block">📋</span>
              <h3 className="text-base font-black text-white">Step 1: Copy your private link</h3>
              <p className="text-xs text-white/70">
                First, copy your personal {APP_NAME} link to your clipboard.
              </p>
              <div className="pt-2">
                <button
                  onClick={handleCopy}
                  className="w-full rounded-full py-3.5 px-6 font-black text-sm text-white shadow-lg shadow-[#EC1187]/40 active:scale-95 transition-all"
                  style={{ background: 'linear-gradient(135deg, #EC1187 0%, #FF4500 50%, #FF8D10 100%)' }}
                >
                  {copied ? 'Copied to Clipboard! ✓' : 'Copy My KAHO Link 🔗'}
                </button>
              </div>
            </div>
          )}

          {/* Step 2 Content */}
          {activeStep === 2 && (
            <div className="space-y-3 rounded-2xl bg-white/[0.04] border border-white/10 p-4 text-center">
              <span className="text-3xl block">📱</span>
              <h3 className="text-base font-black text-white">Step 2: Open Instagram Story</h3>
              <p className="text-xs text-white/70">
                Launch Instagram, take a photo or choose a photo from your gallery for your story.
              </p>
              <div className="pt-2">
                <button
                  onClick={openInstagram}
                  className="w-full rounded-full py-3.5 px-6 font-black text-sm text-white bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] shadow-lg shadow-pink-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <span>Open Instagram ↗</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 3 Content */}
          {activeStep === 3 && (
            <div className="space-y-3 rounded-2xl bg-white/[0.04] border border-white/10 p-4 text-center">
              <span className="text-3xl block">🔗</span>
              <h3 className="text-base font-black text-white">Step 3: Add the Link Sticker</h3>
              <div className="space-y-2 text-left text-xs text-white/80 bg-black/40 rounded-xl p-3 border border-white/5">
                <div className="flex items-center gap-2">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-pink-500 text-[10px] font-black text-white">1</span>
                  <span>Tap the <strong>Sticker</strong> icon (square smiley)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-pink-500 text-[10px] font-black text-white">2</span>
                  <span>Tap the <strong>LINK</strong> sticker</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-pink-500 text-[10px] font-black text-white">3</span>
                  <span>Paste your link and tap <strong>Done</strong></span>
                </div>
              </div>
            </div>
          )}

          {/* Quick 1-Tap Share to other networks */}
          <div className="pt-2 border-t border-white/10">
            <p className="text-xs font-black uppercase tracking-wider text-white/50 text-center mb-3">
              Or Share Instantly To
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-2xl bg-[#25D366]/20 border border-[#25D366]/40 py-2.5 px-4 text-xs font-black text-[#25D366] hover:bg-[#25D366]/30 active:scale-95 transition"
              >
                <span>💬 WhatsApp</span>
              </a>

              <a
                href={twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-2xl bg-[#1DA1F2]/20 border border-[#1DA1F2]/40 py-2.5 px-4 text-xs font-black text-[#1DA1F2] hover:bg-[#1DA1F2]/30 active:scale-95 transition"
              >
                <span>🐦 Twitter / X</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
