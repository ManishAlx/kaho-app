'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Props = {
  username: string;
  email: string;
  displayName: string;
  acceptingMessages: boolean;
  blockedWords: string;
};

export default function SettingsClient(props: Props) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(props.displayName);
  const [accepting, setAccepting] = useState(props.acceptingMessages);
  const [blockedWords, setBlockedWords] = useState(props.blockedWords);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [password, setPassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [delErr, setDelErr] = useState('');

  // Password management states
  const isInstant = props.email.endsWith('@kaho.internal');
  const [customEmail, setCustomEmail] = useState(isInstant ? '' : props.email);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function updatePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPw.length < 8) {
      setPwMsg({ ok: false, text: 'Password must be at least 8 characters' });
      return;
    }
    if (newPw !== confirmPw) {
      setPwMsg({ ok: false, text: 'New passwords do not match' });
      return;
    }
    setPwSaving(true);
    setPwMsg(null);
    try {
      const res = await fetch('/api/me/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: isInstant ? undefined : currentPw,
          newPassword: newPw,
          newEmail: isInstant && customEmail.trim() ? customEmail.trim() : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to update password');
      setPwMsg({ ok: true, text: data.message ?? 'Password updated successfully!' });
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
      router.refresh();
    } catch (err) {
      setPwMsg({ ok: false, text: err instanceof Error ? err.message : 'Failed to update password' });
    } finally {
      setPwSaving(false);
    }
  }

  async function save(body: object) {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch('/api/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Could not save');
      setMsg({ ok: true, text: 'Settings saved successfully ✓' });
      router.refresh();
      return true;
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'Could not save' });
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function deleteAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!confirm('Delete your account and ALL messages forever?')) return;
    setDeleting(true);
    setDelErr('');
    const res = await fetch('/api/me', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setDelErr(data.error ?? 'Could not delete account');
      setDeleting(false);
      return;
    }
    router.push('/');
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 py-6 text-white">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-white">Settings ⚙️</h1>
        <span className="text-xs font-bold text-white/50">@{props.username}</span>
      </div>

      {msg && (
        <div
          className={`rounded-2xl p-3 text-xs font-bold ${
            msg.ok ? 'bg-emerald-950/80 border border-emerald-400 text-emerald-200' : 'alert-error'
          }`}
          role="status"
        >
          {msg.text}
        </div>
      )}

      {/* Profile Info Card */}
      <div className="card space-y-4 border border-white/10 bg-[#160b20]">
        <div>
          <p className="label text-xs uppercase text-white/50 font-bold">Account</p>
          <p className="font-extrabold text-white text-base">@{props.username}</p>
          <p className="text-xs text-white/40">{props.email}</p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            save({ displayName });
          }}
          className="space-y-3"
        >
          <div>
            <label className="label text-xs font-bold text-white/80" htmlFor="dn">
              Display name
            </label>
            <input
              id="dn"
              className="input font-semibold"
              value={displayName}
              maxLength={40}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <button
            className="btn btn-primary text-xs font-black"
            disabled={saving || !displayName.trim() || displayName.trim() === props.displayName}
          >
            Save name
          </button>
        </form>
      </div>

      {/* Custom Blocked Words Card */}
      <div className="card space-y-4 border border-pink-500/20 bg-[#190c26]">
        <div>
          <h2 className="text-base font-black text-white flex items-center gap-1.5">
            <span>🛑</span> Custom Blocked Words & Topics
          </h2>
          <p className="text-xs text-white/60 mt-1">
            Block confessions that contain specific names or words you don&apos;t want to see. Separate multiple words with a comma.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            save({ blockedWords });
          }}
          className="space-y-3"
        >
          <div>
            <textarea
              id="blocked"
              className="input min-h-[80px] text-xs font-medium resize-none placeholder:text-white/30"
              placeholder="e.g. ex_name, fight, party, drama"
              value={blockedWords}
              maxLength={500}
              onChange={(e) => setBlockedWords(e.target.value)}
            />
            <span className="text-[10px] text-white/40 block mt-1">
              If an anonymous sender types any of these words, their message is blocked automatically.
            </span>
          </div>
          <button
            className="btn border border-pink-500/40 bg-pink-500/20 text-pink-300 hover:bg-pink-500/30 text-xs font-black"
            disabled={saving || blockedWords === props.blockedWords}
          >
            Save blocked words
          </button>
        </form>
      </div>

      {/* Pause Link Card */}
      <div className="card flex items-center justify-between gap-4 border border-white/10 bg-[#160b20]">
        <div>
          <p className="font-black text-white">Accept new messages</p>
          <p className="text-xs text-white/60 mt-0.5">
            Turn off to pause your link. Visitors will see you are not accepting messages right now.
          </p>
        </div>
        <button
          role="switch"
          aria-checked={accepting}
          aria-label="Accept new messages"
          disabled={saving}
          onClick={async () => {
            const next = !accepting;
            setAccepting(next);
            if (!(await save({ acceptingMessages: next }))) setAccepting(!next);
          }}
          className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${
            accepting ? 'bg-gradient-to-r from-pink-500 to-orange-500' : 'bg-gray-600'
          }`}
        >
          <span
            className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${
              accepting ? 'left-7' : 'left-1'
            }`}
          />
        </button>
      </div>

      {/* Password & Security Card */}
      <div className="card space-y-4 border border-white/10 bg-[#160b20]">
        <div>
          <h2 className="text-base font-black text-white flex items-center gap-1.5">
            <span>🔑</span> {isInstant ? 'Set Account Password' : 'Change Password'}
          </h2>
          <p className="text-xs text-white/60 mt-1">
            {isInstant
              ? 'You claimed your username instantly! Set a password to log in on other devices or recover your account.'
              : 'Keep your account secure with a strong password (minimum 8 characters).'}
          </p>
        </div>

        {pwMsg && (
          <div
            className={`rounded-2xl p-3 text-xs font-bold ${
              pwMsg.ok ? 'bg-emerald-950/80 border border-emerald-400 text-emerald-200' : 'alert-error'
            }`}
            role="status"
          >
            {pwMsg.text}
          </div>
        )}

        <form onSubmit={updatePassword} className="space-y-3">
          {isInstant && (
            <div>
              <label className="label text-xs font-bold text-white/80" htmlFor="custEmail">
                Link an Email (Optional)
              </label>
              <input
                id="custEmail"
                type="email"
                className="input text-xs font-semibold"
                placeholder="you@example.com"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
              />
            </div>
          )}

          {!isInstant && (
            <div>
              <label className="label text-xs font-bold text-white/80" htmlFor="curPw">
                Current Password
              </label>
              <input
                id="curPw"
                type="password"
                className="input text-xs"
                placeholder="Enter current password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label text-xs font-bold text-white/80" htmlFor="newPw">
                New Password
              </label>
              <input
                id="newPw"
                type="password"
                className="input text-xs"
                placeholder="At least 8 characters"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                autoComplete="new-password"
                required
                minLength={8}
              />
            </div>

            <div>
              <label className="label text-xs font-bold text-white/80" htmlFor="confPw">
                Confirm Password
              </label>
              <input
                id="confPw"
                type="password"
                className="input text-xs"
                placeholder="Repeat new password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                autoComplete="new-password"
                required
                minLength={8}
              />
            </div>
          </div>

          <button
            className="btn btn-primary text-xs font-black !py-2.5 !px-5"
            disabled={pwSaving || !newPw || !confirmPw}
          >
            {pwSaving ? 'Saving…' : isInstant ? 'Create Password 🔐' : 'Update Password 🔐'}
          </button>
        </form>
      </div>

      {/* Delete Account Card */}
      <form onSubmit={deleteAccount} className="card space-y-3 border border-red-500/30 bg-red-950/20">
        <h2 className="font-black text-red-400">Delete account</h2>
        <p className="text-xs text-white/60">
          This permanently deletes your account and every anonymous message. It cannot be undone.
        </p>
        {!isInstant && (
          <div>
            <label className="label text-xs font-bold text-white/80" htmlFor="pw">
              Confirm with your password
            </label>
            <input
              id="pw"
              type="password"
              className="input text-xs"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
        )}
        {delErr && <div className="alert-error text-xs" role="alert">{delErr}</div>}
        <button className="btn btn-danger text-xs font-black" disabled={deleting || (!isInstant && !password)}>
          {deleting ? 'Deleting…' : 'Delete my account'}
        </button>
      </form>
    </div>
  );
}
