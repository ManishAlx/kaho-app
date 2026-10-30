'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  AdminMessageRow,
  AdminStats,
  AdminUserRow,
  GameModeStat,
  GlobalAnnouncement,
  TopInfluencer,
} from '@/lib/db';
import { APP_NAME, GAME_MODES } from '@/lib/config';
import { timeAgo } from '@/lib/time';

export default function FounderClient({ initialAuth }: { initialAuth: boolean }) {
  const [isAuth, setIsAuth] = useState(initialAuth);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginErr, setLoginErr] = useState('');
  const [loginBusy, setLoginBusy] = useState(false);

  // Dashboard Data State
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [topInfluencers, setTopInfluencers] = useState<TopInfluencer[]>([]);
  const [gameModes, setGameModes] = useState<GameModeStat[]>([]);
  const [announcement, setAnnouncement] = useState<GlobalAnnouncement | null>(null);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [messages, setMessages] = useState<AdminMessageRow[]>([]);

  // Search & Navigation Tabs
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'messages' | 'broadcast'>('users');
  const [loading, setLoading] = useState(false);
  const [actionBusy, setActionBusy] = useState<string | null>(null);

  // Live Radar State (15-Sec Auto Refresh)
  const [liveRadar, setLiveRadar] = useState(false);
  const radarIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Announcement Composer State
  const [annMsg, setAnnMsg] = useState('');
  const [annSaving, setAnnSaving] = useState(false);
  const [annAlert, setAnnAlert] = useState<{ ok: boolean; text: string } | null>(null);

  const fetchData = useCallback(async (query = '', silent = false) => {
    if (!silent) setLoading(true);
    try {
      const qs = query ? `?q=${encodeURIComponent(query)}` : '';
      const res = await fetch(`/api/founder-hq/data${qs}`);
      if (res.status === 401) {
        setIsAuth(false);
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to load');
      setStats(data.stats);
      setTopInfluencers(data.topInfluencers || []);
      setGameModes(data.gameModes || []);
      setAnnouncement(data.announcement || null);
      if (data.announcement?.message) {
        setAnnMsg(data.announcement.message);
      }
      setUsers(data.users || []);
      setMessages(data.messages || []);
    } catch {
      // ignore
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuth) {
      fetchData(search);
    }
  }, [isAuth, fetchData, search]);

  // Live Radar Effect
  useEffect(() => {
    if (!isAuth) return;
    if (liveRadar) {
      radarIntervalRef.current = setInterval(() => {
        fetchData(search, true);
      }, 15000);
    } else {
      if (radarIntervalRef.current) clearInterval(radarIntervalRef.current);
    }
    return () => {
      if (radarIntervalRef.current) clearInterval(radarIntervalRef.current);
    };
  }, [liveRadar, isAuth, fetchData, search]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginErr('');
    setLoginBusy(true);
    try {
      const res = await fetch('/api/founder-hq/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Invalid credentials');
      setIsAuth(true);
      setPassword('');
    } catch (err) {
      setLoginErr(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoginBusy(false);
    }
  }

  async function handleLogout() {
    await fetch('/api/founder-hq/logout', { method: 'POST' });
    setIsAuth(false);
  }

  async function saveAnnouncement(active: boolean) {
    setAnnSaving(true);
    setAnnAlert(null);
    try {
      const res = await fetch('/api/founder-hq/announcement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: annMsg, active }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Could not update announcement');
      setAnnouncement(data.announcement);
      setAnnAlert({
        ok: true,
        text: active ? 'Announcement published to all user inboxes! 🚀' : 'Announcement disabled.',
      });
    } catch (err) {
      setAnnAlert({
        ok: false,
        text: err instanceof Error ? err.message : 'Failed to update announcement',
      });
    } finally {
      setAnnSaving(false);
    }
  }

  async function executeAction(action: 'delete_user' | 'delete_message', id: string, label: string) {
    if (!confirm(`Are you sure you want to permanently delete this ${label}?`)) return;
    setActionBusy(id);
    try {
      const res = await fetch('/api/founder-hq/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, id }),
      });
      if (!res.ok) throw new Error('Action failed');
      if (action === 'delete_user') {
        setUsers((prev) => prev.filter((u) => u.id !== id));
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== id));
      }
    } catch {
      alert('Could not perform action');
    } finally {
      setActionBusy(null);
    }
  }

  function exportCSV() {
    if (users.length === 0) return;
    const header = ['Username', 'Display Name', 'Email', 'Account Type', 'Confessions Received', 'Registered Date'];
    const rows = users.map((u) => [
      `@${u.username}`,
      `"${u.displayName.replace(/"/g, '""')}"`,
      u.email,
      u.email.endsWith('@kaho.internal') ? 'Instant Onboarding' : 'Regular Email',
      u.messageCount,
      new Date(u.createdAt).toISOString(),
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [header.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `kaho_users_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // --- RESTRICTED LOGIN SCREEN (STEALTH MODE) ---
  if (!isAuth) {
    return (
      <div className="mx-auto my-16 max-w-md px-3 text-center">
        <div className="card relative overflow-hidden border border-white/10 bg-[#160b20] p-8 shadow-[0_25px_60px_rgba(236,17,135,0.3)]">
          <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 h-40 w-40 rounded-full bg-gradient-to-r from-pink-500/30 to-orange-500/30 blur-2xl" />

          <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-tr from-[#EC1187] to-[#FF8D10] text-2xl text-white shadow-lg">
            🛡️
          </div>

          <span className="inline-block rounded-full bg-pink-500/15 border border-pink-500/30 px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-pink-300">
            Internal Clearance Only
          </span>

          <h1 className="mt-3 text-2xl font-black text-white">{APP_NAME} Executive HQ</h1>
          <p className="mt-1 text-xs text-white/60">
            Restricted access. Sign in with verified founder credentials.
          </p>

          <form onSubmit={handleLogin} className="mt-6 space-y-3.5 text-left">
            <div>
              <label className="label text-[11px] font-bold text-white/70" htmlFor="admin-u">
                Founder Username
              </label>
              <input
                id="admin-u"
                type="text"
                className="input text-xs font-bold"
                placeholder="Enter admin username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <div>
              <label className="label text-[11px] font-bold text-white/70" htmlFor="admin-p">
                Security Password
              </label>
              <input
                id="admin-p"
                type="password"
                className="input text-xs font-mono"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            {loginErr && <div className="alert-error text-xs" role="alert">{loginErr}</div>}

            <button
              className="btn btn-primary w-full !py-3 text-sm font-black shadow-lg active:scale-95 transition"
              disabled={loginBusy || !username.trim() || !password.trim()}
            >
              {loginBusy ? 'Authenticating…' : 'Authenticate & Enter ⚡'}
            </button>
          </form>

          <div className="mt-5 border-t border-white/10 pt-3 text-[11px] font-semibold text-white/40 flex items-center justify-center gap-1.5">
            <span>🔒 256-bit Protected Session</span>
            <span>•</span>
            <span>IP Monitored</span>
          </div>
        </div>
      </div>
    );
  }

  // --- EXECUTIVE FOUNDER DASHBOARD ---
  return (
    <div className="mx-auto max-w-5xl py-6 px-2 text-white space-y-6">
      {/* Top Command Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-tr from-[#EC1187] to-[#FF8D10] text-sm font-black text-white shadow-sm">
              HQ
            </span>
            <h1 className="text-2xl font-black text-white tracking-tight">{APP_NAME} Executive Control</h1>
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-black text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live System
            </span>
          </div>
          <p className="text-xs text-white/60 mt-0.5">Real-time virality telemetry, user management & broadcast switchboard</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Live Radar Toggle */}
          <button
            onClick={() => setLiveRadar(!liveRadar)}
            className={`btn !py-1.5 !px-3 text-xs font-black transition-all active:scale-95 flex items-center gap-1.5 ${
              liveRadar
                ? 'bg-emerald-500/20 border border-emerald-400 text-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                : 'border border-white/20 bg-white/5 text-white/60 hover:text-white'
            }`}
            title="Auto-refresh incoming confessions every 15 seconds"
          >
            <span className={`h-2 w-2 rounded-full ${liveRadar ? 'bg-emerald-400 animate-ping' : 'bg-white/40'}`} />
            <span>{liveRadar ? 'Radar Active (15s)' : 'Live Radar'}</span>
          </button>

          <button
            onClick={() => fetchData(search)}
            disabled={loading}
            className="btn border border-white/20 bg-white/5 text-xs font-bold hover:bg-white/10"
            title="Refresh latest data"
          >
            {loading ? '…' : '🔄'}
          </button>

          <button
            onClick={exportCSV}
            className="btn border border-pink-500/40 bg-pink-500/10 text-xs font-bold text-pink-300 hover:bg-pink-500/20"
            title="Download users spreadsheet"
          >
            📥 CSV
          </button>

          <button
            onClick={handleLogout}
            className="btn btn-ghost text-xs text-red-400/80 hover:text-red-400"
          >
            Logout 🚪
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="card border border-white/10 bg-[#160b20] p-4">
            <p className="text-xs font-extrabold uppercase tracking-wider text-white/50">Total Claimed Links</p>
            <p className="mt-1 text-2xl font-black text-white">{stats.totalUsers}</p>
            <span className="mt-1 inline-block text-[11px] font-bold text-emerald-400">
              +{stats.usersToday} today
            </span>
          </div>

          <div className="card border border-white/10 bg-[#160b20] p-4">
            <p className="text-xs font-extrabold uppercase tracking-wider text-white/50">Total Confessions</p>
            <p className="mt-1 text-2xl font-black text-white">{stats.totalMessages}</p>
            <span className="mt-1 inline-block text-[11px] font-bold text-pink-400">
              +{stats.messagesToday} today
            </span>
          </div>

          <div className="card border border-white/10 bg-[#160b20] p-4">
            <p className="text-xs font-extrabold uppercase tracking-wider text-white/50">Virality Index</p>
            <p className="mt-1 text-2xl font-black text-white">
              {stats.totalUsers > 0 ? (stats.totalMessages / stats.totalUsers).toFixed(1) : 0}
            </p>
            <span className="mt-1 inline-block text-[11px] font-bold text-white/50">
              avg msgs / user
            </span>
          </div>

          <div className="card border border-white/10 bg-[#160b20] p-4">
            <p className="text-xs font-extrabold uppercase tracking-wider text-white/50">Safety Shields</p>
            <p className="mt-1 text-2xl font-black text-white">{stats.totalBlocked}</p>
            <span className="mt-1 inline-block text-[11px] font-bold text-orange-400">
              blocked senders
            </span>
          </div>
        </div>
      )}

      {/* Row 2: Top Viral Influencers & Game Modes Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 🏆 Feature 1: Top Viral Influencers / Leaderboard */}
        <div className="card border border-pink-500/20 bg-[#180b24] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-white flex items-center gap-1.5">
              <span>🏆</span> Top Viral Influencers (Leaderboard)
            </h2>
            <span className="text-[10px] font-bold text-pink-300 bg-pink-500/20 px-2 py-0.5 rounded-full">
              Traffic Drivers
            </span>
          </div>

          <div className="space-y-2">
            {topInfluencers.map((item, idx) => {
              const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
              return (
                <div
                  key={item.username}
                  className="flex items-center justify-between gap-2 rounded-xl bg-white/[0.03] border border-white/5 p-2.5 hover:bg-white/[0.07] transition"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-sm font-black w-6 text-center">{medal}</span>
                    <div className="min-w-0">
                      <a
                        href={`/u/${item.username}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-extrabold text-white text-xs hover:text-pink-400 transition truncate block"
                      >
                        @{item.username} ↗
                      </a>
                      <span className="text-[10px] text-white/40 block truncate">{item.displayName}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-black text-xs text-pink-300 bg-pink-500/20 px-2 py-0.5 rounded-full">
                      {item.messageCount} msgs
                    </span>
                    <span className="text-[10px] text-white/40 block mt-0.5">{timeAgo(item.lastActive)}</span>
                  </div>
                </div>
              );
            })}
            {topInfluencers.length === 0 && (
              <p className="text-xs text-white/40 py-4 text-center">No confessions recorded yet.</p>
            )}
          </div>
        </div>

        {/* 📊 Feature 4: Game Modes Virality Breakdown */}
        <div className="card border border-white/10 bg-[#160b20] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-white flex items-center gap-1.5">
              <span>📊</span> Game Modes Popularity
            </h2>
            <span className="text-[10px] font-bold text-white/50">Engagement Share</span>
          </div>

          <div className="space-y-2.5 pt-1">
            {GAME_MODES.map((gm) => {
              const stat = gameModes.find((g) => g.gameMode === gm.id);
              const count = stat ? stat.count : 0;
              const percentage = stat ? stat.percentage : 0;
              return (
                <div key={gm.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white/90 flex items-center gap-1">
                      <span>{gm.icon}</span>
                      <span>{gm.name}</span>
                    </span>
                    <span className="font-black text-white/60">
                      {count} msgs ({percentage}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-pink-500 to-orange-500 transition-all duration-500"
                      style={{ width: `${Math.max(percentage, 3)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 📢 Feature 2: Global Announcement / Broadcast Manager */}
      <div className="card border border-purple-500/30 bg-gradient-to-r from-[#1d0d2e] to-[#160b20] p-5 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-sm font-black text-white flex items-center gap-1.5">
              <span>📢</span> Platform Broadcast Switchboard
            </h2>
            <p className="text-xs text-white/60 mt-0.5">
              Broadcast a message to every user&apos;s inbox header instantly (e.g. app updates, challenges).
            </p>
          </div>

          {announcement?.active && (
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-xs font-black text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Broadcasting Live
            </span>
          )}
        </div>

        {annAlert && (
          <div
            className={`rounded-xl p-2.5 text-xs font-bold ${
              annAlert.ok ? 'bg-emerald-950/80 border border-emerald-400 text-emerald-200' : 'alert-error'
            }`}
          >
            {annAlert.text}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            className="input text-xs font-bold flex-1"
            placeholder="e.g. 🔥 New 'Ship Me 💕' mode is live! Add to your story now!"
            value={annMsg}
            onChange={(e) => setAnnMsg(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              onClick={() => saveAnnouncement(true)}
              disabled={annSaving || !annMsg.trim()}
              className="btn btn-primary text-xs font-black !py-2 !px-4 shrink-0 shadow-md"
            >
              {annSaving ? 'Updating…' : 'Broadcast Live 🚀'}
            </button>
            {announcement?.active && (
              <button
                onClick={() => saveAnnouncement(false)}
                disabled={annSaving}
                className="btn border border-white/20 bg-white/5 text-xs font-bold text-white/70 hover:text-white shrink-0"
              >
                Turn Off ⏸️
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex gap-1 rounded-full p-1 bg-white/5 border border-white/10 backdrop-blur-sm" role="tablist">
          <button
            onClick={() => setActiveTab('users')}
            className={`rounded-full px-4 py-1.5 text-xs font-black transition-all ${
              activeTab === 'users'
                ? 'bg-gradient-to-r from-pink-500 to-orange-500 text-white shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            👥 Registered Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className={`rounded-full px-4 py-1.5 text-xs font-black transition-all ${
              activeTab === 'messages'
                ? 'bg-gradient-to-r from-pink-500 to-orange-500 text-white shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            💌 Confessions Stream ({messages.length})
          </button>
        </div>

        {activeTab === 'users' && (
          <div className="w-full sm:w-64">
            <input
              type="text"
              className="input !py-1.5 text-xs"
              placeholder="Search username or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* USERS DIRECTORY VIEW */}
      {activeTab === 'users' && (
        <div className="card overflow-hidden border border-white/10 bg-[#160b20] p-0 shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-white/80">
              <thead className="border-b border-white/10 bg-white/5 text-[11px] font-black uppercase tracking-wider text-white/50">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Email / Mode</th>
                  <th className="py-3 px-4">Messages</th>
                  <th className="py-3 px-4">Joined</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((u) => {
                  const isInstant = u.email.endsWith('@kaho.internal');
                  return (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-tr from-pink-500 to-orange-500 font-black text-white text-xs shadow-sm">
                            {u.username[0]?.toUpperCase()}
                          </div>
                          <div>
                            <a
                              href={`/u/${u.username}`}
                              target="_blank"
                              rel="noreferrer"
                              className="font-extrabold text-white hover:text-pink-400 transition"
                            >
                              @{u.username} ↗
                            </a>
                            <p className="text-[11px] text-white/50">{u.displayName}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {isInstant ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-pink-500/20 px-2 py-0.5 text-[10px] font-bold text-pink-300">
                            <span>⚡ Instant</span>
                          </span>
                        ) : (
                          <span className="text-white/80 font-mono text-[11px]">{u.email}</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-white bg-white/10 px-2 py-0.5 rounded-full text-[11px]">
                          {u.messageCount} received
                        </span>
                      </td>

                      <td className="py-3 px-4 text-white/50">
                        {timeAgo(u.createdAt)}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => executeAction('delete_user', u.id, `user @${u.username}`)}
                          disabled={actionBusy === u.id}
                          className="btn btn-ghost !p-1.5 text-xs text-red-400/60 hover:text-red-400"
                          title="Delete user and all messages"
                        >
                          🗑
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-white/40">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONFESSIONS STREAM VIEW */}
      {activeTab === 'messages' && (
        <div className="space-y-3">
          {messages.map((m) => {
            const mode = GAME_MODES.find((g) => g.id === m.gameMode) || GAME_MODES[0];
            return (
              <div
                key={m.id}
                className="card border border-white/10 bg-[#160b20] p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-extrabold text-pink-300">
                      <span>{mode.icon}</span>
                      <span>{mode.name}</span>
                    </span>
                    <span className="text-xs font-bold text-white/50">Sent to:</span>
                    <a
                      href={`/u/${m.recipientUsername}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-black text-pink-400 hover:underline"
                    >
                      @{m.recipientUsername}
                    </a>
                    <span className="text-[11px] text-white/40">• {timeAgo(m.createdAt)}</span>
                  </div>

                  <p className="whitespace-pre-wrap break-words text-sm font-bold text-white">
                    {m.body}
                  </p>

                  {(m.hintDevice || m.hintLocation) && (
                    <div className="flex items-center gap-3 text-[11px] text-white/40">
                      {m.hintDevice && <span>📱 {m.hintDevice}</span>}
                      {m.hintLocation && <span>📍 {m.hintLocation}</span>}
                    </div>
                  )}

                  {m.reply && (
                    <div className="rounded-xl bg-black/40 border border-white/10 p-2 text-xs">
                      <span className="text-[10px] font-bold text-pink-400 block">User Reply:</span>
                      <span className="text-white/90">{m.reply}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => executeAction('delete_message', m.id, 'confession')}
                  disabled={actionBusy === m.id}
                  className="btn btn-ghost !p-2 text-xs text-red-400/60 hover:text-red-400 shrink-0 self-end sm:self-start"
                  title="Delete message from database"
                >
                  🗑 Delete
                </button>
              </div>
            );
          })}
          {messages.length === 0 && (
            <div className="card text-center py-8 text-xs text-white/40">
              No confessions sent yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
