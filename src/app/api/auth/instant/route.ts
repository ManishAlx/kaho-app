import { randomUUID, randomBytes } from 'crypto';
import { createSession, hashPassword } from '@/lib/auth';
import { findUserByUsername, getDb } from '@/lib/db';
import { hit } from '@/lib/ratelimit';
import { clientIp, json, readJson, sameOrigin } from '@/lib/request';
import { RESERVED_USERNAMES } from '@/lib/config';

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: 'Bad origin' }, 403);
  const rl = hit(`instant:${clientIp(req)}`, 15, 60 * 60 * 1000);
  if (!rl.ok) {
    return json(
      { error: 'Too many attempts. Try again later.' },
      429,
      { 'Retry-After': String(rl.retryAfterSec) }
    );
  }

  const body = (await readJson(req)) as { username?: string };
  const rawUsername = body.username ?? '';
  const cleanUsername = rawUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');

  if (cleanUsername.length < 3 || cleanUsername.length > 20) {
    return json({ error: 'Username must be 3–20 characters (letters, numbers, underscores)' }, 400);
  }

  if (RESERVED_USERNAMES.has(cleanUsername)) {
    return json({ error: 'That username is reserved' }, 400);
  }

  const existing = findUserByUsername(cleanUsername);
  if (existing) {
    // Account exists, instruct frontend to redirect to login
    return json({ exists: true, username: cleanUsername }, 200);
  }

  // Create new instant account
  const id = randomUUID();
  const randomSecret = randomBytes(16).toString('hex');
  const passwordHash = await hashPassword(randomSecret);
  const autoEmail = `${cleanUsername}_${randomBytes(4).toString('hex')}@kaho.internal`;

  getDb()
    .prepare(
      'INSERT INTO users (id, email, password_hash, username, display_name, accepting_messages, created_at) VALUES (?,?,?,?,?,1,?)'
    )
    .run(id, autoEmail, passwordHash, cleanUsername, cleanUsername, Date.now());

  await createSession(id);

  return json({ ok: true, username: cleanUsername }, 201);
}
