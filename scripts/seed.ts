import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import { getDb } from '../src/lib/db';

const db = getDb();
const email = 'demo@example.com';
let user = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as { id: string } | undefined;

let userId = user?.id;
if (!userId) {
  userId = randomUUID();
  db.prepare(
    'INSERT INTO users (id,email,password_hash,username,display_name,accepting_messages,created_at) VALUES (?,?,?,?,?,1,?)'
  ).run(userId, email, bcrypt.hashSync('demo12345', 12), 'demo', 'Demo User', Date.now());
}

// Clear old sample messages for demo user to reload fresh ones
db.prepare("DELETE FROM messages WHERE recipient_id = ? AND sender_hash = 'seed'").run(userId);

const samples = [
  {
    body: 'You have the best laugh in the whole class honestly 😂',
    gameMode: 'three_words',
    hintDevice: 'Apple iPhone 15 · Instagram app',
    hintLocation: 'Mumbai, Maharashtra',
    hintNetwork: 'Jio 5G Network',
    reply: 'Hahaha thank you! That made my day ❤️',
    repliedAt: Date.now() - 3600_000,
  },
  {
    body: 'I have had a secret crush on you for months and was scared to say it 🙈',
    gameMode: 'confessions',
    hintDevice: 'Apple iPhone 14 · Safari Mobile',
    hintLocation: 'Delhi, NCR',
    hintNetwork: 'Airtel 5G Plus',
    reply: null,
    repliedAt: null,
  },
  {
    body: 'Never have I ever stalked someone as much as your aesthetic IG feed ✨',
    gameMode: 'never_have_i_ever',
    hintDevice: 'Samsung Galaxy S24 (Android) · Instagram app',
    hintLocation: 'Bengaluru, Karnataka',
    hintNetwork: 'High-Speed Wi-Fi',
    reply: 'Omg who is this?? Reveal yourself! 😂',
    repliedAt: Date.now() - 7200_000,
  },
  {
    body: 'What is your biggest dream job or passion project for next year?',
    gameMode: 'ama',
    hintDevice: 'Google Pixel 8 (Android) · Chrome Mobile',
    hintLocation: 'Pune, Maharashtra',
    hintNetwork: 'Vodafone Idea 4G',
    reply: null,
    repliedAt: null,
  },
  {
    body: 'Spicy, gorgeous, iconic 💅',
    gameMode: 'three_words',
    hintDevice: 'Apple iPhone 16 Pro · Instagram app',
    hintLocation: 'Hyderabad, Telangana',
    hintNetwork: 'Jio 5G Network',
    reply: 'Aww stop it you are too sweet 🥰',
    repliedAt: Date.now() - 14400_000,
  },
  {
    body: 'Give me 3 clues about your secret crush 🤫❤️',
    gameMode: 'crush',
    hintDevice: 'OnePlus 12 (Android) · WhatsApp link',
    hintLocation: 'Ahmedabad, Gujarat',
    hintNetwork: 'Airtel 5G Plus',
    reply: null,
    repliedAt: null,
  },
];

const ins = db.prepare(`
  INSERT INTO messages 
  (id, recipient_id, body, game_mode, hint_device, hint_location, hint_network, status, is_read, reply, replied_at, sender_hash, created_at) 
  VALUES (?,?,?,?,?,?,?,?,0,?,?,?,?)
`);

samples.forEach((s, i) => {
  ins.run(
    randomUUID(),
    userId,
    s.body,
    s.gameMode,
    s.hintDevice,
    s.hintLocation,
    s.hintNetwork,
    'VISIBLE',
    s.reply,
    s.repliedAt,
    'seed',
    Date.now() - (samples.length - i) * 1800_000
  );
});

console.log('Seeded demo account with NGL-style messages and hints!');
console.log('Login: demo@example.com / demo12345  ->  public link: /u/demo');
