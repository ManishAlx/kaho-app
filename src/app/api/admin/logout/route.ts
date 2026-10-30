import { destroyAdminSession } from '@/lib/auth';
import { json, sameOrigin } from '@/lib/request';

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: 'Bad origin' }, 403);
  destroyAdminSession();
  return json({ ok: true });
}
