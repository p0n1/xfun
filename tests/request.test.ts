import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fetchText } from '../app/lib/request';

const url = 'https://example.com/list.txt';

function stalledBody(signal: AbortSignal) {
  return new Response(new ReadableStream({
    start(controller) {
      signal.addEventListener('abort', () => controller.error(signal.reason), { once: true });
    },
  }));
}

test('timeout covers a stalled body even after successful headers', async (t) => {
  t.mock.method(globalThis, 'fetch', async (_url: string, init: RequestInit) => stalledBody(init.signal!));
  await assert.rejects(fetchText(url, { timeoutMs: 10 }), /Timed out/);
});

test('caller can abort during body download', async (t) => {
  t.mock.method(globalThis, 'fetch', async (_url: string, init: RequestInit) => stalledBody(init.signal!));
  const controller = new AbortController();
  const request = fetchText(url, { timeoutMs: 1000, signal: controller.signal });
  controller.abort();
  await assert.rejects(request, { name: 'AbortError' });
});

test('an already cancelled request never starts fetching', async (t) => {
  const fetchMock = t.mock.method(globalThis, 'fetch');
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(fetchText(url, { timeoutMs: 1000, signal: controller.signal }), { name: 'AbortError' });
  assert.equal(fetchMock.mock.callCount(), 0);
});

test('successful text and HTTP errors keep their normal behavior', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response('hello'));
  assert.equal(await fetchText(url, { timeoutMs: 1000 }), 'hello');
  t.mock.method(globalThis, 'fetch', async () => new Response('', { status: 503, statusText: 'Unavailable' }));
  await assert.rejects(fetchText(url, { timeoutMs: 1000 }), /HTTP 503: Unavailable/);
});
