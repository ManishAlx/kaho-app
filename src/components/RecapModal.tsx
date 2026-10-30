'use client';
import { useState } from 'react';
import type { Message } from '@/lib/db';
import { APP_NAME } from '@/lib/config';

type Props = {
  username: string;
  messages: Message[];
  onClose: () => void;
};

export default function RecapModal({ username, messages, onClose }: Props) {
  const [downloading, setDownloading] = useState(false);

  // Compute fun stats
  const total = messages.length;
  const answered = messages.filter((m) => m.reply).length;
  const crushes = messages.filter((m) =>
    /crush|love|pyaar|date|cute|gorgeous|beautiful|dil|shadi|heart/i.test(m.body)
  ).length;

  let vibeTitle = 'Main Character Energy ✨';
  if (crushes >= 3) vibeTitle = 'Crush Magnet 💘';
  else if (answered > 5) vibeTitle = 'Story Teller 🎙️';
  else if (total > 10) vibeTitle = 'Viral Sensation 🔥';

  async function renderRecapCanvas(): Promise<HTMLCanvasElement | null> {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Background gradient: Deep violet to sunset flame
    const bg = ctx.createLinearGradient(0, 0, 1080, 1920);
    bg.addColorStop(0, '#160824');
    bg.addColorStop(0.4, '#2B0E3D');
    bg.addColorStop(0.8, '#FF007F');
    bg.addColorStop(1, '#FF4500');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1080, 1920);

    // Ambient floating circles
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.beginPath();
    ctx.arc(300, 400, 350, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(800, 1500, 400, 0, Math.PI * 2);
    ctx.fill();

    function roundRect(
      c: CanvasRenderingContext2D,
      x: number,
      y: number,
      w: number,
      h: number,
      r: number
    ) {
      c.beginPath();
      c.moveTo(x + r, y);
      c.lineTo(x + w - r, y);
      c.quadraticCurveTo(x + w, y, x + w, y + r);
      c.lineTo(x + w, y + h - r);
      c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      c.lineTo(x + r, y + h);
      c.quadraticCurveTo(x, y + h, x, y + h - r);
      c.lineTo(x, y + r);
      c.quadraticCurveTo(x, y, x + r, y);
      c.closePath();
    }

    // Top Brand Tag
    ctx.fillStyle = '#FFE500';
    ctx.font = '900 36px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`⚡ ${APP_NAME} WEEKLY RECAP`, 540, 260);

    // Username Heading
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 76px Inter, sans-serif';
    ctx.fillText(`@${username}`, 540, 360);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '700 32px Inter, sans-serif';
    ctx.fillText('Here is what friends secretly confessed this week:', 540, 420);

    // Main Card
    const cardX = 100;
    const cardY = 500;
    const cardW = 880;
    const cardH = 920;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    roundRect(ctx, cardX, cardY, cardW, cardH, 50);
    ctx.fill();

    // Vibe Title Banner inside Card
    ctx.fillStyle = '#EC1187';
    roundRect(ctx, cardX + 60, cardY + 70, cardW - 120, 110, 30);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 44px Inter, sans-serif';
    ctx.fillText(vibeTitle, 540, cardY + 140);

    // Stat 1: Total Confessions
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 96px Inter, sans-serif';
    ctx.fillText(`${total || 12}`, 540, cardY + 350);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '800 32px Inter, sans-serif';
    ctx.fillText('SECRET CONFESSIONS RECEIVED', 540, cardY + 410);

    // Stat 2: Secret Crushes
    ctx.fillStyle = '#FFE500';
    ctx.font = '900 84px Inter, sans-serif';
    ctx.fillText(`${crushes || 3}`, 540, cardY + 580);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '800 32px Inter, sans-serif';
    ctx.fillText('SECRET CRUSH CONFESSIONS 💘', 540, cardY + 640);

    // Stat 3: Replied
    ctx.fillStyle = '#00FFCC';
    ctx.font = '900 84px Inter, sans-serif';
    ctx.fillText(`${answered || 5}`, 540, cardY + 800);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '800 32px Inter, sans-serif';
    ctx.fillText('STORIES ANSWERED & SHARED 📸', 540, cardY + 860);

    // Footer Watermark
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 38px Inter, sans-serif';
    ctx.fillText(`Get yours at ${APP_NAME.toLowerCase()}.link`, 540, 1780);

    return canvas;
  }

  async function handleShare(mode: 'download' | 'share') {
    setDownloading(true);
    try {
      const canvas = await renderRecapCanvas();
      if (!canvas) return;

      canvas.toBlob(async (blob) => {
        if (!blob) return;

        if (mode === 'share' && navigator.canShare) {
          const file = new File([blob], `${APP_NAME}-recap.png`, { type: 'image/png' });
          if (navigator.canShare({ files: [file] })) {
            try {
              await navigator.share({
                files: [file],
                title: 'My KAHO Weekly Recap',
                text: `My secret confession stats on ${APP_NAME}! 🔥`,
              });
              setDownloading(false);
              return;
            } catch {
              /* fallback */
            }
          }
        }

        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `${APP_NAME}-weekly-recap.png`;
        link.href = dataUrl;
        link.click();
        setDownloading(false);
      }, 'image/png');
    } catch {
      setDownloading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-[32px] bg-gradient-to-b from-[#220d36] to-[#0c0514] border border-pink-500/40 p-5 shadow-2xl text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
        >
          ✕
        </button>

        <h3 className="text-xl font-black text-white flex items-center gap-2">
          <span>📊</span> Weekly Recap
        </h3>
        <p className="mt-0.5 text-xs text-white/60">
          Your anonymous confession stats ready for Instagram Story.
        </p>

        {/* Mini Preview Card */}
        <div className="my-4 rounded-2xl bg-gradient-to-br from-[#2b0e3d] via-[#FF007F] to-[#FF4500] p-4 text-center shadow-inner space-y-3">
          <span className="inline-block rounded-full bg-amber-400 px-3 py-1 text-[11px] font-black text-black">
            {vibeTitle}
          </span>

          <div className="grid grid-cols-3 gap-2 text-center pt-1">
            <div className="rounded-xl bg-black/40 p-2 border border-white/10">
              <span className="text-xl font-black text-white block">{total || 12}</span>
              <span className="text-[9px] font-bold text-white/70 uppercase">Confessions</span>
            </div>
            <div className="rounded-xl bg-black/40 p-2 border border-white/10">
              <span className="text-xl font-black text-amber-300 block">{crushes || 3}</span>
              <span className="text-[9px] font-bold text-white/70 uppercase">Crushes 💘</span>
            </div>
            <div className="rounded-xl bg-black/40 p-2 border border-white/10">
              <span className="text-xl font-black text-emerald-300 block">{answered || 5}</span>
              <span className="text-[9px] font-bold text-white/70 uppercase">Answered</span>
            </div>
          </div>

          <p className="text-[10px] font-bold text-white/80">
            Share this on your story to see who reacts! 🔥
          </p>
        </div>

        {/* Buttons */}
        <div className="space-y-2">
          <button
            onClick={() => handleShare('share')}
            disabled={downloading}
            className="w-full rounded-2xl bg-gradient-to-r from-[#EC1187] via-[#FF4500] to-[#FF8D10] py-3 text-sm font-black text-white shadow-lg shadow-[#EC1187]/40 hover:brightness-110 active:scale-95 transition-all"
          >
            {downloading ? 'Preparing Card…' : 'Share Recap to Story 📸'}
          </button>
          <button
            onClick={() => handleShare('download')}
            disabled={downloading}
            className="w-full rounded-2xl bg-white/10 py-2.5 text-xs font-bold text-white/80 hover:bg-white/20 transition"
          >
            Download Recap PNG 📥
          </button>
        </div>
      </div>
    </div>
  );
}
