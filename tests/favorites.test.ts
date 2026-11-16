import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { FeedItem } from '../app/lib/content';
import { itemKey, parseFavorites, shuffleItems } from '../app/lib/favorites';

const post: FeedItem = {
  kind: 'x', id: '20', sourceUrl: 'https://x.com/jack/status/20',
  text: 'hello', createdAt: '2026-01-01', author: { name: 'Jack', handle: 'jack', avatarUrl: '' },
  photos: [], videos: [],
};
const video: FeedItem = { kind: 'youtube', id: 'url', sourceUrl: 'https://youtu.be/AZ7AcvbebKo', videoId: 'AZ7AcvbebKo', metadata: null };

test('favorites round-trip mixed content, newest first, deduplicated across URL aliases', () => {
  const alias = { ...post, sourceUrl: 'https://twitter.com/renamed/status/20' };
  assert.equal(itemKey(post), itemKey(alias));
  assert.equal(itemKey(video), itemKey({ ...video, id: 'another URL' }));
  const result = parseFavorites(JSON.stringify([
    { item: post, savedAt: 1 }, { item: video, savedAt: 2 }, { item: alias, savedAt: 3 },
  ]));
  assert.deepEqual(result, [{ item: alias, savedAt: 3 }, { item: video, savedAt: 2 }]);
});

test('missing storage is empty; malformed storage is rejected rather than overwritten', () => {
  assert.deepEqual(parseFavorites(null), []);
  for (const raw of ['oops', '{}', '[null]', '[{"savedAt":1,"item":{"kind":"x","id":"20","sourceUrl":"url"}}]']) {
    assert.throws(() => parseFavorites(raw));
  }
});

test('shuffle preserves every item without mutating list and is stable within a round', () => {
  const input = Array.from({ length: 100 }, (_, i) => i);
  const shuffled = shuffleItems(input, 42);
  assert.deepEqual(input, Array.from({ length: 100 }, (_, i) => i));
  assert.equal(new Set(shuffled).size, input.length);
  assert.deepEqual([...shuffled].sort((a, b) => a - b), input);
  assert.deepEqual(shuffleItems(input, 42), shuffled);
  assert.notDeepEqual(shuffled, input);
  assert.notDeepEqual(shuffleItems(input, 43), shuffled);
  assert.deepEqual(shuffleItems([], 42), []);
  assert.deepEqual(shuffleItems(['one'], 42), ['one']);
});
