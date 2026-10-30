'use client';
import { useCallback, useEffect, useState } from 'react';
import type { AdminMessageRow, AdminStats, AdminUserRow } from '@/lib/db';
import { APP_NAME, GAME_MODES } from '@/lib/config';
import { timeAgo } from '@/lib/time';

export default function AdminClient({ initialAuth }: { initialAuth: boolean }) {
  const [isAuth, setIsAuth] = useState(initialAuth);
  const [passcode, setPasscode] = useState('');
  const [loginErr, setLoginErr] = useState('');
  const [loginBusy, setLoginBusy] = useState(false);

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [messages, setMessages] = useState<AdminMessageRow[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'messages'>('users');
  const [loading, setLoading] = useState(false);
  const [actionBusy, setActionBusy] = useState<string | null>(null);

  const fetchData = useCallback(async (query = '') => {
    setLoading(true);
    try {
      const qs = query ? `?q=${encodeURIComponent(query)}` : '';
      const res = await fetch(`/api/admin/data${qs}`);
      if (res.status === 401) {
        setIsAuth(false);
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to load');
      setStats(data.stats);
      setUsers(data.users);
      setMessages(data.messages);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuth) {
      fetchData(search);
    }
  }, [isAuth, fetchData, search]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginErr('');
    setLoginBusy(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Invalid passcode');
      setIsAuth(true);
      setPasscode('');
    } catch (err) {
      setLoginErr(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoginBusy(false);
    }
  }

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    setIsAuth(false);
  }

  async function executeAction(action: 'delete_user' | 'delete_message', id: string, label: string) {
    if (!confirm(`Are you sure you want to permanently delete this ${label}?`)) return;
    setActionBusy(id);
    try {
      const res = await fetch('/api/admin/action', {
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

  // --- PASSCODE GATE FOR FOUNDER ACCESS ---
  if (!isAuth) {
    return (
      <div className="mx-auto my-16 max-w-md px-3 text-center">
        <div className="card border border-white/10 bg-[#160b20] p-8 shadow-[0_20px_50px_rgba(236,17,135,0.25)]">
          <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-tr from-[#EC1187] to-[#FF8D10] text-2xl text-white shadow-lg">
            👑
          </div>
          <h1 className="text-2xl font-black text-white">{APP_NAME} Founder Portal</h1>
          <p className="mt-1 text-xs text-white/60">
            Enter your secret admin passcode to view user records & live confessions.
          </p>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <input
                type="password"
                className="input text-center font-mono text-base tracking-widest"
                placeholder="Enter admin passcode"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                autoFocus
                required
              />
            </div>
            {loginErr && <div className="alert-error text-xs" role="alert">{loginErr}</div>}
            <button
              className="btn btn-primary w-full !py-3 text-sm font-black shadow-lg"
              disabled={loginBusy || !passcode.trim()}
            >
              {loginBusy ? 'Verifying…' : 'Access Portal ⚡'}
            </button>
          </form>
          <p className="mt-4 text-[11px] font-semibold text-white/30">
            Default passcode: <code className="text-pink-400">kaho-admin-2026</code>
          </p>
        </div>
      </div>
    );
  }

  // --- AUTHENTICATED FOUNDER DASHBOARD ---
  return (
    <div className="mx-auto max-w-5xl py-6 px-2 text-white space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">👑</span>
            <h1 className="text-2xl font-black text-white tracking-tight">{APP_NAME} Founder Dashboard</h1>
          </div>
          <p className="text-xs text-white/60 mt-0.5">Live platform telemetry, user database & confessions stream</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchData(search)}
            disabled={loading}
            className="btn border border-white/20 bg-white/5 text-xs font-bold hover:bg-white/10"
            title="Refresh latest data"
          >
            {loading ? 'Refreshing…' : '🔄 Refresh'}
          </button>
          <button
            onClick={exportCSV}
            className="btn border border-pink-500/40 bg-pink-500/10 text-xs font-bold text-pink-300 hover:bg-pink-500/20"
            title="Download users spreadsheet"
          >
            📥 Export CSV
          </button>
          <button
            onClick={handleLogout}
            className="btn btn-ghost text-xs text-red-400/80 hover:text-red-400"
          >
            Log out 🚪
          </button>
        </div>
      </div>

      {/* KPI Cards */}
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
            <p className="text-xs font-extrabold uppercase tracking-wider text-white/50">Avg Activity</p>
            <p className="mt-1 text-2xl font-black text-white">
              {stats.totalUsers > 0 ? (stats.totalMessages / stats.totalUsers).toFixed(1) : 0}
            </p>
            <span className="mt-1 inline-block text-[11px] font-bold text-white/50">
              msgs / user
            </span>
          </div>

          <div className="card border border-white/10 bg-[#160b20] p-4">
            <p className="text-xs font-extrabold uppercase tracking-wider text-white/50">Safety Blocks</p>
            <p className="mt-1 text-2xl font-black text-white">{stats.totalBlocked}</p>
            <span className="mt-1 inline-block text-[11px] font-bold text-orange-400">
              blocked senders
            </span>
          </div>
        </div>
      )}

      {/* Tabs & Search */}
      <div className="flex flex-wrap items-center justify-between gap-3">
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
