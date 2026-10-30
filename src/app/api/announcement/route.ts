import { getGlobalAnnouncement } from '@/lib/db';
import { json } from '@/lib/request';

export const dynamic = 'force-dynamic';

export async function GET() {
  const ann = getGlobalAnnouncement();
  if (!ann || !ann.active) {
    return json({ announcement: null });
  }
  return json({ announcement: ann });
}
