# Hushbox: anonymous Q&A MVP

Share a link (`/u/yourname`), friends send anonymous messages, you read and reply in a private inbox.
Original branding: change the name in `src/lib/config.ts`.

## Run it (Node 20+)
```bash
npm install
cp .env.example .env.local     # set AUTH_SECRET (openssl rand -base64 32)
npm run seed                   # optional demo data: demo@example.com / demo12345
npm run dev                    # http://localhost:3000   (public page: /u/demo)
```
Production: `npm run build && npm start` (AUTH_SECRET is mandatory).

## What is in it
- Next.js 14 (App Router) + TypeScript + Tailwind, mobile-first, dark mode
- SQLite via better-sqlite3 (file in `./data`), zero setup
- Email + password auth (bcrypt, signed httpOnly session cookie)
- Public send form, inbox (pagination, filters, unread, reply, delete), settings (pause messages, delete account)
- Safety: moderation before inbox (rules + optional OpenAI Moderation API), rate limits, Origin check, security headers, no sender reveal

## Endpoints
`POST /api/messages` (public) · `GET /api/inbox` · `PATCH|DELETE /api/messages/:id` · `GET /api/username-available` ·
`GET|PATCH|DELETE /api/me` · `POST /api/auth/{signup,login,logout}`

## Before going live
1. Rate limiter is in-memory: swap `src/lib/ratelimit.ts` for Upstash Redis if you run more than one instance.
2. SQLite is single-server: move `src/lib/db.ts` to Postgres (Neon/Supabase) for serverless hosting.
3. Add a CAPTCHA (Cloudflare Turnstile) on the public send form.
4. Add report/block-sender, admin panel, magic-link email (Resend), push notifications.
5. Have terms/privacy reviewed by a lawyer; they are placeholders.
