import { getSessionUser } from '@/lib/auth';
import { blockSender, getDb, type MessageRow } from '@/lib/db';
import { json, sameOrigin } from '@/lib/request';

type Ctx = { params: { id: string } };

export async function POST(req: Request, { params }: Ctx) {
  if (!sameOrigin(req)) return json({ error: 'Bad origin' }, 403);

  const user = await getSessionUser();
  if (!user) return json({ error: 'Not logged in' }, 401);

  const db = getDb();
  const msg = db
    .prepare('SELECT * FROM messages WHERE id = ? AND recipient_id = ?')
    .get(params.id, user.id) as MessageRow | undefined;

  if (!msg) return json({ error: 'Message not found' }, 404);

  // Block this anonymous sender hash permanently for this recipient
  blockSender(user.id, msg.sender_hash);

  // Automatically delete all messages received from this abusive/unwanted sender
  db.prepare('DELETE FROM messages WHERE recipient_id = ? AND sender_hash = ?').run(
    user.id,
    msg.sender_hash
  );

  return json({ ok: true, blocked: true });
}
