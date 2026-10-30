import { randomUUID } from 'crypto';
import { findUserByUsername, getDb, isSenderBlocked } from '@/lib/db';
import { parseSenderHints } from '@/lib/hints';
import { BLOCK_MESSAGES, moderate } from '@/lib/moderation';
import { hit } from '@/lib/ratelimit';
import { json, readJson, sameOrigin, senderHash } from '@/lib/request';
import { firstError, sendMessageSchema } from '@/lib/validation';

/** PUBLIC endpoint: anyone can send an anonymous message to a username. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: 'Bad origin' }, 403);

  const parsed = sendMessageSchema.safeParse(await readJson(req));
  if (!parsed.success) return json({ error: firstError(parsed.error) }, 400);
  const { username, body, gameMode } = parsed.data;

  const recipient = findUserByUsername(username);
  if (!recipient) return json({ error: 'User not found' }, 404);
  if (!recipient.acceptingMessages) return json({ error: 'This user is not accepting messages right now' }, 403);

  // Check if this sender was blocked by the recipient
  const sh = senderHash(req);
  if (isSenderBlocked(recipient.id, sh)) {
    return json({ error: 'You cannot send messages to this user.', blocked: true }, 403);
  }

  // Rate limits: 10 per sender per recipient per hour, 50 per sender per hour overall.
  const perRecipient = hit(`msg:${sh}:${recipient.id}`, 10, 60 * 60 * 1000);
  const overall = perRecipient.ok ? hit(`msg-all:${sh}`, 50, 60 * 60 * 1000) : perRecipient;
  if (!perRecipient.ok || !overall.ok) {
    const retry = !perRecipient.ok ? perRecipient.retryAfterSec : overall.retryAfterSec;
    return json({ error: 'You are sending too many messages. Please try again later.' }, 429, { 'Retry-After': String(retry) });
  }

  // Parse anonymous non-identifying hints (device, city, network)
  const hints = parseSenderHints(req);

  // Check recipient's custom blocked words
  if (recipient.blockedWords) {
    const customList = recipient.blockedWords
      .split(',')
      .map((w) => w.trim().toLowerCase())
      .filter(Boolean);
    const bodyLower = body.toLowerCase();
    const hitCustom = customList.find((w) => bodyLower.includes(w));
    if (hitCustom) {
      return json(
        {
          error: 'Your message was blocked because it contains a word restricted by this user.',
          blocked: true,
          reason: 'custom_block',
        },
        422
      );
    }
  }

  // Moderation happens BEFORE the message can reach the inbox.
  const mod = await moderate(body);
  const status = mod.allowed ? 'VISIBLE' : 'HIDDEN_BY_MODERATION';
  getDb()
    .prepare(
      `INSERT INTO messages 
       (id, recipient_id, body, game_mode, hint_device, hint_location, hint_network, status, is_read, sender_hash, created_at) 
       VALUES (?,?,?,?,?,?,?,?,0,?,?)`
    )
    .run(
      randomUUID(),
      recipient.id,
      body,
      gameMode || 'ama',
      hints.device,
      hints.location,
      hints.network,
      status,
      sh,
      Date.now()
    );

  if (!mod.allowed) {
    return json({ error: BLOCK_MESSAGES[mod.reason ?? 'other'], blocked: true, reason: mod.reason }, 422);
  }
  return json({ ok: true }, 201);
}
