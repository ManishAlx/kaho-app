import { destroySession, getSessionUser, verifyPassword } from '@/lib/auth';
import { findUserRowById, getDb, toUser } from '@/lib/db';
import { json, readJson, sameOrigin } from '@/lib/request';
import { deleteMeSchema, firstError, patchMeSchema } from '@/lib/validation';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return json({ error: 'Not logged in' }, 401);
  return json({ user });
}

export async function PATCH(req: Request) {
  if (!sameOrigin(req)) return json({ error: 'Bad origin' }, 403);
  const user = await getSessionUser();
  if (!user) return json({ error: 'Not logged in' }, 401);
  const parsed = patchMeSchema.safeParse(await readJson(req));
  if (!parsed.success) return json({ error: firstError(parsed.error) }, 400);

  const db = getDb();
  if (parsed.data.displayName !== undefined) db.prepare('UPDATE users SET display_name = ? WHERE id = ?').run(parsed.data.displayName, user.id);
  if (parsed.data.acceptingMessages !== undefined) {
    db.prepare('UPDATE users SET accepting_messages = ? WHERE id = ?').run(parsed.data.acceptingMessages ? 1 : 0, user.id);
  }
  if (parsed.data.blockedWords !== undefined) {
    db.prepare('UPDATE users SET blocked_words = ? WHERE id = ?').run(parsed.data.blockedWords, user.id);
  }
  return json({ user: toUser(findUserRowById(user.id)!) });
}

/** Hard delete: removes the user and (via ON DELETE CASCADE) every message. */
export async function DELETE(req: Request) {
  if (!sameOrigin(req)) return json({ error: 'Bad origin' }, 403);
  const user = await getSessionUser();
  if (!user) return json({ error: 'Not logged in' }, 401);

  const row = findUserRowById(user.id);
  if (!row) return json({ error: 'User not found' }, 404);

  const isInstant = row.email.endsWith('@kaho.internal');
  if (!isInstant) {
    const parsed = deleteMeSchema.safeParse(await readJson(req));
    if (!parsed.success) return json({ error: 'Password required' }, 400);
    if (!(await verifyPassword(parsed.data.password, row.password_hash))) {
      return json({ error: 'Wrong password' }, 403);
    }
  }

  getDb().prepare('DELETE FROM users WHERE id = ?').run(user.id);
  destroySession();
  return json({ ok: true });
}
