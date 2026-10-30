import { findUserByUsername } from '@/lib/db';
import { hit } from '@/lib/ratelimit';
import { clientIp, json } from '@/lib/request';
import { usernameSchema } from '@/lib/validation';

export async function GET(req: Request) {
  const rl = hit(`uname:${clientIp(req)}`, 60, 60 * 1000);
  if (!rl.ok) return json({ error: 'Slow down' }, 429);
  const u = new URL(req.url).searchParams.get('u') ?? '';
  const parsed = usernameSchema.safeParse(u);
  if (!parsed.success) return json({ available: false, error: parsed.error.issues[0]?.message });
  return json({ available: !findUserByUsername(parsed.data) });
}
