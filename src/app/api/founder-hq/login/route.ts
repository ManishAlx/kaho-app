import { createAdminSession } from '@/lib/auth';
import { hit } from '@/lib/ratelimit';
import { clientIp, json, readJson, sameOrigin } from '@/lib/request';

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: 'Bad origin' }, 403);

  // Rate limit: 5 attempts per 15 minutes per IP
  const rl = hit(`founder-login:${clientIp(req)}`, 5, 15 * 60 * 1000);
  if (!rl.ok) {
    return json(
      { error: 'Too many failed login attempts. Locked for 15 minutes.' },
      429,
      { 'Retry-After': String(rl.retryAfterSec) }
    );
  }

  const body = (await readJson(req)) as { username?: string; password?: string };
  const expectedUser = (process.env.ADMIN_USERNAME || 'kaho_founder').trim();
  const expectedPass = (process.env.ADMIN_PASSWORD || 'KahoFounder@2026!HQ').trim();

  const inputUser = (body?.username || '').trim();
  const inputPass = (body?.password || '').trim();

  if (!inputUser || !inputPass || inputUser !== expectedUser || inputPass !== expectedPass) {
    return json({ error: 'Invalid Founder Credentials' }, 401);
  }

  await createAdminSession();
  return json({ ok: true, username: inputUser });
}
