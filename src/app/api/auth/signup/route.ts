import { randomUUID } from 'crypto';
import { createSession, hashPassword } from '@/lib/auth';
import { findUserByUsername, findUserRowByEmail, getDb } from '@/lib/db';
import { hit } from '@/lib/ratelimit';
import { clientIp, json, readJson, sameOrigin } from '@/lib/request';
import { firstError, signupSchema } from '@/lib/validation';

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: 'Bad origin' }, 403);
  const rl = hit(`signup:${clientIp(req)}`, 10, 60 * 60 * 1000);
  if (!rl.ok) return json({ error: 'Too many attempts. Try again later.' }, 429, { 'Retry-After': String(rl.retryAfterSec) });

  const parsed = signupSchema.safeParse(await readJson(req));
  if (!parsed.success) return json({ error: firstError(parsed.error) }, 400);
  const { email, password, username } = parsed.data;

  if (findUserByUsername(username)) return json({ error: 'That username is taken' }, 409);
  if (findUserRowByEmail(email)) return json({ error: 'An account with this email already exists' }, 409);

  const id = randomUUID();
  const passwordHash = await hashPassword(password);
  getDb()
    .prepare('INSERT INTO users (id, email, password_hash, username, display_name, accepting_messages, created_at) VALUES (?,?,?,?,?,1,?)')
    .run(id, email, passwordHash, username, username, Date.now());
  await createSession(id);
  return json({ ok: true, username }, 201);
}
