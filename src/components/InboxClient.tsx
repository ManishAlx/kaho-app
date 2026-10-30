'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Message } from '@/lib/db';
import { APP_NAME, GAME_MODES } from '@/lib/config';
import { playNotificationChime } from '@/lib/sound';
import { timeAgo } from '@/lib/time';
import HintsModal from './HintsModal';
import StoryCardModal from './StoryCardModal';
import ShareTutorialModal from './ShareTutorialModal';
import RecapModal from './RecapModal';

type Filter = 'all' | 'unanswered' | 'answered';
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'unanswered', label: 'Unanswered' },
  { id: 'answered', label: 'Answered' },
];

export default function InboxClient({ username }: { username: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [cursor, setCursor] = useState<string | null>(null);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [replyId, setReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [link, setLink] = useState(`/u/${username}`);

  // Tap-to-reveal secret scratch tracking for unread messages
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());

  // Modals for Story Card, Clues, Sharing Tutorial, and Weekly Recap
  const [storyMessage, setStoryMessage] = useState<Message | null>(null);
  const [hintsMessage, setHintsMessage] = useState<Message | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showRecap, setShowRecap] = useState(false);
  const [soundMuted, setSoundMuted] = useState(false);
  const [announcement, setAnnouncement] = useState<string | null>(null);
  const [annDismissed, setAnnDismissed] = useState(false);

  const prevUnreadRef = useRef(0);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && localStorage.getItem('kaho_sound_muted') === 'true') {
        setSoundMuted(true);
      }
    } catch {
      // localStorage unavailable
    }

    // Fetch active global announcement
    fetch('/api/announcement')
      .then((r) => r.json())
      .then((d) => {
        if (d?.announcement?.active && d.announcement.message) {
          setAnnouncement(d.announcement.message);
        }
      })
      .catch(() => {});
  }, []);

  const playSound = useCallback(() => {
    try {
      if (typeof window !== 'undefined' && localStorage.getItem('kaho_sound_muted') === 'true') {
        return;
      }
    } catch {}
    playNotificationChime();
  }, []);

  useEffect(() => {
    setLink(`${window.location.origin}/u/${username}`);
  }, [username]);

  // Update tab title with unread counter
  useEffect(() => {
    if (unread > 0) {
      document.title = `(${unread}) Inbox - ${APP_NAME}`;
    } else {
      document.title = `Inbox - ${APP_NAME}`;
    }
  }, [unread]);

  const load = useCallback(async (f: Filter, cur: string | null, isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError('');
    try {
      const qs = new URLSearchParams({ filter: f });
      if (cur) qs.set('cursor', cur);
      const res = await fetch(`/api/inbox?${qs}`);
      if (res.status === 401) {
        window.location.href = '/login';
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Could not load messages');

      // Check if new messages arrived in background to trigger chime
      if (isSilent && data.unreadCount > prevUnreadRef.current) {
        playSound();
      }
      prevUnreadRef.current = data.unreadCount;

      setMessages((prev) => (cur ? [...prev, ...data.messages] : data.messages));
      setCursor(data.nextCursor);
      setUnread(data.unreadCount);
    } catch (e) {
      if (!isSilent) setError(e instanceof Error ? e.message : 'Could not load messages');
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(filter, null);
  }, [filter, load]);

  // Real-time background polling every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      load(filter, null, true);
    }, 10000);
    return () => clearInterval(interval);
  }, [filter, load]);

  async function patch(id: string, body: object) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/messages/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Update failed');
      const was = messages.find((m) => m.id === id);
      setMessages((ms) => ms.map((m) => (m.id === id ? data.message : m)));
      if (was && !was.isRead && data.message.isRead) {
        setUnread((n) => Math.max(0, n - 1));
        prevUnreadRef.current = Math.max(0, prevUnreadRef.current - 1);
      }
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed');
      return false;
    } finally {
      setBusyId(null);
    }
  }

  async function revealMessage(id: string) {
    setRevealedIds((prev) => new Set([...prev, id]));
    playSound();
    await patch(id, { isRead: true });
  }

  async function blockSender(id: string) {
    if (
      !confirm(
        'Block this anonymous sender permanently? They will never be able to send you messages again, and this confession will be removed.'
      )
    ) {
      return;
    }
    setBusyId(id);
    try {
      const res = await fetch(`/api/messages/${id}/block`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Could not block sender');
      const was = messages.find((m) => m.id === id);
      setMessages((ms) => ms.filter((m) => m.id !== id));
      if (was && !was.isRead) {
        setUnread((n) => Math.max(0, n - 1));
        prevUnreadRef.current = Math.max(0, prevUnreadRef.current - 1);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to block sender');
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this message? This cannot be undone.')) return;
    setBusyId(id);
    const res = await fetch(`/api/messages/${id}`, { method: 'DELETE' });
    setBusyId(null);
    if (!res.ok) return setError('Could not delete the message');
    const was = messages.find((m) => m.id === id);
    setMessages((ms) => ms.filter((m) => m.id !== id));
    if (was && !was.isRead) {
      setUnread((n) => Math.max(0, n - 1));
      prevUnreadRef.current = Math.max(0, prevUnreadRef.current - 1);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  }

  function getModeBadge(modeId?: string) {
    const found = GAME_MODES.find((m) => m.id === modeId) || GAME_MODES[0];
    return found;
  }

  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`Send me anonymous messages on ${APP_NAME}! 🤫🔥\n${link}`)}`;

  return (
    <div className="mx-auto max-w-2xl py-6 px-2">
      {/* Global Founder Broadcast Banner */}
      {announcement && !annDismissed && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-purple-900/60 via-pink-900/40 to-orange-900/40 border border-pink-500/40 p-3.5 shadow-lg backdrop-blur-md animate-fade-in text-white">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-gradient-to-tr from-pink-500 to-orange-500 text-xs shadow-sm">
              📢
            </span>
            <p className="text-xs font-black text-white leading-snug truncate sm:whitespace-normal">
              {announcement}
            </p>
          </div>
          <button
            onClick={() => setAnnDismissed(true)}
            className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-white/10 text-xs text-white/60 hover:text-white"
            aria-label="Dismiss announcement"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Share Card (KAHO Signature Sunset Gradient) */}
      <div
        className="card mb-6 overflow-hidden border-none text-white p-6 shadow-[0_15px_40px_rgba(236,17,135,0.3)]"
        style={{
          background: 'linear-gradient(135deg, #EC1187 0%, #FF4500 50%, #FF8D10 100%)',
        }}
      >
        <div className="flex items-center justify-between">
          <p className="text-xs font-black uppercase tracking-wider text-white/90">
            🔥 Your Secret Link
          </p>
          <span className="flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-extrabold backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Live polling
          </span>
        </div>
        <p className="mt-1.5 break-all text-xl font-black text-white tracking-tight" data-testid="my-link">
          {link}
        </p>

        <div className="mt-4 flex flex-wrap gap-2.5">
          <button
            onClick={copy}
            className="btn bg-white text-gray-900 shadow-md hover:bg-white/90 active:scale-95 font-black"
          >
            {copied ? 'Copied ✓' : 'Copy link 🔗'}
          </button>

          <button
            onClick={() => setShowTutorial(true)}
            className="btn border border-white/60 bg-black/25 text-white hover:bg-black/35 backdrop-blur-sm active:scale-95 font-black flex items-center gap-1.5"
          >
            <span>Story Guide 📸</span>
          </button>

          <a
            href={whatsappShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn bg-[#25D366] text-black font-black hover:bg-[#20ba5a] active:scale-95 shadow-md flex items-center gap-1.5"
          >
            <span>WhatsApp 💬</span>
          </a>

          <a
            href={`/u/${username}`}
            target="_blank"
            rel="noreferrer"
            className="btn border border-white/30 text-white/90 hover:bg-white/10 text-xs"
          >
            Preview ↗
          </a>
        </div>
      </div>

      {/* Inbox Tabs Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h1 className="flex items-center gap-2 text-2xl font-black text-white">
            Inbox
            {unread > 0 && (
              <span
                className="rounded-full bg-gradient-to-r from-pink-500 to-orange-500 px-2.5 py-0.5 text-xs font-extrabold text-white shadow-sm"
                aria-label={`${unread} unread`}
              >
                {unread} new
              </span>
            )}
          </h1>

          <button
            onClick={() => setShowRecap(true)}
            className="rounded-full bg-gradient-to-r from-purple-500/25 to-pink-500/25 border border-pink-500/40 px-3 py-1 text-xs font-black text-pink-300 hover:bg-pink-500/40 active:scale-95 transition flex items-center gap-1 shadow-sm"
            title="View and share your weekly anonymous stats"
          >
            <span>📊 Weekly Recap</span>
          </button>

          <button
            onClick={() => {
              const next = !soundMuted;
              setSoundMuted(next);
              try {
                localStorage.setItem('kaho_sound_muted', String(next));
              } catch {}
            }}
            className={`rounded-full border px-2.5 py-1 text-xs font-black transition active:scale-95 flex items-center gap-1 shadow-sm ${
              soundMuted
                ? 'bg-white/5 border-white/10 text-white/40 hover:text-white/70'
                : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25'
            }`}
            title={soundMuted ? 'Chime sound is muted. Click to turn on.' : 'Chime sound is on. Click to mute.'}
          >
            <span>{soundMuted ? '🔕 Muted' : '🔔 Sound'}</span>
          </button>
        </div>

        <div
          className="flex gap-1 rounded-full p-1 bg-white/5 border border-white/10 backdrop-blur-sm"
          role="tablist"
        >
          {FILTERS.map((f) => (
            <button
              key={f.id}
              role="tab"
              aria-selected={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-black transition-all ${
                filter === f.id
                  ? 'bg-gradient-to-r from-pink-500 to-orange-500 text-white shadow-md'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="alert-error mb-4" role="alert">{error}</div>}

      {/* Messages List */}
      <ul className="space-y-4">
        {messages.map((m) => {
          const mode = getModeBadge(m.gameMode);
          const isUnrevealed = !m.isRead && !revealedIds.has(m.id);

          return (
            <li
              key={m.id}
              className={`card relative overflow-hidden transition-all border ${
                !m.isRead
                  ? 'border-pink-500/40 bg-[#211132] shadow-[0_8px_30px_rgba(236,17,135,0.18)]'
                  : 'border-white/10 bg-[#160b20]'
              }`}
            >
              {/* Message Header Badge */}
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-extrabold text-pink-300">
                  <span>{mode.icon}</span>
                  <span>{mode.name}</span>
                </span>
                <span className="text-[11px] font-semibold text-white/50">{timeAgo(m.createdAt)}</span>
              </div>

              {/* Message Content: Tap-to-Reveal Scratch Mystery or Revealed Text */}
              {isUnrevealed ? (
                <div
                  onClick={() => revealMessage(m.id)}
                  className="group my-2 cursor-pointer rounded-2xl border-2 border-dashed border-pink-500/50 bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-orange-500/20 p-5 text-center transition-all hover:scale-[1.01] active:scale-95 shadow-md"
                >
                  <div className="flex items-center justify-center gap-2 text-2xl mb-1 group-hover:scale-110 transition-transform">
                    <span>🤫</span>
                    <span className="animate-pulse">✨</span>
                    <span>💌</span>
                  </div>
                  <p className="text-base font-black text-white">Tap to Reveal Secret Confession!</p>
                  <p className="text-xs font-semibold text-pink-300/80 mt-0.5">
                    Click to unbox anonymous message
                  </p>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3 my-1 animate-fade-in">
                  <p className="whitespace-pre-wrap break-words text-lg font-bold text-white leading-relaxed">
                    {!m.isRead && (
                      <span
                        className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-pink-500 align-middle shadow-[0_0_8px_#EC1187]"
                        title="Unread"
                      />
                    )}
                    {m.body}
                  </p>
                </div>
              )}

              {/* Saved Reply Section */}
              {m.reply && (
                <div className="mt-3 rounded-2xl bg-black/40 border border-white/10 p-3.5 text-sm">
                  <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-pink-400">
                    Your reply
                  </p>
                  <p className="whitespace-pre-wrap break-words text-white/95 font-semibold">
                    {m.reply}
                  </p>
                </div>
              )}

              {/* Reply Editing Box */}
              {replyId === m.id ? (
                <div className="mt-3 space-y-2">
                  <textarea
                    className="input min-h-[90px] resize-none text-sm font-medium"
                    placeholder="Write your response to share on story…"
                    maxLength={1000}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      className="btn btn-primary !py-2 !px-4 text-xs font-black"
                      disabled={busyId === m.id || !replyText.trim()}
                      onClick={async () => {
                        if (await patch(m.id, { reply: replyText })) {
                          setReplyId(null);
                          setReplyText('');
                        }
                      }}
                    >
                      Save reply
                    </button>
                    <button
                      className="btn btn-ghost !py-2 !px-3 text-xs"
                      onClick={() => {
                        setReplyId(null);
                        setReplyText('');
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Action Toolbar */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  {/* Share on Story Button */}
                  <button
                    className="btn !py-1.5 !px-3 text-xs font-black text-white shadow-md active:scale-95"
                    style={{ background: 'linear-gradient(135deg, #EC1187 0%, #FF8D10 100%)' }}
                    onClick={() => setStoryMessage(m)}
                    title="Generate 9:16 Instagram Story Image"
                  >
                    <span>📸 Story Sticker</span>
                  </button>

                  {/* Who sent this? Clues Button */}
                  <button
                    className="btn border border-pink-500/40 bg-pink-500/10 text-pink-300 hover:bg-pink-500/20 !py-1.5 !px-3 text-xs font-extrabold active:scale-95"
                    onClick={() => setHintsMessage(m)}
                    title="View AI crush probability & device telemetry"
                  >
                    <span>🔍 Who sent this?</span>
                  </button>

                  {/* Reply Button */}
                  <button
                    className="btn btn-ghost !py-1.5 !px-3 text-xs text-white/80"
                    onClick={() => {
                      setReplyId(replyId === m.id ? null : m.id);
                      setReplyText(m.reply ?? '');
                    }}
                  >
                    {m.reply ? 'Edit reply' : 'Reply'}
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  {/* Mark as read/unread toggle */}
                  <button
                    className="btn btn-ghost !p-2 text-xs text-white/50 hover:text-white"
                    onClick={() => patch(m.id, { isRead: !m.isRead })}
                    title={m.isRead ? 'Mark as unread' : 'Mark as read'}
                  >
                    {m.isRead ? '✉️' : '📩'}
                  </button>

                  {/* Delete Button */}
                  <button
                    className="btn btn-ghost !p-2 text-xs text-red-400/70 hover:text-red-400"
                    onClick={() => remove(m.id)}
                    aria-label="Delete message"
                    title="Delete this message"
                  >
                    🗑
                  </button>

                  {/* Block Sender Button */}
                  <button
                    className="btn btn-ghost !p-2 text-xs text-orange-400/70 hover:text-orange-300 hover:bg-orange-500/10"
                    onClick={() => blockSender(m.id)}
                    aria-label="Block sender"
                    title="Block this anonymous sender permanently"
                  >
                    🚫
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {loading && (
        <div className="py-12 text-center text-sm font-semibold text-white/50">
          <span className="inline-block h-5 w-5 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mb-2" />
          <p>Loading messages…</p>
        </div>
      )}

      {!loading && messages.length === 0 && (
        <div className="card my-8 text-center p-8 border border-white/10 bg-[#160b20]">
          <span className="text-4xl block mb-2">📬</span>
          <h3 className="text-lg font-black text-white">Your inbox is empty</h3>
          <p className="muted mt-1 text-xs max-w-sm mx-auto">
            {filter === 'all'
              ? 'Share your secret link on your Instagram Story or WhatsApp status to get your first anonymous confession!'
              : 'Try switching to another filter.'}
          </p>
          <button onClick={() => setShowTutorial(true)} className="btn btn-primary mt-4 !px-6 !py-2.5 text-xs font-black">
            Share link on Story 🚀
          </button>
        </div>
      )}

      {!loading && cursor && (
        <div className="mt-5 text-center">
          <button className="btn btn-ghost" onClick={() => load(filter, cursor)}>
            Load more
          </button>
        </div>
      )}

      {/* Story Card Multi-Theme PNG Generator Modal */}
      {storyMessage && (
        <StoryCardModal
          message={storyMessage}
          username={username}
          onClose={() => setStoryMessage(null)}
        />
      )}

      {/* Hints Clues Modal with AI Crush Meter, Paywall & Watch Ad */}
      {hintsMessage && (
        <HintsModal
          message={hintsMessage}
          onClose={() => setHintsMessage(null)}
        />
      )}

      {/* Step-by-Step Instagram Story Tutorial Walkthrough Modal */}
      {showTutorial && (
        <ShareTutorialModal
          link={link}
          username={username}
          onClose={() => setShowTutorial(false)}
        />
      )}

      {/* Weekly Stats Recap Modal */}
      {showRecap && (
        <RecapModal
          username={username}
          messages={messages}
          onClose={() => setShowRecap(false)}
        />
      )}
    </div>
  );
}
