import { getSessionUser } from '@/lib/auth';
import { getDb, type MessageRow, toMessage } from '@/lib/db';
import { json } from '@/lib/request';

const PAGE = 20;

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return json({ error: 'Not logged in' }, 401);

  const sp = new URL(req.url).searchParams;
  const filter = sp.get('filter') ?? 'all'; // all | unanswered | answered
  const cursor = sp.get('cursor'); // "<createdAt>:<id>"

  const where = ["recipient_id = ?", "status = 'VISIBLE'"];
  const args: (string | number)[] = [user.id];
  if (filter === 'unanswered') where.push('reply IS NULL');
  if (filter === 'answered') where.push('reply IS NOT NULL');
  if (cursor) {
    const [ts, id] = cursor.split(':');
    const t = Number(ts);
    if (!Number.isFinite(t) || !id) return json({ error: 'Bad cursor' }, 400);
    where.push('(created_at < ? OR (created_at = ? AND id < ?))');
    args.push(t, t, id);
  }

  const db = getDb();
  const rows = db
    .prepare(`SELECT * FROM messages WHERE ${where.join(' AND ')} ORDER BY created_at DESC, id DESC LIMIT ?`)
    .all(...args, PAGE + 1) as MessageRow[];
  const hasMore = rows.length > PAGE;
  const page = rows.slice(0, PAGE);
  const last = page[page.length - 1];

  const unread = db
    .prepare("SELECT COUNT(*) AS n FROM messages WHERE recipient_id = ? AND status = 'VISIBLE' AND is_read = 0")
    .get(user.id) as { n: number };

  return json({
    messages: page.map(toMessage),
    nextCursor: hasMore && last ? `${last.created_at}:${last.id}` : null,
    unreadCount: unread.n,
  });
}
