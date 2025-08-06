export function isXUrl(url: string): boolean {
  return /^https?:\/\/(twitter\.com|x\.com)\/\w+\/status\/\d+/.test(url);
}

export function isYouTubeUrl(url: string): boolean {
  const youtubeRegex = /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  return youtubeRegex.test(url);
}

export function extractYouTubeVideoId(url: string): string | null {
  const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

export function normalizeXUrl(url: string): string {
  return url.replace(/^https?:\/\/(twitter\.com|x\.com)/, 'https://api.fxtwitter.com');
}

export function getContentType(url: string): 'twitter' | 'youtube' | 'unknown' {
  if (isXUrl(url)) return 'twitter';
  if (isYouTubeUrl(url)) return 'youtube';
  return 'unknown';
}