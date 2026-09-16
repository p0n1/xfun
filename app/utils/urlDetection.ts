const X_STATUS_REGEX =
  /^https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/([A-Za-z0-9_]{1,15})\/status\/(\d+)(?=[/?#]|$)/i;

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
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
    const hostname = parsed.hostname.replace(/^www\./, '');
    const videoId = hostname === 'youtu.be'
      ? parsed.pathname.slice(1)
      : hostname === 'youtube.com' && parsed.pathname === '/watch'
        ? parsed.searchParams.get('v')
        : null;
    return videoId && /^[A-Za-z0-9_-]{11}$/.test(videoId) ? videoId : null;
  } catch {
    return null;
  }
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
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error('Use an HTTP or HTTPS URL for your text list.');
  }
  if (parsed.hostname === 'pastebin.com' && !parsed.pathname.startsWith('/raw/')) {
    parsed.pathname = `/raw${parsed.pathname}`;
  }
  return parsed.toString();
}

export function buildListPath(pathname: string, listUrl?: string): string {
  return listUrl ? `${pathname}?${new URLSearchParams({ list: listUrl })}` : pathname;
}

export function getContentType(url: string): 'twitter' | 'youtube' | 'unknown' {
  if (isXUrl(url)) return 'twitter';
  if (isYouTubeUrl(url)) return 'youtube';
  return 'unknown';
}
