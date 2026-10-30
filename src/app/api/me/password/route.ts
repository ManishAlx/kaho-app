import { z } from 'zod';
import { getSessionUser, hashPassword, verifyPassword } from '@/lib/auth';
import { findUserRowById, findUserRowByEmail, getDb } from '@/lib/db';
import { json, readJson, sameOrigin } from '@/lib/request';

const passwordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, 'Password must be at least 8 characters').max(100),
  newEmail: z.string().trim().email('Invalid email address').max(254).optional(),
});

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: 'Bad origin' }, 403);

  const session = await getSessionUser();
  if (!session) return json({ error: 'Not logged in' }, 401);

  const row = findUserRowById(session.id);
  if (!row) return json({ error: 'User not found' }, 404);

  const parsed = passwordSchema.safeParse(await readJson(req));
  if (!parsed.success) {
    return json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, 400);
  }

  const { currentPassword, newPassword, newEmail } = parsed.data;
  const isInstant = row.email.endsWith('@kaho.internal');

  // For regular accounts, require and verify the current password
  if (!isInstant) {
    if (!currentPassword) {
      return json({ error: 'Current password is required' }, 400);
    }
    const ok = await verifyPassword(currentPassword, row.password_hash);
    if (!ok) {
      return json({ error: 'Incorrect current password' }, 403);
    }
  }

  const newHash = await hashPassword(newPassword);
  const db = getDb();

  // If user provided a new email, ensure it's not taken by another user
  if (newEmail && newEmail.toLowerCase() !== row.email.toLowerCase()) {
    const existing = findUserRowByEmail(newEmail);
    if (existing && existing.id !== row.id) {
      return json({ error: 'That email is already registered to another account' }, 409);
    }
    db.prepare('UPDATE users SET password_hash = ?, email = ? WHERE id = ?').run(newHash, newEmail, row.id);
  } else {
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, row.id);
  }

  return json({
    ok: true,
    message: isInstant
      ? 'Password created successfully! You can now log in anywhere.'
      : 'Password changed successfully!',
    email: newEmail || row.email,
  });
}
