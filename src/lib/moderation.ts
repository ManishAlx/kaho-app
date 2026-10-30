export type ModerationResult = {
  allowed: boolean;
  reason?: 'abuse' | 'threat' | 'sexual' | 'personal_data' | 'self_harm' | 'hate' | 'other';
  provider: 'gemini' | 'openai' | 'local';
};

// --- Comprehensive Local rule-based moderation (English + Hindi/Hinglish) ---
const PROFANITY = [
  // English
  'fuck', 'fucking', 'fuck you', 'fuck off', 'bitch', 'bastard', 'slut', 'whore', 'asshole', 'dickhead', 'cunt', 'fucker', 'dick', 'pussy',
  // Hindi / Hinglish slurs & abuses
  'madarchod', 'maderchod', 'mc', 'bhenchod', 'behenchod', 'bc', 'chutiya', 'chutiye', 'chutya',
  'randi', 'harami', 'kutta', 'kamina', 'kamine', 'gandu', 'gaand', 'bhosdike', 'bhosadike',
  'lauda', 'lawda', 'lodu', 'lund', 'tatte', 'suar', 'saale kutte', 'teri maa ki', 'teri ma ki', 'choot', 'chut', 'maa ki chut',
];

const SELF_HARM = [
  /\bkill\s+yourself\b/i,
  /\bkys\b/i,
  /\bgo\s+die\b/i,
  /\bhang\s+yourself\b/i,
  /\bnobody\s+would\s+miss\s+you\b/i,
  /\bmar\s+ja\b/i,
  /\bjaan\s+de\s+de\b/i,
  /\batmahatya\b/i,
];

const THREAT = [
  /\bi('| a)?(ll| will| am going to|'m going to)\s+(kill|hurt|find|beat|stab|shoot|rape)\b/i,
  /\bwatch\s+your\s+back\b/i,
  /\bi\s+know\s+where\s+you\s+live\b/i,
  /\bmaar\s+dunga\b/i,
  /\bpitwayega\b/i,
  /\bchhodunga\s+nahi\b/i,
];

const SEXUAL = [
  /\bnudes?\b/i,
  /\bsend\s+(me\s+)?(pics|pictures|photos)\b.*\b(naked|nude)\b/i,
  /\bsex\s+with\s+me\b/i,
  /\bjism\b/i,
  /\bkapde\s+utaro\b/i,
];

const HATE = [
  /\b(all|those)\s+\w+\s+(should|must)\s+(die|be\s+killed)\b/i,
];

const PHONE = /(?:\+?\d[\s\-().]*){10,}/;
const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[@4]/g, 'a')
    .replace(/[!1|]/g, 'i')
    .replace(/0/g, 'o')
    .replace(/\$/g, 's')
    .replace(/[^a-z\s]/g, '');
}

export function moderateLocal(text: string): ModerationResult {
  const raw = text;
  const norm = normalize(text);

  if (SELF_HARM.some((r) => r.test(raw))) return { allowed: false, reason: 'self_harm', provider: 'local' };
  if (THREAT.some((r) => r.test(raw))) return { allowed: false, reason: 'threat', provider: 'local' };
  if (HATE.some((r) => r.test(raw))) return { allowed: false, reason: 'hate', provider: 'local' };
  if (SEXUAL.some((r) => r.test(raw))) return { allowed: false, reason: 'sexual', provider: 'local' };

  if (PROFANITY.some((w) => new RegExp(`(^|\\s)${w.replace(/\s+/g, '\\s+')}(\\s|$)`).test(norm))) {
    return { allowed: false, reason: 'abuse', provider: 'local' };
  }

  if (PHONE.test(raw) || EMAIL.test(raw)) {
    return { allowed: false, reason: 'personal_data', provider: 'local' };
  }

  return { allowed: true, provider: 'local' };
}

// --- Google Gemini Flash Moderation (Hinglish & Multi-lingual) ---
async function moderateGemini(text: string, key: string): Promise<ModerationResult | null> {
  try {
    const prompt = `You are a strict safety and anti-bullying AI moderator for an anonymous social app called KAHO.
Analyze this message for severe cyberbullying, death threats, sexual harassment, or abusive hate speech in Hindi, Hinglish, or English.
Message: "${text}"

Reply ONLY with valid JSON in this exact structure:
{"allowed": true} OR {"allowed": false, "reason": "abuse" | "threat" | "sexual" | "hate" | "self_harm"}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
        signal: AbortSignal.timeout(3500),
      }
    );

    if (!res.ok) return null;
    const data = await res.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) return null;

    const parsed = JSON.parse(candidateText) as { allowed: boolean; reason?: ModerationResult['reason'] };
    return {
      allowed: Boolean(parsed.allowed),
      reason: parsed.allowed ? undefined : parsed.reason || 'abuse',
      provider: 'gemini',
    };
  } catch {
    return null;
  }
}

// --- OpenAI Moderation API (free) ---
async function moderateOpenAI(text: string, key: string): Promise<ModerationResult | null> {
  try {
    const res = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: 'omni-moderation-latest', input: text }),
      signal: AbortSignal.timeout(3500),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { results?: { flagged: boolean; categories: Record<string, boolean> }[] };
    const r = data.results?.[0];
    if (!r) return null;
    if (!r.flagged) return { allowed: true, provider: 'openai' };
    const c = r.categories;
    const reason: ModerationResult['reason'] =
      c['self-harm'] || c['self-harm/intent'] || c['self-harm/instructions']
        ? 'self_harm'
        : c['harassment/threatening'] || c['hate/threatening'] || c['violence']
          ? 'threat'
          : c['sexual'] || c['sexual/minors']
            ? 'sexual'
            : c['hate']
              ? 'hate'
              : 'abuse';
    return { allowed: false, reason, provider: 'openai' };
  } catch {
    return null;
  }
}

/** Every message passes through here BEFORE it can reach an inbox. */
export async function moderate(text: string): Promise<ModerationResult> {
  // 1. Personal data + instant local rules always run first
  const local = moderateLocal(text);
  if (!local.allowed) return local;

  // 2. If GEMINI_API_KEY is configured, run Gemini Flash (best for Hinglish)
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    const geminiRes = await moderateGemini(text, geminiKey);
    if (geminiRes && !geminiRes.allowed) return geminiRes;
  }

  // 3. Fallback to OpenAI if configured
  const openAIKey = process.env.OPENAI_API_KEY;
  if (openAIKey) {
    const remote = await moderateOpenAI(text, openAIKey);
    if (remote && !remote.allowed) return remote;
  }

  return local;
}

export const BLOCK_MESSAGES: Record<NonNullable<ModerationResult['reason']>, string> = {
  abuse: 'Your message was blocked because it looks abusive or toxic. Please keep it kind!',
  threat: 'Your message was blocked because it looks threatening.',
  sexual: 'Your message was blocked because it contains sexual content.',
  hate: 'Your message was blocked because it contains hateful content.',
  personal_data: 'Your message was blocked because it contains personal data like a phone number or email.',
  self_harm:
    'Your message was blocked. If you or someone you know is struggling, please reach out to a local helpline or someone you trust. You are not alone.',
  other: 'Your message was blocked by our safety filter.',
};
