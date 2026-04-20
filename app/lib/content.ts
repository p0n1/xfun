import {
  extractYouTubeVideoId,
  getContentType,
  isPastebinUrl,
  normalizeListSourceUrl,
  normalizeSupportedUrl,
  normalizeXApiUrl,
  normalizeXCanonicalUrl,
} from '../utils/urlDetection';

export const DEMO_URLS = [
  'https://www.youtube.com/watch?v=VxkMSkDF8vY',
  'https://x.com/SpaceX/status/1949680387330027593',
  'https://x.com/SpaceX/status/1949993416604951017',
  'https://www.youtube.com/watch?v=hI9HQfCAw64',
  'https://x.com/AMAZlNGNATURE/status/1932563688667373813',
  'https://www.youtube.com/watch?v=AZ7AcvbebKo',
  'https://x.com/NoContextHumans/status/1949803858063970648',
  'https://x.com/niccruzpatane/status/1946967976005042231',
  'https://x.com/SpaceX/status/1946437942265987384',
  'https://youtu.be/2R8V68viXqk',
  'https://x.com/johnkrausphotos/status/1947054042787762669',
  'https://x.com/SpaceBasedFox/status/1946403321646116865',
  'https://x.com/AMAZlNGNATURE/status/1941281137915040187',
  'https://www.youtube.com/watch?v=6yb6cSHqEGs',
  'https://x.com/satofishi/status/1908020230561075521',
  'https://x.com/Rainmaker1973/status/1950054930384830578',
  'https://x.com/Rainmaker1973/status/1945522890889212414',
  'https://x.com/yourcloudnin3/status/1944214180472733905',
  'https://x.com/not_2b_or_2b/status/1949666334616232152',
  'https://twitter.com/joely7758521/status/1947472826489016745',
  'https://x.com/interesting_aIl/status/1945914505633902667',
  'https://x.com/DashHuang/status/1945939956444410008',
  'https://x.com/earth_tracker/status/1944988485485781326',
  'https://x.com/Rainmaker1973/status/1943173340472185135',
  'https://x.com/catsareblessing/status/1941930158392553923',
  'https://x.com/iam_smx/status/1940714232821277108',
  'https://x.com/Ivar_A2428/status/1939698895598276770',
  'https://twitter.com/jack/status/20',
  'https://twitter.com/elonmusk/status/1585841080431321088',
  'https://x.com/konstructivizm/status/1939430423190470904',
  'https://x.com/HowThingsWork_/status/1938658586839990720',
  'https://x.com/Rainmaker1973/status/1938845424628179186',
  'https://x.com/historigins/status/1938630539696619880',
  'https://x.com/Crazymoments01/status/1938506613117358262',
  'https://x.com/gunsnrosesgirl3/status/1938283624794636738',
  'https://x.com/TodayiLearrned/status/1937704284713365861',
  'https://x.com/AMAZlNGNATURE/status/1937495493476487329',
  'https://x.com/PicturesFoIder/status/1936868452242760065',
  'https://x.com/UNIVERSE_FEEDS/status/1936873263038074891',
  'https://x.com/Rainmaker1973/status/1936647837615296894',
];

export const DEMO_LISTS = [
  {
    name: 'SpaceX posts',
    url: 'https://raw.githubusercontent.com/p0n1/xfun/refs/heads/main/demo-lists/spacex.txt',
    description: 'Launch clips, photos, and mission moments.',
  },
];

export const BATCH_SIZE = 3;

export type ListLoadStage =
  | 'preparing'
  | 'fetching'
  | 'proxying'
  | 'parsing'
  | 'ready';

export type ListProxyAttemptStatus =
  | 'pending'
  | 'active'
  | 'failed'
  | 'success';

export interface ListProxyAttempt {
  name: string;
  status: ListProxyAttemptStatus;
}

export interface ListLoadProgress {
  stage: ListLoadStage;
  headline: string;
  detail: string;
  progressPercent: number;
  usesProxy: boolean;
  proxyAttempts: ListProxyAttempt[];
}

export interface XPhoto {
  url: string;
  width: number;
  height: number;
}

export interface XVideoVariant {
  contentType: string;
  url: string;
  bitrate?: number;
}

export interface XVideo {
  url: string;
  thumbnailUrl: string;
  duration: number;
  width: number;
  height: number;
  variants: XVideoVariant[];
}

export interface XAuthor {
  name: string;
  handle: string;
  avatarUrl: string;
}

export interface XPostItem {
  kind: 'x';
  id: string;
  sourceUrl: string;
  text: string;
  createdAt: string;
  author: XAuthor;
  photos: XPhoto[];
  videos: XVideo[];
  quote?: XPostItem;
}

export interface YouTubeMetadata {
  title: string;
  authorName: string;
  authorUrl: string;
  thumbnailUrl: string;
  providerName: string;
}

export interface YouTubeItem {
  kind: 'youtube';
  id: string;
  sourceUrl: string;
  videoId: string;
  metadata: YouTubeMetadata | null;
  metadataError?: string;
}

export type FeedItem = XPostItem | YouTubeItem;

interface RawFxAuthor {
  name: string;
  screen_name: string;
  avatar_url: string;
}

interface RawFxPhoto {
  url: string;
  width: number;
  height: number;
}

interface RawFxVideoVariant {
  content_type: string;
  url: string;
  bitrate?: number;
}

interface RawFxVideo {
  url: string;
  thumbnail_url: string;
  duration: number;
  width: number;
  height: number;
  variants: RawFxVideoVariant[];
}

interface RawFxMedia {
  photos?: RawFxPhoto[];
  videos?: RawFxVideo[];
}

interface RawFxTweet {
  url: string;
  id: string;
  text: string;
  created_at: string;
  author: RawFxAuthor;
  media?: RawFxMedia;
  quote?: RawFxTweet;
}

interface RawFxResponse {
  code: number;
  message: string;
  tweet: RawFxTweet;
}

interface LoadUrlListOptions {
  onProgress?: (progress: ListLoadProgress) => void;
}

interface ProxyDefinition {
  name: string;
  buildRequestUrl: (targetUrl: string, cacheBuster: string) => string;
  extractContent: (response: string) => string;
}

const PROXY_REQUEST_TIMEOUT_MS = 8000;

function emitListLoadProgress(
  onProgress: LoadUrlListOptions['onProgress'],
  progress: ListLoadProgress,
) {
  onProgress?.({
    ...progress,
    proxyAttempts: progress.proxyAttempts.map((attempt) => ({ ...attempt })),
  });
}

function getHostnameLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function looksLikeHtml(content: string): boolean {
  const trimmed = content.trim().toLowerCase();
  if (!trimmed) return false;

  return (
    trimmed.startsWith('<!doctype html') ||
    trimmed.startsWith('<html') ||
    (trimmed.includes('<head') && trimmed.includes('<body')) ||
    (trimmed.includes('<script') && trimmed.includes('</html>'))
  );
}

function looksLikeCloudflareChallenge(content: string): boolean {
  const lower = content.toLowerCase();

  return (
    lower.includes('cf_chl') ||
    lower.includes('cloudflare') ||
    lower.includes('just a moment') ||
    lower.includes('challenge-error-text') ||
    lower.includes('checking your browser')
  );
}

function extractProxyErrorMessage(content: string): string | null {
  const trimmed = content.trim();
  if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed) as Record<string, unknown>;
    const parts = [
      parsed.error,
      parsed.message,
      parsed.corsfix_error,
      parsed.detail,
    ]
      .filter((value): value is string => typeof value === 'string')
      .map((value) => value.trim())
      .filter(Boolean);

    if (parts.length === 0) {
      return null;
    }

    return parts.join(' ');
  } catch {
    return null;
  }
}

async function fetchProxyResponse(requestUrl: string): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), PROXY_REQUEST_TIMEOUT_MS);

  try {
    // Keep this a simple GET. Some public CORS proxies only support GET and
    // fail browser preflight requests triggered by custom headers.
    return await fetch(requestUrl, {
      cache: 'no-store',
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(
        `Timed out after ${Math.round(PROXY_REQUEST_TIMEOUT_MS / 1000)} seconds`,
      );
    }

    throw error;
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
}

export function deduplicateUrls(urls: string[]): {
  urls: string[];
  duplicatesRemoved: number;
} {
  const seen = new Set<string>();
  const deduplicated: string[] = [];
  let duplicatesRemoved = 0;

  for (const url of urls) {
    const normalized = normalizeSupportedUrl(url);
    if (seen.has(normalized)) {
      duplicatesRemoved += 1;
      continue;
    }

    seen.add(normalized);
    deduplicated.push(normalized);
  }

  return {
    urls: deduplicated,
    duplicatesRemoved,
  };
}

export function parseUrlList(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && !line.startsWith('//'))
    .map((line) => {
      const xMatch = line.match(
        /^(https:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/[A-Za-z0-9_]{1,15}\/status\/\d+)/i,
      );
      if (xMatch) {
        return normalizeXCanonicalUrl(xMatch[1]);
      }

      const videoId = extractYouTubeVideoId(line);
      if (videoId) {
        return `https://www.youtube.com/watch?v=${videoId}`;
      }

      return null;
    })
    .filter((url): url is string => Boolean(url));
}

async function fetchWithCorsProxy(
  url: string,
  onProgress?: LoadUrlListOptions['onProgress'],
): Promise<string> {
  const proxies: ProxyDefinition[] = [
    {
      name: 'codetabs',
      buildRequestUrl: (targetUrl: string, cacheBuster: string) => {
        const proxyUrl = new URL('https://api.codetabs.com/v1/proxy/');
        proxyUrl.searchParams.set('quest', targetUrl);
        proxyUrl.searchParams.set('_xfun_cb', cacheBuster);
        return proxyUrl.toString();
      },
      extractContent: (response: string) => response,
    },
    {
      name: 'allorigins-hexlet',
      buildRequestUrl: (targetUrl: string, cacheBuster: string) => {
        const proxyUrl = new URL('https://allorigins.hexlet.app/raw');
        proxyUrl.searchParams.set('url', targetUrl);
        proxyUrl.searchParams.set('disableCache', 'true');
        proxyUrl.searchParams.set('_xfun_cb', cacheBuster);
        return proxyUrl.toString();
      },
      extractContent: (response: string) => response,
    },
  ];
  const proxyAttempts: ListProxyAttempt[] = proxies.map((proxy) => ({
    name: proxy.name,
    status: 'pending',
  }));

  let lastError: Error | null = null;

  for (const [index, proxy] of proxies.entries()) {
    proxyAttempts[index] = {
      name: proxy.name,
      status: 'active',
    };
    emitListLoadProgress(onProgress, {
      stage: 'proxying',
      headline: `Trying ${proxy.name}`,
      detail: `Proxy bridge ${index + 1} of ${proxies.length} is requesting ${getHostnameLabel(url)}.`,
      progressPercent: 24 + index * 14,
      usesProxy: true,
      proxyAttempts,
    });

    try {
      const requestUrl = proxy.buildRequestUrl(url, `${Date.now()}-${index}`);
      const response = await fetchProxyResponse(requestUrl);
      const text = await response.text();
      const proxyError = extractProxyErrorMessage(text);

      if (!response.ok) {
        const statusDetail = proxyError ?? response.statusText;
        throw new Error(`HTTP ${response.status}: ${statusDetail}`);
      }

      if (proxyError) {
        throw new Error(proxyError);
      }

      const content = proxy.extractContent(text);
      const extractedProxyError = extractProxyErrorMessage(content);
      if (extractedProxyError) {
        throw new Error(extractedProxyError);
      }

      if (looksLikeHtml(content)) {
        if (looksLikeCloudflareChallenge(content)) {
          throw new Error('Received Cloudflare challenge HTML');
        }

        throw new Error('Received HTML instead of plain text');
      }

      proxyAttempts[index] = {
        name: proxy.name,
        status: 'success',
      };
      emitListLoadProgress(onProgress, {
        stage: 'parsing',
        headline: 'List text received',
        detail: `The file came through ${proxy.name}. Extracting supported post links now.`,
        progressPercent: 76,
        usesProxy: true,
        proxyAttempts,
      });
      return content;
    } catch (error) {
      proxyAttempts[index] = {
        name: proxy.name,
        status: 'failed',
      };
      lastError =
        error instanceof Error ? error : new Error('Unknown CORS proxy error');

      const nextProxy = proxies[index + 1];
      emitListLoadProgress(onProgress, {
        stage: 'proxying',
        headline: nextProxy
          ? `${proxy.name} failed. Retrying with ${nextProxy.name}.`
          : `${proxy.name} failed.`,
        detail: nextProxy
          ? `Moving to proxy bridge ${index + 2} of ${proxies.length}. GitHub Raw and public Gists are usually more reliable.`
          : 'All available proxy bridges have been tried. GitHub Raw and public Gists are usually more reliable.',
        progressPercent: 32 + index * 14,
        usesProxy: true,
        proxyAttempts,
      });
    }
  }

  throw lastError ?? new Error('All public proxy bridges failed');
}

function formatListFetchError(originalUrl: string, message: string): string {
  const usesProxy = isPastebinUrl(originalUrl);
  const lowerMessage = message.toLowerCase();

  if (usesProxy && lowerMessage.includes('cloudflare')) {
    return 'Pastebin blocked the proxy bridge with a Cloudflare challenge. Pastebin support is best-effort here, so try again later or use a GitHub Raw URL or public Gist instead.';
  }

  if (usesProxy && lowerMessage.includes('html')) {
    return 'The proxy bridge returned HTML instead of a plain text list. Use a raw text URL, or switch to a GitHub Raw URL or public Gist instead.';
  }

  if (
    usesProxy &&
    (lowerMessage.includes('all public proxy bridges failed') ||
      lowerMessage.includes('timed out after'))
  ) {
    return 'All public proxy bridges failed to load this Pastebin source. Pastebin support is best-effort, so try again later or use a GitHub Raw URL or public Gist instead.';
  }

  return `Failed to load the list: ${message}`;
}

export async function loadUrlList(
  listUrl: string,
  options: LoadUrlListOptions = {},
): Promise<{
  urls: string[];
  duplicatesRemoved: number;
  normalizedListUrl: string;
}> {
  const normalizedListUrl = normalizeListSourceUrl(listUrl.trim());
  const usesProxy = isPastebinUrl(normalizedListUrl);
  const hostname = getHostnameLabel(normalizedListUrl);
  const { onProgress } = options;

  emitListLoadProgress(onProgress, {
    stage: 'preparing',
    headline: 'Preparing your list',
    detail: `Checking ${hostname} and setting up the request.`,
    progressPercent: 8,
    usesProxy,
    proxyAttempts: [],
  });

  try {
    let text: string;

    if (usesProxy) {
      emitListLoadProgress(onProgress, {
        stage: 'fetching',
        headline: 'Opening the list through a bridge',
        detail:
          'This source often blocks direct browser reads, so the app is trying best-effort public proxy bridges. GitHub Raw and public Gists are more reliable and support offline reuse.',
        progressPercent: 16,
        usesProxy: true,
        proxyAttempts: [],
      });
      text = await fetchWithCorsProxy(normalizedListUrl, onProgress);
    } else {
      emitListLoadProgress(onProgress, {
        stage: 'fetching',
        headline: 'Fetching the text list',
        detail: `Requesting the file directly from ${hostname}.`,
        progressPercent: 26,
        usesProxy: false,
        proxyAttempts: [],
      });
      const response = await fetch(normalizedListUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      text = await response.text();
      emitListLoadProgress(onProgress, {
        stage: 'parsing',
        headline: 'List text received',
        detail: 'Scanning the file for supported X/Twitter and YouTube links.',
        progressPercent: 74,
        usesProxy: false,
        proxyAttempts: [],
      });
    }

    const urls = parseUrlList(text);

    if (urls.length === 0) {
      if (looksLikeHtml(text)) {
        if (looksLikeCloudflareChallenge(text)) {
          throw new Error(
            'Pastebin blocked the request with a Cloudflare challenge.',
          );
        }

        throw new Error(
          'The URL returned HTML instead of a plain text list.',
        );
      }

      throw new Error('No supported X/Twitter or YouTube URLs were found.');
    }

    const deduplicated = deduplicateUrls(urls);
    const postCount = deduplicated.urls.length;
    const duplicateLabel =
      deduplicated.duplicatesRemoved > 0
        ? ` Removed ${deduplicated.duplicatesRemoved} duplicates.`
        : '';

    emitListLoadProgress(onProgress, {
      stage: 'ready',
      headline: `Found ${postCount} supported ${postCount === 1 ? 'post' : 'posts'}`,
      detail: `Starting to load the first batch now.${duplicateLabel}`,
      progressPercent: 100,
      usesProxy,
      proxyAttempts: [],
    });

    return {
      urls: deduplicated.urls,
      duplicatesRemoved: deduplicated.duplicatesRemoved,
      normalizedListUrl,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(formatListFetchError(listUrl, message));
  }
}

function normalizeFxTweet(tweet: RawFxTweet): XPostItem {
  return {
    kind: 'x',
    id: tweet.id,
    sourceUrl: normalizeXCanonicalUrl(tweet.url),
    text: tweet.text ?? '',
    createdAt: tweet.created_at,
    author: {
      name: tweet.author.name,
      handle: tweet.author.screen_name,
      avatarUrl: tweet.author.avatar_url,
    },
    photos:
      tweet.media?.photos?.map((photo) => ({
        url: photo.url,
        width: photo.width,
        height: photo.height,
      })) ?? [],
    videos:
      tweet.media?.videos?.map((video) => ({
        url: video.url,
        thumbnailUrl: video.thumbnail_url,
        duration: video.duration,
        width: video.width,
        height: video.height,
        variants: video.variants.map((variant) => ({
          contentType: variant.content_type,
          url: variant.url,
          bitrate: variant.bitrate,
        })),
      })) ?? [],
    quote: tweet.quote ? normalizeFxTweet(tweet.quote) : undefined,
  };
}

async function fetchYouTubeItem(url: string): Promise<YouTubeItem> {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) {
    throw new Error(`Unsupported YouTube URL: ${url}`);
  }

  const canonicalUrl = normalizeSupportedUrl(url);
  const oembedUrl = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(
    canonicalUrl,
  )}`;

  try {
    const response = await fetch(oembedUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = (await response.json()) as {
      title: string;
      author_name: string;
      author_url: string;
      thumbnail_url: string;
      provider_name: string;
    };

    return {
      kind: 'youtube',
      id: canonicalUrl,
      sourceUrl: canonicalUrl,
      videoId,
      metadata: {
        title: data.title,
        authorName: data.author_name,
        authorUrl: data.author_url,
        thumbnailUrl: data.thumbnail_url,
        providerName: data.provider_name,
      },
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to load video metadata.';

    return {
      kind: 'youtube',
      id: canonicalUrl,
      sourceUrl: canonicalUrl,
      videoId,
      metadata: null,
      metadataError: message,
    };
  }
}

async function fetchXItem(url: string): Promise<XPostItem> {
  const apiUrl = normalizeXApiUrl(url);
  const response = await fetch(apiUrl);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = (await response.json()) as RawFxResponse;
  if (data.code !== 200) {
    throw new Error(data.message || 'Failed to fetch X post.');
  }

  return normalizeFxTweet(data.tweet);
}

export async function fetchFeedItem(url: string): Promise<FeedItem> {
  const contentType = getContentType(url);

  if (contentType === 'twitter') {
    return fetchXItem(url);
  }

  if (contentType === 'youtube') {
    return fetchYouTubeItem(url);
  }

  throw new Error(`Unsupported content URL: ${url}`);
}

export function getBestVideoUrl(variants: XVideoVariant[]): string | undefined {
  const mp4Variants = variants.filter(
    (variant) =>
      variant.contentType === 'video/mp4' && typeof variant.bitrate === 'number',
  );

  if (mp4Variants.length === 0) {
    return variants[0]?.url;
  }

  return [...mp4Variants].sort(
    (a, b) => (b.bitrate ?? 0) - (a.bitrate ?? 0),
  )[0]?.url;
}

export function collectPreviewMedia(items: FeedItem[]): string[] {
  const previewMedia: string[] = [];

  for (const item of items) {
    if (item.kind === 'x') {
      if (item.photos[0]) {
        previewMedia.push(item.photos[0].url);
      } else if (item.videos[0]) {
        previewMedia.push(item.videos[0].thumbnailUrl);
      } else if (item.quote?.photos[0]) {
        previewMedia.push(item.quote.photos[0].url);
      }
    } else if (item.metadata?.thumbnailUrl) {
      previewMedia.push(item.metadata.thumbnailUrl);
    }

    if (previewMedia.length === 3) {
      break;
    }
  }

  return previewMedia;
}
