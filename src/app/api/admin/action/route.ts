import { isAdminAuthenticated } from '@/lib/auth';
import { adminDeleteMessage, adminDeleteUser } from '@/lib/db';
import { json, readJson, sameOrigin } from '@/lib/request';

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: 'Bad origin' }, 403);

  const isAuth = await isAdminAuthenticated();
  if (!isAuth) return json({ error: 'Unauthorized' }, 401);

  const body = (await readJson(req)) as { action?: string; id?: string };
  if (!body?.action || !body?.id) return json({ error: 'Missing action or id' }, 400);

  if (body.action === 'delete_message') {
    adminDeleteMessage(body.id);
    return json({ ok: true, deleted: 'message' });
  }

  if (body.action === 'delete_user') {
    adminDeleteUser(body.id);
    return json({ ok: true, deleted: 'user' });
  }

  return json({ error: 'Invalid action' }, 400);
}
