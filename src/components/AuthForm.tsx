'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type Mode = 'login' | 'signup';

export default function AuthForm({
  initialMode,
  initialUsername = '',
}: {
  initialMode: Mode;
  initialUsername?: string;
}) {
  const router = useRouter();

  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState(initialUsername);
  const [age, setAge] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [uname, setUname] = useState<{ state: 'idle' | 'checking' | 'ok' | 'bad'; msg?: string }>({ state: 'idle' });

  // Live username availability (debounced)
  useEffect(() => {
    if (mode !== 'signup' || !username) return setUname({ state: 'idle' });
    setUname({ state: 'checking' });
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/username-available?u=${encodeURIComponent(username)}`);
        const d = await r.json();
        setUname(d.available ? { state: 'ok', msg: 'Available ✓' } : { state: 'bad', msg: d.error ?? 'Already taken' });
      } catch {
        setUname({ state: 'idle' });
      }
    }, 400);
    return () => clearTimeout(t);
  }, [username, mode]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await fetch(mode === 'signup' ? '/api/auth/signup' : '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          mode === 'signup'
            ? { email, password, username, ageConfirmed: age }
            : { identifier: email, email, password }
        ),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? 'Something went wrong');
      router.push('/inbox');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md py-8 px-2">
      <div className="card">
        <div className="mb-5 grid grid-cols-2 rounded-full p-1 bg-white/5 border border-white/10" role="tablist">
          {(['login', 'signup'] as const).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={mode === m}
              onClick={() => { setMode(m); setError(''); }}
              className={`rounded-full py-2 text-sm font-bold transition ${mode === m ? 'text-white shadow' : 'text-white/60 hover:text-white'}`}
              style={mode === m ? { background: 'linear-gradient(135deg, #ff1493 0%, #ff4500 50%, #ff8c00 100%)' } : undefined}
              type="button"
            >
              {m === 'login' ? 'Log in' : 'Sign up'}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-4" noValidate>
          {mode === 'signup' && (
            <div>
              <label className="label" htmlFor="username">Choose your KAHO username</label>
              <div className="relative">
                <span className="muted pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-bold">@</span>
                <input
                  id="username"
                  className="input !pl-9 font-bold"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  placeholder="yourname"
                  autoComplete="username"
                  maxLength={20}
                />
              </div>
              <p className={`mt-1 text-xs font-semibold ${uname.state === 'ok' ? 'text-emerald-400' : uname.state === 'bad' ? 'text-red-400' : 'text-white/50'}`} aria-live="polite">
                {uname.state === 'checking' ? 'Checking availability…' : uname.msg ?? '3-20 letters, numbers, or underscore'}
              </p>
            </div>
          )}
          <div>
            <label className="label" htmlFor="email">
              {mode === 'login' ? 'Username or Email' : 'Email address'}
            </label>
            <input
              id="email"
              type={mode === 'login' ? 'text' : 'email'}
              className="input font-semibold"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={mode === 'login' ? 'yourname or you@example.com' : 'you@example.com'}
              autoComplete={mode === 'login' ? 'username' : 'email'}
            />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input id="password" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} />
          </div>
          {mode === 'signup' && (
            <label className="flex items-start gap-2.5 text-xs text-white/70">
              <input type="checkbox" className="mt-0.5 h-4 w-4 accent-pink-500 rounded" checked={age} onChange={(e) => setAge(e.target.checked)} />
              <span>I confirm I am 13 or older and agree to the <a className="underline text-pink-400" href="/terms" target="_blank">Terms</a> and <a className="underline text-pink-400" href="/privacy" target="_blank">Privacy Policy</a>.</span>
            </label>
          )}
          {error && <div className="alert-error" role="alert">{error}</div>}
          <button className="btn btn-primary w-full !py-3.5 !text-base font-black" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'signup' ? 'Create my link 🚀' : 'Log in'}
          </button>
        </form>
      </div>
      <p className="muted mt-4 text-center text-xs font-semibold">Demo credentials: demo@example.com / demo12345</p>
    </div>
  );
}
