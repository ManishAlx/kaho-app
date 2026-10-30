import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const g = globalThis as unknown as { __hushDb?: Database.Database };

function open(): Database.Database {
  const file = process.env.DATABASE_FILE || path.join(process.cwd(), 'data', 'app.db');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new Database(file);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      username TEXT NOT NULL UNIQUE COLLATE NOCASE,
      display_name TEXT NOT NULL,
      accepting_messages INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      recipient_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      body TEXT NOT NULL,
      game_mode TEXT NOT NULL DEFAULT 'ama',
      hint_device TEXT,
      hint_location TEXT,
      hint_network TEXT,
      status TEXT NOT NULL DEFAULT 'VISIBLE',
      is_read INTEGER NOT NULL DEFAULT 0,
      reply TEXT,
      replied_at INTEGER,
      sender_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_messages_recipient_created ON messages(recipient_id, created_at);

    CREATE TABLE IF NOT EXISTS blocked_senders (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      sender_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      PRIMARY KEY (user_id, sender_hash)
    );
    CREATE INDEX IF NOT EXISTS idx_blocked_senders ON blocked_senders(user_id, sender_hash);

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  // Safe schema migrations for existing databases
  const columnsToAdd = [
    "ALTER TABLE messages ADD COLUMN game_mode TEXT NOT NULL DEFAULT 'ama'",
    'ALTER TABLE messages ADD COLUMN hint_device TEXT',
    'ALTER TABLE messages ADD COLUMN hint_location TEXT',
    'ALTER TABLE messages ADD COLUMN hint_network TEXT',
    'ALTER TABLE users ADD COLUMN blocked_words TEXT',
    'CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at INTEGER NOT NULL)',
  ];
  for (const sql of columnsToAdd) {
    try {
      db.exec(sql);
    } catch {
      // Column already exists, safe to ignore
    }
  }

  return db;
}

export function getDb(): Database.Database {
  if (!g.__hushDb) g.__hushDb = open();
  return g.__hushDb;
}

export type User = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  acceptingMessages: boolean;
  blockedWords: string | null;
  createdAt: number;
};

type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  username: string;
  display_name: string;
  accepting_messages: number;
  blocked_words?: string | null;
  created_at: number;
};

export function toUser(r: UserRow): User {
  return {
    id: r.id,
    email: r.email,
    username: r.username,
    displayName: r.display_name,
    acceptingMessages: r.accepting_messages === 1,
    blockedWords: r.blocked_words ?? null,
    createdAt: r.created_at,
  };
}

export function findUserByUsername(username: string): User | null {
  const r = getDb().prepare('SELECT * FROM users WHERE username = ?').get(username) as UserRow | undefined;
  return r ? toUser(r) : null;
}

export function findUserRowByEmail(email: string): UserRow | null {
  return (getDb().prepare('SELECT * FROM users WHERE email = ?').get(email) as UserRow | undefined) ?? null;
}

export function findUserRowByUsernameOrEmail(identifier: string): UserRow | null {
  const clean = identifier.trim().replace(/^@/, '');
  const isEmail = identifier.includes('@') && !identifier.startsWith('@');
  if (isEmail) {
    const row = getDb().prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE').get(identifier.trim()) as UserRow | undefined;
    if (row) return row;
  }
  return (getDb().prepare('SELECT * FROM users WHERE username = ? COLLATE NOCASE OR email = ? COLLATE NOCASE').get(clean, identifier.trim()) as UserRow | undefined) ?? null;
}

export function isSenderBlocked(userId: string, senderHash: string): boolean {
  try {
    const row = getDb().prepare('SELECT 1 FROM blocked_senders WHERE user_id = ? AND sender_hash = ?').get(userId, senderHash);
    return !!row;
  } catch {
    return false;
  }
}

export function blockSender(userId: string, senderHash: string): void {
  try {
    getDb().prepare('INSERT OR IGNORE INTO blocked_senders (user_id, sender_hash, created_at) VALUES (?, ?, ?)').run(userId, senderHash, Date.now());
  } catch {
    // safe fallback
  }
}

export function findUserRowById(id: string): UserRow | null {
  return (getDb().prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined) ?? null;
}

export type Message = {
  id: string;
  body: string;
  gameMode: string;
  hintDevice: string | null;
  hintLocation: string | null;
  hintNetwork: string | null;
  isRead: boolean;
  reply: string | null;
  repliedAt: number | null;
  createdAt: number;
};

export type MessageRow = {
  id: string;
  recipient_id: string;
  body: string;
  game_mode?: string;
  hint_device?: string | null;
  hint_location?: string | null;
  hint_network?: string | null;
  status: string;
  is_read: number;
  reply: string | null;
  replied_at: number | null;
  sender_hash: string;
  created_at: number;
};

// NOTE: sender_hash is intentionally never part of the public Message type.
export function toMessage(r: MessageRow): Message {
  return {
    id: r.id,
    body: r.body,
    gameMode: r.game_mode || 'ama',
    hintDevice: r.hint_device ?? null,
    hintLocation: r.hint_location ?? null,
    hintNetwork: r.hint_network ?? null,
    isRead: r.is_read === 1,
    reply: r.reply,
    repliedAt: r.replied_at,
    createdAt: r.created_at,
  };
}

export type AdminStats = {
  totalUsers: number;
  totalMessages: number;
  usersToday: number;
  messagesToday: number;
  totalBlocked: number;
};

export function getAdminStats(): AdminStats {
  const db = getDb();
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;

  const totalUsers = (db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }).count;
  const totalMessages = (db.prepare('SELECT COUNT(*) as count FROM messages').get() as { count: number }).count;
  const usersToday = (db.prepare('SELECT COUNT(*) as count FROM users WHERE created_at >= ?').get(dayAgo) as { count: number }).count;
  const messagesToday = (db.prepare('SELECT COUNT(*) as count FROM messages WHERE created_at >= ?').get(dayAgo) as { count: number }).count;

  let totalBlocked = 0;
  try {
    totalBlocked = (db.prepare('SELECT COUNT(*) as count FROM blocked_senders').get() as { count: number }).count;
  } catch {}

  return { totalUsers, totalMessages, usersToday, messagesToday, totalBlocked };
}

export type AdminUserRow = {
  id: string;
  username: string;
  email: string;
  displayName: string;
  acceptingMessages: boolean;
  createdAt: number;
  messageCount: number;
};

export function getAdminUsers(search?: string, limit = 100): AdminUserRow[] {
  const db = getDb();
  let query = `
    SELECT u.id, u.username, u.email, u.display_name, u.accepting_messages, u.created_at, COUNT(m.id) as message_count
    FROM users u
    LEFT JOIN messages m ON m.recipient_id = u.id
  `;
  const params: unknown[] = [];

  if (search && search.trim()) {
    query += ` WHERE u.username LIKE ? OR u.email LIKE ? OR u.display_name LIKE ?`;
    const term = `%${search.trim()}%`;
    params.push(term, term, term);
  }

  query += ` GROUP BY u.id ORDER BY u.created_at DESC LIMIT ?`;
  params.push(limit);

  const rows = db.prepare(query).all(...params) as Array<{
    id: string;
    username: string;
    email: string;
    display_name: string;
    accepting_messages: number;
    created_at: number;
    message_count: number;
  }>;

  return rows.map((r) => ({
    id: r.id,
    username: r.username,
    email: r.email,
    displayName: r.display_name,
    acceptingMessages: r.accepting_messages === 1,
    createdAt: r.created_at,
    messageCount: r.message_count,
  }));
}

export type AdminMessageRow = {
  id: string;
  recipientUsername: string;
  body: string;
  gameMode: string;
  status: string;
  createdAt: number;
  hintDevice: string | null;
  hintLocation: string | null;
  reply: string | null;
};

export function getAdminMessages(limit = 100): AdminMessageRow[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT m.id, m.body, m.game_mode, m.status, m.created_at, m.hint_device, m.hint_location, m.reply, u.username as recipient_username
       FROM messages m
       JOIN users u ON m.recipient_id = u.id
       ORDER BY m.created_at DESC
       LIMIT ?`
    )
    .all(limit) as Array<{
      id: string;
      body: string;
      game_mode: string;
      status: string;
      created_at: number;
      hint_device: string | null;
      hint_location: string | null;
      reply: string | null;
      recipient_username: string;
    }>;

  return rows.map((r) => ({
    id: r.id,
    recipientUsername: r.recipient_username,
    body: r.body,
    gameMode: r.game_mode,
    status: r.status,
    createdAt: r.created_at,
    hintDevice: r.hint_device,
    hintLocation: r.hint_location,
    reply: r.reply,
  }));
}

export function adminDeleteMessage(id: string): void {
  getDb().prepare('DELETE FROM messages WHERE id = ?').run(id);
}

export function adminDeleteUser(id: string): void {
  getDb().prepare('DELETE FROM users WHERE id = ?').run(id);
}

export type TopInfluencer = {
  username: string;
  displayName: string;
  messageCount: number;
  lastActive: number;
};

export function getTopInfluencers(limit = 5): TopInfluencer[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT u.username, u.display_name, COUNT(m.id) as message_count, MAX(m.created_at) as last_active
       FROM users u
       JOIN messages m ON m.recipient_id = u.id
       GROUP BY u.id
       ORDER BY message_count DESC
       LIMIT ?`
    )
    .all(limit) as Array<{
      username: string;
      display_name: string;
      message_count: number;
      last_active: number;
    }>;

  return rows.map((r) => ({
    username: r.username,
    displayName: r.display_name,
    messageCount: r.message_count,
    lastActive: r.last_active,
  }));
}

export type GameModeStat = {
  gameMode: string;
  count: number;
  percentage: number;
};

export function getGameModeStats(): GameModeStat[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT game_mode, COUNT(*) as count
       FROM messages
       GROUP BY game_mode
       ORDER BY count DESC`
    )
    .all() as Array<{ game_mode: string; count: number }>;

  const total = rows.reduce((acc, r) => acc + r.count, 0);

  return rows.map((r) => ({
    gameMode: r.game_mode,
    count: r.count,
    percentage: total > 0 ? Math.round((r.count / total) * 100) : 0,
  }));
}

export type GlobalAnnouncement = {
  message: string;
  active: boolean;
  updatedAt: number;
};

export function getGlobalAnnouncement(): GlobalAnnouncement | null {
  try {
    const row = getDb().prepare("SELECT value, updated_at FROM app_settings WHERE key = 'global_announcement'").get() as
      | { value: string; updated_at: number }
      | undefined;
    if (!row) return null;
    const parsed = JSON.parse(row.value) as { message: string; active: boolean };
    return {
      message: parsed.message,
      active: Boolean(parsed.active),
      updatedAt: row.updated_at,
    };
  } catch {
    return null;
  }
}

export function setGlobalAnnouncement(message: string, active: boolean): void {
  const db = getDb();
  const value = JSON.stringify({ message: message.trim(), active });
  db.prepare(
    `INSERT INTO app_settings (key, value, updated_at)
     VALUES ('global_announcement', ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
  ).run(value, Date.now());
}

