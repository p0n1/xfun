'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DEMO_LISTS,
  DEMO_URLS,
  deduplicateUrls,
  type ListLoadProgress,
  loadUrlList,
} from '../lib/content';

type ListStatus = 'idle' | 'loading' | 'loaded' | 'error';

interface ActiveSource {
  kind: 'demo' | 'remote';
  label: string;
  url?: string;
}

interface LoadResult {
  urls: string[];
  duplicatesRemoved: number;
  activeSource: ActiveSource;
}

interface LoadRemoteListOptions {
  historyMode?: 'push' | 'replace' | 'skip';
}

const DEMO_SOURCE: ActiveSource = {
  kind: 'demo',
  label: 'Built-in demo',
};

function buildListUrl(listUrl?: string): string {
  const baseUrl = window.location.origin + window.location.pathname;
  if (!listUrl) {
    return baseUrl;
  }

  return `${baseUrl}?list=${listUrl}`;
}

export function useListSource() {
  const requestIdRef = useRef(0);
  const [status, setStatus] = useState<ListStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [inputUrl, setInputUrl] = useState('');
  const [urls, setUrls] = useState<string[]>([]);
  const [duplicatesRemoved, setDuplicatesRemoved] = useState(0);
  const [activeSource, setActiveSource] = useState<ActiveSource>(DEMO_SOURCE);
  const [loadingProgress, setLoadingProgress] = useState<ListLoadProgress | null>(
    null,
  );

  const commitLoad = useCallback((result: LoadResult) => {
    setUrls(result.urls);
    setDuplicatesRemoved(result.duplicatesRemoved);
    setActiveSource(result.activeSource);
    setLoadingProgress(null);
    setError(null);
    setStatus('loaded');
  }, []);

  const clearPendingLoad = useCallback((nextSource: ActiveSource) => {
    setUrls([]);
    setDuplicatesRemoved(0);
    setActiveSource(nextSource);
    setLoadingProgress(null);
    setError(null);
    setStatus('loading');
  }, []);

  const loadDemo = useCallback(() => {
    requestIdRef.current += 1;
    const deduplicated = deduplicateUrls(DEMO_URLS);

    commitLoad({
      urls: deduplicated.urls,
      duplicatesRemoved: deduplicated.duplicatesRemoved,
      activeSource: DEMO_SOURCE,
    });

    setInputUrl('');
    setLoadingProgress(null);
    window.history.pushState({}, '', buildListUrl());
  }, [commitLoad]);

  const loadRemoteList = useCallback(
    async (
      listUrl: string,
      options: LoadRemoteListOptions = {},
    ) => {
      const requestId = ++requestIdRef.current;
      const trimmedUrl = listUrl.trim();
      const historyMode = options.historyMode ?? 'push';
      setInputUrl(trimmedUrl);
      clearPendingLoad({
        kind: 'remote',
        label: trimmedUrl,
        url: trimmedUrl,
      });

      try {
        const result = await loadUrlList(listUrl, {
          onProgress: (nextProgress) => {
            if (requestId === requestIdRef.current) {
              setLoadingProgress(nextProgress);
            }
          },
        });
        if (requestId !== requestIdRef.current) {
          return;
        }

        commitLoad({
          urls: result.urls,
          duplicatesRemoved: result.duplicatesRemoved,
          activeSource: {
            kind: 'remote',
            label: result.normalizedListUrl,
            url: result.normalizedListUrl,
          },
        });

        setInputUrl(result.normalizedListUrl);
        if (historyMode === 'replace') {
          window.history.replaceState({}, '', buildListUrl(result.normalizedListUrl));
        } else if (historyMode === 'push') {
          window.history.pushState({}, '', buildListUrl(result.normalizedListUrl));
        }
      } catch (loadError) {
        if (requestId !== requestIdRef.current) {
          return;
        }

        setLoadingProgress(null);
        setStatus('error');
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Failed to load the list.',
        );
      }
    },
    [clearPendingLoad, commitLoad],
  );

  const loadDemoListUrl = useCallback(
    async (listUrl: string) => {
      setInputUrl(listUrl);
      await loadRemoteList(listUrl);
    },
    [loadRemoteList],
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialListUrl = params.get('list');
    const timerId = window.setTimeout(() => {
      if (initialListUrl) {
        void loadRemoteList(initialListUrl, { historyMode: 'replace' });
        return;
      }

      loadDemo();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [loadDemo, loadRemoteList]);

  return {
    activeSource,
    demoLists: DEMO_LISTS,
    duplicatesRemoved,
    error,
    inputUrl,
    isLoading: status === 'loading',
    loadingProgress,
    setInputUrl,
    status,
    urls,
    loadDemo,
    loadDemoListUrl,
    loadRemoteList,
  };
}
