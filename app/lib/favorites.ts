import type { FeedItem } from './content';

export interface Favorite {
  item: FeedItem;
  savedAt: number;
}

export function itemKey(item: FeedItem) {
  return `${item.kind}:${item.kind === 'youtube' ? item.videoId : item.id}`;
}

function isFeedItem(value: unknown): value is FeedItem {
  if (!value || typeof value !== 'object') return false;
  const item = value as FeedItem;
  if (typeof item.id !== 'string' || typeof item.sourceUrl !== 'string') return false;
  if (item.kind === 'youtube') {
    return typeof item.videoId === 'string' && (item.metadata === null ||
      (typeof item.metadata?.title === 'string' && typeof item.metadata?.authorName === 'string'));
  }
  return item.kind === 'x' && typeof item.text === 'string' &&
    typeof item.createdAt === 'string' && typeof item.author?.name === 'string' &&
    typeof item.author?.handle === 'string' && typeof item.author?.avatarUrl === 'string' &&
    Array.isArray(item.photos) && item.photos.every(photo => photo && typeof photo.url === 'string') &&
    Array.isArray(item.videos) && item.videos.every(video => video && typeof video.url === 'string' && Array.isArray(video.variants)) &&
    (!item.quote || isFeedItem(item.quote));
}

export function parseFavorites(raw: string | null): Favorite[] {
  if (!raw) return [];
  const data: unknown = JSON.parse(raw);
  if (!Array.isArray(data) || !data.every(entry => entry &&
    Number.isFinite(entry.savedAt) && isFeedItem(entry.item))) {
    throw new Error('Invalid favorites');
  }
  const seen = new Set<string>();
  return (data as Favorite[]).sort((a, b) => b.savedAt - a.savedAt).filter(({ item }) => {
    const key = itemKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// A seeded Fisher–Yates shuffle keeps a browsing round stable across renders.
export function shuffleItems<T>(items: readonly T[], seed: number): T[] {
  const result = [...items];
  let state = seed >>> 0;
  for (let i = result.length - 1; i > 0; i--) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const j = Math.floor((state / 4294967296) * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
