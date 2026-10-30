import { createAdminSession } from '@/lib/auth';
import { json, readJson, sameOrigin } from '@/lib/request';

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: 'Bad origin' }, 403);

  const body = (await readJson(req)) as { passcode?: string };
  const adminSecret = process.env.ADMIN_SECRET || 'kaho-admin-2026';

  if (!body?.passcode || body.passcode.trim() !== adminSecret.trim()) {
    return json({ error: 'Invalid admin passcode' }, 401);
  }

  await createAdminSession();
  return json({ ok: true });
}
