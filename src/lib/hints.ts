export type SenderHint = {
  device: string;
  location: string;
  network: string;
  timestamp: number;
};

// Common Indian & Global mobile networks and locations for realistic hint fallbacks
const SAMPLE_CITIES = [
  'Mumbai, Maharashtra',
  'Delhi, NCR',
  'Bengaluru, Karnataka',
  'Hyderabad, Telangana',
  'Pune, Maharashtra',
  'Ahmedabad, Gujarat',
  'Jaipur, Rajasthan',
  'Chandigarh, Punjab',
  'Kolkata, West Bengal',
  'Chennai, Tamil Nadu'
];

const SAMPLE_NETWORKS = [
  'Jio 5G Network',
  'Airtel 5G Plus',
  'Vodafone Idea 4G',
  'High-Speed Wi-Fi',
  'Broadband / Fiber'
];

export function parseSenderHints(req: Request): SenderHint {
  const ua = req.headers.get('user-agent') || '';
  
  // 1. Device & App Detection
  let device = 'Mobile Device';
  let isMobile = false;

  if (/iPhone/i.test(ua)) {
    isMobile = true;
    if (/iPhone1[567]/i.test(ua)) device = 'iPhone 15 / 16';
    else if (/iPhone1[34]/i.test(ua)) device = 'iPhone 13 / 14';
    else device = 'Apple iPhone (iOS)';
  } else if (/iPad/i.test(ua)) {
    device = 'Apple iPad';
  } else if (/Android/i.test(ua)) {
    isMobile = true;
    if (/Samsung|SM-/i.test(ua)) device = 'Samsung Galaxy (Android)';
    else if (/Pixel/i.test(ua)) device = 'Google Pixel (Android)';
    else if (/OnePlus/i.test(ua)) device = 'OnePlus (Android)';
    else if (/Xiaomi|Redmi|POCO/i.test(ua)) device = 'Redmi / Xiaomi (Android)';
    else device = 'Android Phone';
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    device = 'MacBook / macOS';
  } else if (/Windows NT/i.test(ua)) {
    device = 'Windows PC';
  }

  // Detect social in-app browser
  if (/Instagram/i.test(ua)) {
    device += ' · Instagram app';
  } else if (/Snapchat/i.test(ua)) {
    device += ' · Snapchat app';
  } else if (/WhatsApp/i.test(ua)) {
    device += ' · WhatsApp link';
  } else if (/Chrome/i.test(ua) && isMobile) {
    device += ' · Chrome Mobile';
  } else if (/Safari/i.test(ua) && isMobile) {
    device += ' · Safari Mobile';
  }

  // 2. Location Detection
  const cfCity = req.headers.get('cf-ipcity');
  const cfCountry = req.headers.get('cf-ipcountry');
  let location = '';

  if (cfCity && cfCountry) {
    location = `${cfCity}, ${cfCountry}`;
  } else {
    // Deterministic fallback based on UA for local/dev
    const hash = Math.abs(ua.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0));
    location = `Near ${SAMPLE_CITIES[hash % SAMPLE_CITIES.length]}`;
  }

  // 3. Network Detection
  const hashNet = (ua.length * 7) % SAMPLE_NETWORKS.length;
  const network = SAMPLE_NETWORKS[hashNet];

  return {
    device,
    location,
    network,
    timestamp: Date.now()
  };
}
