export const APP_NAME = 'KAHO';
export const MAX_MESSAGE_LENGTH = 300;
export const MAX_REPLY_LENGTH = 1000;

export const RESERVED_USERNAMES = new Set([
  'admin', 'api', 'login', 'logout', 'signup', 'inbox', 'settings', 'u', 'terms', 'privacy',
  'safety', 'help', 'support', 'about', 'static', 'public', 'null', 'undefined', 'me', 'root',
]);

export type GameMode = {
  id: string;
  name: string;
  icon: string;
  tagline: string;
  gradient: string;
  badge: string;
  defaultPrompt: string;
  placeholder: string;
  questions: string[];
};

export const GAME_MODES: GameMode[] = [
  {
    id: 'ama',
    name: 'Ask Me',
    icon: '💬',
    tagline: 'Send me anonymous messages!',
    gradient: 'from-[#EC1187] via-[#FF4500] to-[#FF8D10]',
    badge: 'Anonymous AMA',
    defaultPrompt: 'Send me anonymous messages!',
    placeholder: 'Ask me anything you want…',
    questions: [
      'What is your biggest dream in life? ✨',
      "Who's your secret celebrity crush? 🙈",
      'If you could have any superpower, what would it be? 🦸',
      'What is one thing you would change about this year? 🗓️',
      "What's your dream job or passion project? 🚀",
      'What was your honest first impression of me? 👀',
      'Tell me something you have never told anyone else 🤐',
      'What song do you have on repeat right now? 🎵'
    ]
  },
  {
    id: 'confessions',
    name: 'Confessions',
    icon: '🤫',
    tagline: 'Send me a secret confession…',
    gradient: 'from-[#8A2BE2] via-[#DA70D6] to-[#FF1493]',
    badge: 'Secret Confession',
    defaultPrompt: 'send me a confession 🤫',
    placeholder: 'Confess something you never told me…',
    questions: [
      'I have had a secret crush on you for months 😳',
      'I pretend to drink coffee but it’s just iced tea 🧋',
      'I stalked your Instagram profile last night 👀',
      'I failed an exam and never told my parents 🫣',
      'I accidentally broke something of yours and never admitted it 🤫',
      'You are way cooler and cuter than you think you are 💖',
      'I always look for you whenever I enter the room ✨'
    ]
  },
  {
    id: 'ship',
    name: 'Ship Me',
    icon: '💕',
    tagline: 'Ship me with someone…',
    gradient: 'from-[#FF1493] via-[#FF007F] to-[#FF4500]',
    badge: 'Couple Shipping',
    defaultPrompt: 'who do you ship me with? 💕',
    placeholder: 'I ship you with…',
    questions: [
      'Who in our group would look the cutest with me? 🙈',
      'I ship you with that one person from your class 👀',
      'You and your bestie have unspoken chemistry ❤️',
      'Someone in your close friends circle has feelings for you 🤫',
      'You deserve someone who treats you like royalty 👑'
    ]
  },
  {
    id: 'music',
    name: 'Drop a Song',
    icon: '🎵',
    tagline: 'Send a song that matches my vibe…',
    gradient: 'from-[#1DB954] via-[#1ED760] to-[#121212]',
    badge: 'Vibe Playlist',
    defaultPrompt: 'send a song that matches my vibe 🎵',
    placeholder: 'Song title & artist name…',
    questions: [
      'Apna Bana Le - Arijit Singh ✨',
      'Starboy - The Weeknd 🔥',
      'Until I Found You - Stephen Sanchez 🌹',
      'Kahani Suno - Kaifi Khalil 🥺',
      'Lover - Taylor Swift 💖',
      'Golden Hour - JVKE 🌅',
      'Die With A Smile - Bruno Mars & Lady Gaga 💫'
    ]
  },
  {
    id: 'flags',
    name: 'Red/Green Flag',
    icon: '🚩',
    tagline: 'What is my biggest red and green flag?',
    gradient: 'from-[#EF4444] via-[#F97316] to-[#10B981]',
    badge: 'Honest Flags',
    defaultPrompt: 'my red flag 🚩 vs my green flag 🟢?',
    placeholder: 'Red flag: … | Green flag: …',
    questions: [
      'Green flag: You always reply fast 🟢 | Red flag: Overthinking everything 🚩',
      'Green flag: Immaculate music taste 🟢 | Red flag: Sleeping at 4 AM 🚩',
      'Green flag: Sweetest smile in room 🟢 | Red flag: Bad at texting first 🚩',
      'Green flag: 100% loyal to friends 🟢 | Red flag: Trust issues 🚩'
    ]
  },
  {
    id: 'impression',
    name: 'First Impression',
    icon: '👀',
    tagline: 'First impression vs now…',
    gradient: 'from-[#3B82F6] via-[#8B5CF6] to-[#EC4899]',
    badge: 'Impression Check',
    defaultPrompt: 'first impression of me vs now? 👀',
    placeholder: 'First thought: … | Now I think: …',
    questions: [
      'Thought you had attitude, now you are a soft marshmallow 🥺',
      'Thought you were quiet, now you never stop talking 💀',
      'Thought you were intimidating, now you are my comfort person ❤️',
      'Thought you were out of my league, now I know you are super goofy 😂'
    ]
  },
  {
    id: 'three_words',
    name: '3 Words',
    icon: '✨',
    tagline: 'Describe me in 3 words…',
    gradient: 'from-[#FF007F] via-[#FF7700] to-[#FFD700]',
    badge: '3 Words',
    defaultPrompt: 'describe me in 3 words ✨',
    placeholder: '3 words that best describe me…',
    questions: [
      'Spicy, gorgeous, beautiful 💖',
      'Genius, iconic, funny 💅',
      'Loyal, chaotic, sweet 😇',
      'BFF, boujee, simp 👑',
      'Smart, humble, legendary ⚡',
      'Cute, savage, real 🔥',
      'Vibrant, pure, unforgettable 🌸'
    ]
  },
  {
    id: 'never_have_i_ever',
    name: 'Never Have I Ever',
    icon: '🙈',
    tagline: 'Never have I ever…',
    gradient: 'from-[#FF8C00] via-[#FF4500] to-[#E6007A]',
    badge: 'Never Have I Ever',
    defaultPrompt: 'never have I ever… 🙈',
    placeholder: 'Never have I ever…',
    questions: [
      'Never have I ever dyed my hair a crazy color 💇',
      'Never have I ever ghosted someone I liked 👻',
      'Never have I ever lied on a first date 🤐',
      'Never have I ever Googled myself late at night 🔎',
      'Never have I ever stalked an ex’s best friend’s story 📱',
      'Never have I ever fallen asleep in class or on a zoom call 😴',
      'Never have I ever texted my crush and immediately thrown my phone 📱'
    ]
  }
];

export const PROMPTS = GAME_MODES.flatMap((m) => m.questions);
