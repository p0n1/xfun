import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  deduplicateUrls, fetchFeedItem, getBestVideoUrl, loadUrlList, parseUrlList,
} from '../app/lib/content';
import {
  buildListPath, extractYouTubeVideoId, isXUrl, normalizeListSourceUrl,
} from '../app/utils/urlDetection';
import mixedMedia from '../fxtwitter_examlpes/api_fxtwitter_response.1.json';
import photoPost from '../fxtwitter_examlpes/api_fxtwitter_response.2.json';

const youtube = 'https://www.youtube.com/watch?v=AZ7AcvbebKo';
const x = 'https://x.com/jack/status/20';

test('parses both X hosts, HTTP, comments, and YouTube query parameters', () => {
  assert.deepEqual(parseUrlList(`
    # a comment
    // another comment
    http://twitter.com/jack/status/20?s=20 # note
    https://www.x.com/SpaceX/status/123/photo/1
    https://youtu.be/AZ7AcvbebKo?t=4 # note
    https://www.youtube.com/watch?feature=share&v=AZ7AcvbebKo
    This prose is not a list entry: ${youtube}
    https://example.com/?url=${youtube}
  `), [x, 'https://x.com/SpaceX/status/123', youtube, youtube]);
});

test('rejects malformed IDs and unrelated hosts', () => {
  assert.equal(isXUrl(`${x}oops`), false);
  assert.equal(isXUrl('https://x.com.evil.test/jack/status/20'), false);
  assert.equal(extractYouTubeVideoId(`${youtube}x`), null);
  assert.equal(extractYouTubeVideoId(`https://example.com/?next=${youtube}`), null);
});

test('deduplicates X by status ID, including changed handles, and YouTube aliases', () => {
  assert.deepEqual(deduplicateUrls([
    x, 'https://twitter.com/JACK/status/20?s=20', 'https://x.com/renamed/status/20',
    youtube, 'https://youtu.be/AZ7AcvbebKo',
  ]), { urls: [x, youtube], duplicatesRemoved: 3 });
});

test('list links round-trip nested query parameters, plus signs and fragments', () => {
  const list = 'https://example.com/list.txt?key=a+b&view=raw#section';
  const url = new URL(buildListPath('/', list), 'https://xfun.test');
  assert.equal(url.searchParams.get('list'), list);
  assert.equal(buildListPath('/'), '/');
});

test('normalizes Pastebin and rejects non-HTTP list sources', () => {
  assert.equal(normalizeListSourceUrl('https://pastebin.com/TESTONLY'), 'https://pastebin.com/raw/TESTONLY');
  assert.equal(normalizeListSourceUrl('https://pastebin.com/raw/TESTONLY'), 'https://pastebin.com/raw/TESTONLY');
  assert.throws(() => normalizeListSourceUrl('data:text/plain,hello'), /HTTP/);
});

test('selects highest-bitrate MP4 without mutation and never labels HLS as MP4', () => {
  const variants = [
    { contentType: 'application/x-mpegURL', url: 'playlist.m3u8' },
    { contentType: 'video/mp4', url: 'small.mp4', bitrate: 500 },
    { contentType: 'video/mp4', url: 'large.mp4', bitrate: 5000 },
    { contentType: 'video/mp4', url: 'unknown.mp4' },
  ];
  const before = structuredClone(variants);
  assert.equal(getBestVideoUrl(variants), 'large.mp4');
  assert.deepEqual(variants, before);
  assert.equal(getBestVideoUrl([variants[0], variants[3]]), 'unknown.mp4');
  assert.equal(getBestVideoUrl([variants[0]]), undefined);
  assert.equal(getBestVideoUrl([]), undefined);
});

test('normalizes the supplied FxEmbed fixtures, including quotes and mixed media', async (t) => {
  for (const fixture of [mixedMedia, photoPost]) {
    t.mock.method(globalThis, 'fetch', async () => Response.json(fixture));
    const item = await fetchFeedItem(x);
    assert.equal(item.kind, 'x');
    if (item.kind !== 'x') return;
    assert.equal(item.id, fixture.tweet.id);
    assert.equal(item.photos.length, fixture.tweet.media?.photos?.length ?? 0);
    assert.equal(item.quote?.id, 'quote' in fixture.tweet ? fixture.tweet.quote.id : undefined);
  }
});

test('video without variants does not discard the whole X post', async (t) => {
  const tweet = {
    id: '20', url: x, text: 'video', created_at: '2026-01-01',
    author: { name: 'Test', screen_name: 'test', avatar_url: 'https://example.com/avatar.png' },
    media: { videos: [{ url: 'https://example.com/video.mp4', width: 640, height: 360 }] },
  };
  t.mock.method(globalThis, 'fetch', async () => Response.json({ code: 200, tweet }));
  const item = await fetchFeedItem(x);
  assert.equal(item.kind, 'x');
  if (item.kind !== 'x') return;
  assert.deepEqual(item.videos[0].variants, []);
  assert.equal(item.videos[0].url, tweet.media.videos[0].url);
});

test('YouTube metadata failure preserves the playable item', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response('', { status: 404 }));
  const item = await fetchFeedItem(youtube);
  assert.equal(item.kind, 'youtube');
  if (item.kind !== 'youtube') return;
  assert.equal(item.videoId, 'AZ7AcvbebKo');
  assert.equal(item.metadata, null);
  assert.match(item.metadataError ?? '', /404/);
});

test('loads and deduplicates a direct list, preserving progress snapshots', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response(`${x}\n${x}\n${youtube}`));
  const stages: string[] = [];
  const result = await loadUrlList('https://example.com/list.txt', {
    onProgress: (progress) => stages.push(progress.stage),
  });
  assert.deepEqual(result.urls, [x, youtube]);
  assert.equal(result.duplicatesRemoved, 1);
  assert.deepEqual(stages, ['preparing', 'fetching', 'parsing', 'ready']);
});

test('Pastebin retries HTML challenges and returns the next proxy response', async (t) => {
  const requests: string[] = [];
  const snapshots: string[][] = [];
  t.mock.method(globalThis, 'fetch', async (url: string) => {
    requests.push(url);
    return new Response(requests.length === 1 ? '<html>Cloudflare challenge</html>' : x);
  });
  const result = await loadUrlList('https://pastebin.com/raw/TESTONLY', {
    onProgress: (progress) => snapshots.push(progress.proxyAttempts.map((attempt) => attempt.status)),
  });
  assert.equal(requests.length, 2);
  assert.equal(new URL(requests[0]).searchParams.get('quest'), 'https://pastebin.com/raw/TESTONLY');
  assert.deepEqual(result.urls, [x]);
  assert.ok(snapshots.some((snapshot) => snapshot.join() === 'failed,success'));
});

test('cancelled proxy requests do not try another bridge', async (t) => {
  const controller = new AbortController();
  const fetchMock = t.mock.method(globalThis, 'fetch', async () => {
    controller.abort();
    throw controller.signal.reason;
  });
  await assert.rejects(loadUrlList('https://pastebin.com/raw/TESTONLY', {
    signal: controller.signal,
  }), { name: 'AbortError' });
  assert.equal(fetchMock.mock.callCount(), 1);
});

test('YouTube cancellation is not swallowed as a metadata failure', async (t) => {
  const controller = new AbortController();
  t.mock.method(globalThis, 'fetch', async () => {
    controller.abort();
    throw controller.signal.reason;
  });
  await assert.rejects(fetchFeedItem(youtube, controller.signal), { name: 'AbortError' });
});

test('empty and HTML list responses fail with useful messages', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response('<html>not a list</html>'));
  await assert.rejects(loadUrlList('https://example.com/list'), /HTML instead/);
  t.mock.method(globalThis, 'fetch', async () => new Response('# no links'));
  await assert.rejects(loadUrlList('https://example.com/list'), /No supported/);
});
