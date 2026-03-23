'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DEMO_LISTS,
  DEMO_URLS,
  deduplicateUrls,
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
  const [activeSource, setActiveSource] = useState<ActiveSource>({
    kind: 'demo',
    label: 'Built-in demo',
  });

  const commitLoad = useCallback((result: LoadResult) => {
    setUrls(result.urls);
    setDuplicatesRemoved(result.duplicatesRemoved);
    setActiveSource(result.activeSource);
    setError(null);
    setStatus('loaded');
  }, []);

  const loadDemo = useCallback(() => {
    requestIdRef.current += 1;
    const deduplicated = deduplicateUrls(DEMO_URLS);

    commitLoad({
      urls: deduplicated.urls,
      duplicatesRemoved: deduplicated.duplicatesRemoved,
      activeSource: {
        kind: 'demo',
        label: 'Built-in demo',
      },
    });

    setInputUrl('');
    window.history.pushState({}, '', buildListUrl());
  }, [commitLoad]);

  const loadRemoteList = useCallback(
    async (listUrl: string) => {
      const requestId = ++requestIdRef.current;
      setInputUrl(listUrl.trim());
      setStatus('loading');
      setError(null);

      try {
        const result = await loadUrlList(listUrl);
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
        window.history.pushState({}, '', buildListUrl(result.normalizedListUrl));
      } catch (loadError) {
        if (requestId !== requestIdRef.current) {
          return;
        }

        setStatus('error');
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Failed to load the list.',
        );
      }
    },
    [commitLoad],
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
        void loadRemoteList(initialListUrl);
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
    setInputUrl,
    status,
    urls,
    loadDemo,
    loadDemoListUrl,
    loadRemoteList,
  };
}
