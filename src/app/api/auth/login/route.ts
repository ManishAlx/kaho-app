import bcrypt from 'bcryptjs';
import { createSession, verifyPassword } from '@/lib/auth';
import { findUserRowByUsernameOrEmail } from '@/lib/db';
import { hit } from '@/lib/ratelimit';
import { clientIp, json, readJson, sameOrigin } from '@/lib/request';
import { loginSchema } from '@/lib/validation';

// Constant-ish time check even when the user is unknown (avoids user enumeration by timing).
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 12);

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: 'Bad origin' }, 403);
  const rl = hit(`login:${clientIp(req)}`, 10, 15 * 60 * 1000);
  if (!rl.ok) return json({ error: 'Too many attempts. Try again later.' }, 429, { 'Retry-After': String(rl.retryAfterSec) });

  const parsed = loginSchema.safeParse(await readJson(req));
  if (!parsed.success) return json({ error: 'Invalid username, email, or password' }, 400);

  const identifier = parsed.data.identifier || parsed.data.email || '';
  const row = findUserRowByUsernameOrEmail(identifier);
  const ok = await verifyPassword(parsed.data.password, row?.password_hash ?? DUMMY_HASH);
  if (!row || !ok) return json({ error: 'Invalid username/email or password' }, 401);

  await createSession(row.id);
  return json({ ok: true, username: row.username });
}
