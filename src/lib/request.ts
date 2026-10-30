import { createHash } from 'crypto';
import { NextResponse } from 'next/server';

export function json(data: unknown, status = 200, headers?: Record<string, string>) {
  return NextResponse.json(data, { status, headers });
}

export function clientIp(req: Request): string {
  const cf = req.headers.get('cf-connecting-ip');
  if (cf) return cf.trim();
  const xf = req.headers.get('x-forwarded-for');
  return (xf?.split(',')[0] ?? req.headers.get('x-real-ip') ?? 'local').trim();
}

/** One-way, salted, daily-rotating hash of IP + user agent. Used ONLY for rate limiting. */
export function senderHash(req: Request): string {
  const day = new Date().toISOString().slice(0, 10);
  const salt = process.env.AUTH_SECRET ?? 'dev-salt';
  return createHash('sha256')
    .update(`${salt}|${day}|${clientIp(req)}|${req.headers.get('user-agent') ?? ''}`)
    .digest('hex');
}

/** Basic CSRF defence: if an Origin header is present it must match the Host. */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return true;
  try {
    return new URL(origin).host === req.headers.get('host');
  } catch {
    return false;
  }
}

export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}
