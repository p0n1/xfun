'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { BATCH_SIZE, type FeedItem, fetchFeedItem } from '../lib/content';

interface FeedState {
  sourceUrls: string[];
  items: FeedItem[];
  processed: number;
  failed: number;
  loading: boolean;
}

interface FeedSession {
  controller: AbortController;
  nextIndex: number;
  loading: boolean;
  items: FeedItem[];
  seen: Set<string>;
  failed: number;
}

function createFeedState(sourceUrls: string[]): FeedState {
  return { sourceUrls, items: [], processed: 0, failed: 0, loading: sourceUrls.length > 0 };
}

export function useFeedLoader(sourceUrls: string[]) {
  const sessionRef = useRef<FeedSession | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [feed, setFeed] = useState(() => createFeedState(sourceUrls));

  if (feed.sourceUrls !== sourceUrls) {
    setFeed(createFeedState(sourceUrls));
  }

  const loadMore = useCallback(async () => {
    const session = sessionRef.current;
    if (!session || session.controller.signal.aborted || session.loading || session.nextIndex >= sourceUrls.length) return;
    // A ref locks synchronously, including scroll and button events in the same frame.
    session.loading = true;
    const { signal } = session.controller;
    if (session.nextIndex > 0) {
      setFeed((previous) => ({ ...previous, loading: true }));
    }

    try {
      do {
        const batch = sourceUrls.slice(session.nextIndex, session.nextIndex + BATCH_SIZE);
        const results = await Promise.allSettled(batch.map((url) => fetchFeedItem(url, signal)));
        if (signal.aborted) return;
        session.nextIndex += batch.length;
        const added: FeedItem[] = [];
        for (const result of results) {
          if (result.status === 'rejected') {
            session.failed += 1;
            continue;
          }
          const item = result.value;
          const key = `${item.kind}:${item.id}`;
          if (!session.seen.has(key)) {
            session.seen.add(key);
            added.push(item);
          }
        }
        session.items = [...session.items, ...added];
        if (added.length > 0) break;
        // Skip unavailable batches so the user is not left with an empty feed.
      } while (session.nextIndex < sourceUrls.length);
    } finally {
      session.loading = false;
      if (!signal.aborted) {
        setFeed({
          sourceUrls,
          items: session.items,
          processed: session.nextIndex,
          failed: session.failed,
          loading: false,
        });
      }
    }
  }, [sourceUrls]);

  useEffect(() => {
    const controller = new AbortController();
    sessionRef.current = {
      controller, nextIndex: 0, loading: false, items: [], seen: new Set(), failed: 0,
    };
    void loadMore();
    return () => controller.abort();
  }, [loadMore, sourceUrls]);

  const hasMoreContent = feed.processed < sourceUrls.length;

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || feed.loading || !hasMoreContent) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) void loadMore();
    }, { rootMargin: '900px 0px' });
    observer.observe(node);
    return () => observer.disconnect();
  }, [feed.loading, hasMoreContent, loadMore]);

  return {
    error: !feed.loading && sourceUrls.length > 0 && !hasMoreContent && feed.items.length === 0
      ? 'Unable to load any posts from this list. Try another list or return to the demo.'
      : null,
    hasMoreContent,
    isInitialLoading: feed.loading && feed.items.length === 0,
    isLoadingMore: feed.loading && feed.items.length > 0,
    items: feed.items,
    loadMore,
    loadMoreRef,
    stats: {
      failed: feed.failed,
      successful: feed.items.length,
      processed: feed.processed,
      total: sourceUrls.length,
    },
  };
}
