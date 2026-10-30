'use client';
import { useRef, useState } from 'react';
import type { Message } from '@/lib/db';
import { APP_NAME } from '@/lib/config';

type Props = {
  message: Message;
  username: string;
  onClose: () => void;
};

type StoryTheme = {
  id: string;
  name: string;
  colors: [string, string, string];
  cardBg: string;
  cardTextColor: string;
  subtextColor: string;
  avatarBg: string;
  previewClass: string;
};

const THEMES: StoryTheme[] = [
  {
    id: 'sunset',
    name: 'Sunset 🔥',
    colors: ['#EC1187', '#FF4500', '#FF8D10'],
    cardBg: '#FFFFFF',
    cardTextColor: '#111827',
    subtextColor: '#EC1187',
    avatarBg: '#EC1187',
    previewClass: 'bg-gradient-to-tr from-[#EC1187] via-[#FF4500] to-[#FF8D10]',
  },
  {
    id: 'cyber',
    name: 'Cyber 💜',
    colors: ['#7928CA', '#4A00E0', '#00D4FF'],
    cardBg: '#FFFFFF',
    cardTextColor: '#111827',
    subtextColor: '#7928CA',
    avatarBg: '#4A00E0',
    previewClass: 'bg-gradient-to-tr from-[#7928CA] via-[#4A00E0] to-[#00D4FF]',
  },
  {
    id: 'brat',
    name: 'Brat 🍏',
    colors: ['#8ACE00', '#00C853', '#004D40'],
    cardBg: '#FFFFFF',
    cardTextColor: '#052e16',
    subtextColor: '#15803d',
    avatarBg: '#16a34a',
    previewClass: 'bg-gradient-to-tr from-[#8ACE00] via-[#00C853] to-[#004D40]',
  },
  {
    id: 'midnight',
    name: 'Midnight 🖤',
    colors: ['#0A0A0F', '#181824', '#26263B'],
    cardBg: '#171727',
    cardTextColor: '#FFFFFF',
    subtextColor: '#FF007F',
    avatarBg: '#FF007F',
    previewClass: 'bg-gradient-to-tr from-[#0A0A0F] via-[#181824] to-[#26263B]',
  },
];

export default function StoryCardModal({ message, username, onClose }: Props) {
  const [downloading, setDownloading] = useState(false);
  const [activeTheme, setActiveTheme] = useState<StoryTheme>(THEMES[0]);
  const [customPhoto, setCustomPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setCustomPhoto(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  }

  function removeCustomPhoto() {
    setCustomPhoto(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function renderCanvas(): Promise<HTMLCanvasElement | null> {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Helper for rounded rectangles
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

    // 1. Draw Background: Custom Photo or Gradient
    if (customPhoto) {
      const img = new Image();
      img.src = customPhoto;
      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });

      // Cover-fit math
      const scale = Math.max(1080 / img.width, 1920 / img.height);
      const scaledW = img.width * scale;
      const scaledH = img.height * scale;
      const offsetX = (1080 - scaledW) / 2;
      const offsetY = (1920 - scaledH) / 2;

      ctx.drawImage(img, offsetX, offsetY, scaledW, scaledH);

      // Dark Blur/Vignette Overlay
      const darkGrad = ctx.createLinearGradient(0, 0, 0, 1920);
      darkGrad.addColorStop(0, 'rgba(0, 0, 0, 0.45)');
      darkGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.60)');
      darkGrad.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
      ctx.fillStyle = darkGrad;
      ctx.fillRect(0, 0, 1080, 1920);
    } else {
      const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1920);
      bgGrad.addColorStop(0, activeTheme.colors[0]);
      bgGrad.addColorStop(0.5, activeTheme.colors[1]);
      bgGrad.addColorStop(1, activeTheme.colors[2]);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1080, 1920);

      // Subtle decorative ambient circles
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.arc(200, 300, 400, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(900, 1600, 500, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Question Sticker Card
    const cardX = 90;
    const cardY = 560;
    const cardW = 900;
    const cardH = 500;

    // Shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 50;
    ctx.shadowOffsetY = 25;

    ctx.fillStyle = customPhoto ? '#FFFFFF' : activeTheme.cardBg;
    roundRect(ctx, cardX, cardY, cardW, cardH, 50);
    ctx.fill();

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Card Header: Profile Info
    ctx.fillStyle = customPhoto ? '#EC1187' : activeTheme.avatarBg;
    ctx.beginPath();
    ctx.arc(cardX + 80, cardY + 80, 42, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 38px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(username.charAt(0).toUpperCase(), cardX + 80, cardY + 80);

    ctx.fillStyle = customPhoto ? '#111827' : activeTheme.cardTextColor;
    ctx.textAlign = 'left';
    ctx.font = '800 36px Inter, sans-serif';
    ctx.fillText(`@${username}`, cardX + 145, cardY + 70);

    ctx.fillStyle = customPhoto ? '#EC1187' : activeTheme.subtextColor;
    ctx.font = '700 24px Inter, sans-serif';
    ctx.fillText('send me anonymous messages', cardX + 145, cardY + 105);

    // Question Body (Wrapped Text)
    ctx.fillStyle = customPhoto ? '#111827' : activeTheme.cardTextColor;
    ctx.font = '800 48px Inter, sans-serif';

    function wrapText(text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
      const words = text.split(' ');
      let line = '';
      let curY = y;
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx!.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
          ctx!.fillText(line, x, curY);
          line = words[n] + ' ';
          curY += lineHeight;
        } else {
          line = testLine;
        }
      }
      ctx!.fillText(line, x, curY);
    }

    wrapText(message.body, cardX + 60, cardY + 230, cardW - 120, 62);

    // Card Footer Trust Badge
    ctx.fillStyle = customPhoto ? '#6B7280' : activeTheme.id === 'midnight' ? '#9CA3AF' : '#6B7280';
    ctx.font = '700 26px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('🔒 anonymous', cardX + cardW - 60, cardY + cardH - 50);

    // 3. If there is a reply, draw Answer Card below
    if (message.reply) {
      const replyY = cardY + cardH + 60;
      const replyH = 340;

      ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
      ctx.shadowBlur = 40;
      ctx.shadowOffsetY = 18;

      ctx.fillStyle = customPhoto ? '#170E22' : activeTheme.id === 'midnight' ? '#222236' : '#1E102E';
      roundRect(ctx, cardX, replyY, cardW, replyH, 45);
      ctx.fill();

      ctx.shadowColor = 'transparent';

      ctx.fillStyle = customPhoto ? '#FF4500' : activeTheme.subtextColor;
      ctx.textAlign = 'left';
      ctx.font = '800 28px Inter, sans-serif';
      ctx.fillText(`REPLY FROM @${username.toUpperCase()}`, cardX + 60, replyY + 70);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '700 42px Inter, sans-serif';
      wrapText(message.reply, cardX + 60, replyY + 140, cardW - 120, 56);
    }

    // 4. Bottom Brand Watermark
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.font = '900 42px Inter, sans-serif';
    ctx.fillText(`${APP_NAME.toLowerCase()}.link/u/${username}`, 540, 1820);

    return canvas;
  }

  async function handleAction(mode: 'download' | 'share') {
    setDownloading(true);
    try {
      const canvas = await renderCanvas();
      if (!canvas) return;

      canvas.toBlob(async (blob) => {
        if (!blob) return;

        // Direct Native Web Share if requested and supported
        if (mode === 'share' && navigator.canShare) {
          const file = new File([blob], `${APP_NAME}-story.png`, { type: 'image/png' });
          if (navigator.canShare({ files: [file] })) {
            try {
              await navigator.share({
                files: [file],
                title: 'Share on Story',
                text: `Send me anonymous messages on ${APP_NAME}!`,
              });
              setDownloading(false);
              return;
            } catch {
              // Share dismissed or unsupported, fall back to download
            }
          }
        }

        // Direct Download fallback
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `${APP_NAME}-story-${message.id.slice(0, 6)}.png`;
        link.href = dataUrl;
        link.click();
        setDownloading(false);
      }, 'image/png');
    } catch {
      setDownloading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm rounded-[32px] bg-gradient-to-b from-[#1f112e] to-[#0d0714] border border-white/10 p-5 shadow-2xl text-white">
        {/* Modal Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
        >
          ✕
        </button>

        <div className="flex items-center justify-between pr-8">
          <div>
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <span>📸</span> Story Sticker
            </h3>
            <p className="mt-0.5 text-xs text-white/60">
              Pick your theme or upload your own selfie.
            </p>
          </div>
        </div>

        {/* Theme Picker Tabs & Photo Upload */}
        <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setActiveTheme(t);
                setCustomPhoto(null);
              }}
              className={`rounded-xl py-1 px-2.5 text-[11px] font-black shrink-0 transition-all ${
                activeTheme.id === t.id && !customPhoto
                  ? 'bg-white text-black shadow-md scale-105'
                  : 'bg-white/5 text-white/60 hover:text-white'
              }`}
            >
              {t.name}
            </button>
          ))}

          {/* Photo Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className={`rounded-xl py-1 px-2.5 text-[11px] font-black shrink-0 transition-all flex items-center gap-1 ${
              customPhoto
                ? 'bg-gradient-to-r from-pink-500 to-orange-500 text-white shadow-md scale-105'
                : 'bg-white/10 text-pink-300 hover:bg-white/20'
            }`}
          >
            <span>📷 {customPhoto ? 'Photo Added' : 'My Photo'}</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoUpload}
          />
        </div>

        {customPhoto && (
          <div className="mt-2 flex items-center justify-between bg-pink-500/10 border border-pink-500/20 rounded-xl px-2.5 py-1 text-xs">
            <span className="text-pink-300 font-bold text-[11px]">Photo loaded as background</span>
            <button
              onClick={removeCustomPhoto}
              className="text-white/60 hover:text-white underline text-[10px]"
            >
              Remove ✕
            </button>
          </div>
        )}

        {/* 9:16 Mini Preview */}
        <div
          className={`relative my-4 aspect-[9/16] w-full overflow-hidden rounded-2xl p-4 shadow-inner flex flex-col justify-center items-center transition-all duration-300 ${
            customPhoto ? 'bg-cover bg-center' : activeTheme.previewClass
          }`}
          style={customPhoto ? { backgroundImage: `url(${customPhoto})` } : undefined}
        >
          {/* Dark Overlay for Photo Mode */}
          {customPhoto && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] -z-0" />
          )}

          {/* Question Bubble */}
          <div
            className="relative z-10 w-full rounded-2xl p-4 shadow-xl transition-colors duration-200"
            style={{
              backgroundColor: customPhoto ? '#FFFFFF' : activeTheme.cardBg,
              color: customPhoto ? '#111827' : activeTheme.cardTextColor,
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className="grid h-8 w-8 place-items-center rounded-full text-xs font-black text-white"
                style={{ backgroundColor: customPhoto ? '#EC1187' : activeTheme.avatarBg }}
              >
                {username.charAt(0).toUpperCase()}
              </div>
              <div>
                <span
                  className="text-xs font-bold block"
                  style={{ color: customPhoto ? '#111827' : activeTheme.cardTextColor }}
                >
                  @{username}
                </span>
                <span
                  className="text-[10px] font-semibold block"
                  style={{ color: customPhoto ? '#EC1187' : activeTheme.subtextColor }}
                >
                  send me anonymous messages
                </span>
              </div>
            </div>
            <p className="text-sm font-extrabold leading-snug line-clamp-4">
              {message.body}
            </p>
            <span
              className="block mt-2 text-right text-[10px] font-bold"
              style={{
                color: customPhoto
                  ? '#6B7280'
                  : activeTheme.id === 'midnight'
                    ? '#9CA3AF'
                    : '#6B7280',
              }}
            >
              🔒 anonymous
            </span>
          </div>

          {/* Reply Bubble (if exists) */}
          {message.reply && (
            <div
              className="relative z-10 w-full mt-3 rounded-2xl p-3 text-white border border-white/15 shadow-xl"
              style={{
                backgroundColor: customPhoto
                  ? '#170E22'
                  : activeTheme.id === 'midnight'
                    ? '#222236'
                    : '#1e102e',
              }}
            >
              <span
                className="text-[10px] font-black uppercase tracking-wider"
                style={{ color: customPhoto ? '#FF4500' : activeTheme.subtextColor }}
              >
                Your reply
              </span>
              <p className="mt-0.5 text-xs font-bold leading-tight line-clamp-3">
                {message.reply}
              </p>
            </div>
          )}

          <div className="relative z-10 absolute bottom-3 text-center text-[10px] font-black text-white/95 drop-shadow">
            {APP_NAME.toLowerCase()}.link/u/{username}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={() => handleAction('share')}
            disabled={downloading}
            className="w-full rounded-2xl bg-gradient-to-r from-[#EC1187] via-[#FF4500] to-[#FF8D10] py-3.5 text-sm font-black text-white shadow-lg shadow-[#EC1187]/40 hover:brightness-110 active:scale-[0.98] transition-all"
          >
            {downloading ? 'Preparing Sticker…' : 'Share to Instagram Story 📲'}
          </button>
          <button
            onClick={() => handleAction('download')}
            disabled={downloading}
            className="w-full rounded-2xl bg-white/10 py-2.5 text-xs font-bold text-white/80 hover:bg-white/20 transition"
          >
            Download PNG Sticker 📥
          </button>
        </div>
      </div>
    </div>
  );
}
