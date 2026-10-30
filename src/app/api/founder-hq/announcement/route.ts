import { isAdminAuthenticated } from '@/lib/auth';
import { getGlobalAnnouncement, setGlobalAnnouncement } from '@/lib/db';
import { json, readJson, sameOrigin } from '@/lib/request';

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: 'Bad origin' }, 403);

  const isAuth = await isAdminAuthenticated();
  if (!isAuth) return json({ error: 'Unauthorized' }, 401);

  const body = (await readJson(req)) as { message?: string; active?: boolean };
  const message = body?.message ?? '';
  const active = Boolean(body?.active);

  setGlobalAnnouncement(message, active);
  return json({ ok: true, announcement: getGlobalAnnouncement() });
}
