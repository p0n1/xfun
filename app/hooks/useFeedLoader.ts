'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { BATCH_SIZE, type FeedItem, fetchFeedItem } from '../lib/content';

type FeedStatus = 'idle' | 'loading' | 'ready' | 'error';

interface BatchResult {
  addedCount: number;
  applied: boolean;
  hasMoreContent: boolean;
}

export function useFeedLoader(sourceUrls: string[]) {
  const requestIdRef = useRef(0);
  const itemsRef = useRef<FeedItem[]>([]);
  const [items, setItems] = useState<FeedItem[]>([]);
  const [status, setStatus] = useState<FeedStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [hasMoreContent, setHasMoreContent] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [stats, setStats] = useState({
    failed: 0,
    successful: 0,
    total: 0,
  });

  const fetchBatch = useCallback(
    async (batchIndex: number, requestId: number): Promise<BatchResult> => {
      const startIndex = batchIndex * BATCH_SIZE;
      const endIndex = Math.min(startIndex + BATCH_SIZE, sourceUrls.length);
      const batchUrls = sourceUrls.slice(startIndex, endIndex);

      if (batchUrls.length === 0) {
        if (requestId === requestIdRef.current) {
          setHasMoreContent(false);
        }

        return {
          addedCount: 0,
          applied: requestId === requestIdRef.current,
          hasMoreContent: false,
        };
      }

      const results = await Promise.allSettled(
        batchUrls.map((url) => fetchFeedItem(url)),
      );

      if (requestId !== requestIdRef.current) {
        return {
          addedCount: 0,
          applied: false,
          hasMoreContent: false,
        };
      }

      const successful = results
        .filter(
          (result): result is PromiseFulfilledResult<FeedItem> =>
            result.status === 'fulfilled',
        )
        .map((result) => result.value);

      const failedCount = results.filter(
        (result) => result.status === 'rejected',
      ).length;

      const existingIds = new Set(itemsRef.current.map((item) => item.id));
      const newItems = successful.filter((item) => !existingIds.has(item.id));

      if (newItems.length > 0) {
        const nextItems = [...itemsRef.current, ...newItems];
        itemsRef.current = nextItems;
        setItems(nextItems);
      }

      setStats((previous) => ({
        ...previous,
        successful: previous.successful + newItems.length,
        failed: previous.failed + failedCount,
      }));

      const hasMore = endIndex < sourceUrls.length;
      setHasMoreContent(hasMore);

      return {
        addedCount: newItems.length,
        applied: true,
        hasMoreContent: hasMore,
      };
    },
    [sourceUrls],
  );

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMoreContent) {
      return;
    }

    const requestId = requestIdRef.current;
    const nextBatch = currentBatch + 1;
    setIsLoadingMore(true);

    try {
      const result = await fetchBatch(nextBatch, requestId);
      if (!result.applied || requestId !== requestIdRef.current) {
        return;
      }

      setCurrentBatch(nextBatch);
    } catch (loadError) {
      if (requestId === requestIdRef.current) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Failed to load more content.',
        );
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoadingMore(false);
      }
    }
  }, [currentBatch, fetchBatch, hasMoreContent, isLoadingMore]);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    itemsRef.current = [];
    setItems([]);
    setCurrentBatch(0);
    setError(null);
    setHasMoreContent(sourceUrls.length > 0);
    setIsLoadingMore(false);
    setStats({
      failed: 0,
      successful: 0,
      total: sourceUrls.length,
    });

    if (sourceUrls.length === 0) {
      setStatus('idle');
      return;
    }

    setStatus('loading');

    const initialize = async () => {
      let batchIndex = 0;

      try {
        while (true) {
          const result = await fetchBatch(batchIndex, requestId);
          if (!result.applied || requestId !== requestIdRef.current) {
            return;
          }

          if (result.addedCount > 0) {
            setCurrentBatch(batchIndex);
            setStatus('ready');
            return;
          }

          if (!result.hasMoreContent) {
            setCurrentBatch(batchIndex);
            setStatus('error');
            setError(
              'Unable to load any posts from this list. Try another list or return to the demo.',
            );
            return;
          }

          batchIndex += 1;
        }
      } catch (loadError) {
        if (requestId === requestIdRef.current) {
          setStatus('error');
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Failed to load content.',
          );
        }
      }
    };

    void initialize();
  }, [fetchBatch, sourceUrls]);

  useEffect(() => {
    const handleScroll = () => {
      if (status === 'loading' || isLoadingMore || !hasMoreContent) {
        return;
      }

      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      if (scrollTop + windowHeight >= documentHeight - 900) {
        void loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMoreContent, isLoadingMore, loadMore, status]);

  return {
    error,
    hasMoreContent,
    isInitialLoading: status === 'loading' && items.length === 0,
    isLoadingMore,
    items,
    loadMore,
    stats,
    status,
  };
}
