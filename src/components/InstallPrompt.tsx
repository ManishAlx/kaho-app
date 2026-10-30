'use client';
import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    // 2. Detect iOS
    const ua = window.navigator.userAgent;
    const isIosDevice = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream: unknown }).MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as unknown as { standalone?: boolean }).standalone;

    if (isIosDevice && !isStandalone) {
      setIsIOS(true);
      const dismissed = sessionStorage.getItem('kaho_ios_dismissed');
      if (!dismissed) setShowPrompt(true);
    }

    // 3. Android / Chrome Install Prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      const dismissed = sessionStorage.getItem('kaho_install_dismissed');
      if (!dismissed) setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function handleInstall() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  }

  function dismiss() {
    setShowPrompt(false);
    sessionStorage.setItem(isIOS ? 'kaho_ios_dismissed' : 'kaho_install_dismissed', '1');
  }

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md animate-fade-in">
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-[#1f102c] via-[#2d123b] to-[#170a24] border border-pink-500/40 p-3.5 shadow-2xl backdrop-blur-lg text-white">
        <div className="flex items-center gap-3 min-w-0">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-tr from-[#EC1187] via-[#FF4500] to-[#FF8D10] text-lg font-black text-white shadow-md">
            K
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black text-white">Install KAHO App</p>
            <p className="text-[11px] text-white/60 truncate">
              {isIOS ? 'Tap Share ⎋ & "Add to Home Screen"' : 'Fast, full-screen mobile app experience'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {!isIOS && deferredPrompt && (
            <button
              onClick={handleInstall}
              className="rounded-xl bg-gradient-to-r from-[#ff1493] to-[#ff4500] px-3.5 py-1.5 text-xs font-black text-white shadow-md hover:brightness-110 active:scale-95 transition"
            >
              Install 📲
            </button>
          )}
          <button
            onClick={dismiss}
            className="grid h-7 w-7 place-items-center rounded-lg bg-white/10 text-xs text-white/60 hover:text-white"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
