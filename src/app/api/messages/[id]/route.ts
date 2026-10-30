import { getSessionUser } from '@/lib/auth';
import { getDb, type MessageRow, toMessage } from '@/lib/db';
import { json, readJson, sameOrigin } from '@/lib/request';
import { firstError, patchMessageSchema } from '@/lib/validation';

type Ctx = { params: { id: string } };

function ownedMessage(id: string, userId: string): MessageRow | undefined {
  // Authorization: the message must belong to the logged-in user AND be visible.
  return getDb()
    .prepare("SELECT * FROM messages WHERE id = ? AND recipient_id = ? AND status = 'VISIBLE'")
    .get(id, userId) as MessageRow | undefined;
}

export async function PATCH(req: Request, { params }: Ctx) {
  if (!sameOrigin(req)) return json({ error: 'Bad origin' }, 403);
  const user = await getSessionUser();
  if (!user) return json({ error: 'Not logged in' }, 401);

  const parsed = patchMessageSchema.safeParse(await readJson(req));
  if (!parsed.success) return json({ error: firstError(parsed.error) }, 400);

  if (!ownedMessage(params.id, user.id)) return json({ error: 'Not found' }, 404);

  const db = getDb();
  if (parsed.data.isRead !== undefined) db.prepare('UPDATE messages SET is_read = ? WHERE id = ?').run(parsed.data.isRead ? 1 : 0, params.id);
  if (parsed.data.reply !== undefined) {
    db.prepare('UPDATE messages SET reply = ?, replied_at = ?, is_read = 1 WHERE id = ?').run(parsed.data.reply, Date.now(), params.id);
  }
  const row = db.prepare('SELECT * FROM messages WHERE id = ?').get(params.id) as MessageRow;
  return json({ message: toMessage(row) });
}

export async function DELETE(req: Request, { params }: Ctx) {
  if (!sameOrigin(req)) return json({ error: 'Bad origin' }, 403);
  const user = await getSessionUser();
  if (!user) return json({ error: 'Not logged in' }, 401);
  if (!ownedMessage(params.id, user.id)) return json({ error: 'Not found' }, 404);
  getDb().prepare('DELETE FROM messages WHERE id = ?').run(params.id);
  return json({ ok: true });
}
