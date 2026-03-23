const X_STATUS_REGEX =
  /^https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/([A-Za-z0-9_]{1,15})\/status\/(\d+)/i;
const YOUTUBE_WATCH_REGEX =
  /^https?:\/\/(?:www\.)?youtube\.com\/watch\?(?:.*?&)?v=([A-Za-z0-9_-]{11})(?:[&#].*)?$/i;
const YOUTUBE_SHORT_REGEX =
  /^https?:\/\/youtu\.be\/([A-Za-z0-9_-]{11})(?:[?&#].*)?$/i;

export function isXUrl(url: string): boolean {
  return X_STATUS_REGEX.test(url);
}

export function isYouTubeUrl(url: string): boolean {
  return Boolean(extractYouTubeVideoId(url));
}

export function extractXStatusParts(url: string): {
  username: string;
  statusId: string;
} | null {
  const match = url.match(X_STATUS_REGEX);
  if (!match) {
    return null;
  }

  return {
    username: match[1],
    statusId: match[2],
  };
}

export function extractYouTubeVideoId(url: string): string | null {
  const watchMatch = url.match(YOUTUBE_WATCH_REGEX);
  if (watchMatch) {
    return watchMatch[1];
  }

  const shortMatch = url.match(YOUTUBE_SHORT_REGEX);
  return shortMatch ? shortMatch[1] : null;
}

export function normalizeXCanonicalUrl(url: string): string {
  const parts = extractXStatusParts(url);
  if (!parts) {
    return url;
  }

  return `https://x.com/${parts.username}/status/${parts.statusId}`;
}

export function normalizeXApiUrl(url: string): string {
  const parts = extractXStatusParts(url);
  if (!parts) {
    return url;
  }

  return `https://api.fxtwitter.com/${parts.username}/status/${parts.statusId}`;
}

export function normalizeYouTubeUrl(url: string): string {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) {
    return url;
  }

  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function normalizeSupportedUrl(url: string): string {
  if (isXUrl(url)) {
    return normalizeXCanonicalUrl(url);
  }

  if (isYouTubeUrl(url)) {
    return normalizeYouTubeUrl(url);
  }

  return url;
}

export function isPastebinUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname === 'pastebin.com';
  } catch {
    return false;
  }
}

export function normalizeListSourceUrl(url: string): string {
  if (!isPastebinUrl(url)) {
    return url;
  }

  try {
    const parsed = new URL(url);
    if (!parsed.pathname.startsWith('/raw/')) {
      parsed.pathname = `/raw${parsed.pathname}`;
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

export function getContentType(url: string): 'twitter' | 'youtube' | 'unknown' {
  if (isXUrl(url)) return 'twitter';
  if (isYouTubeUrl(url)) return 'youtube';
  return 'unknown';
}
