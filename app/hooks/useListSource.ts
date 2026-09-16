'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DEMO_LISTS,
  DEMO_URLS,
  deduplicateUrls,
  type ListLoadProgress,
  loadUrlList,
} from '../lib/content';
import { buildListPath } from '../utils/urlDetection';

type ListStatus = 'idle' | 'loading' | 'loaded' | 'error';
type HistoryMode = 'push' | 'replace' | 'skip';

interface ActiveSource {
  kind: 'demo' | 'remote';
  label: string;
  url?: string;
}

const DEMO_SOURCE: ActiveSource = { kind: 'demo', label: 'Built-in demo' };

function updateHistory(mode: HistoryMode, listUrl?: string) {
  if (mode === 'skip') return;
  const path = buildListPath(window.location.pathname, listUrl);
  if (path === window.location.pathname + window.location.search) return;
  window.history[mode === 'push' ? 'pushState' : 'replaceState'](null, '', path);
}

export function useListSource() {
  const requestRef = useRef<AbortController | null>(null);
  const [status, setStatus] = useState<ListStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [inputUrl, setInputUrl] = useState('');
  const [urls, setUrls] = useState<string[]>([]);
  const [duplicatesRemoved, setDuplicatesRemoved] = useState(0);
  const [activeSource, setActiveSource] = useState<ActiveSource>(DEMO_SOURCE);
  const [loadingProgress, setLoadingProgress] = useState<ListLoadProgress | null>(null);

  const loadDemo = useCallback((historyMode: HistoryMode = 'push') => {
    requestRef.current?.abort();
    const result = deduplicateUrls(DEMO_URLS);
    setUrls(result.urls);
    setDuplicatesRemoved(result.duplicatesRemoved);
    setActiveSource(DEMO_SOURCE);
    setLoadingProgress(null);
    setError(null);
    setStatus('loaded');
    setInputUrl('');
    updateHistory(historyMode);
  }, []);

  const loadRemoteList = useCallback(async (
    listUrl: string,
    { historyMode = 'push' }: { historyMode?: HistoryMode } = {},
  ) => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    const { signal } = controller;
    const trimmedUrl = listUrl.trim();
    setInputUrl(trimmedUrl);
    setUrls([]);
    setDuplicatesRemoved(0);
    setActiveSource({ kind: 'remote', label: trimmedUrl, url: trimmedUrl });
    setLoadingProgress(null);
    setError(null);
    setStatus('loading');

    try {
      const result = await loadUrlList(trimmedUrl, {
        signal,
        onProgress: (progress) => {
          if (!signal.aborted) setLoadingProgress(progress);
        },
      });
      if (signal.aborted) return;

      setUrls(result.urls);
      setDuplicatesRemoved(result.duplicatesRemoved);
      setActiveSource({
        kind: 'remote',
        label: result.normalizedListUrl,
        url: result.normalizedListUrl,
      });
      setLoadingProgress(null);
      setStatus('loaded');
      setInputUrl(result.normalizedListUrl);
      updateHistory(historyMode, result.normalizedListUrl);
    } catch (loadError) {
      if (signal.aborted) return;
      setLoadingProgress(null);
      setStatus('error');
      setError(loadError instanceof Error ? loadError.message : 'Failed to load the list.');
    }
  }, []);

  useEffect(() => {
    const loadFromLocation = () => {
      const listUrl = new URLSearchParams(window.location.search).get('list');
      if (listUrl) {
        void loadRemoteList(listUrl, { historyMode: 'skip' });
      } else {
        loadDemo('skip');
      }
    };
    const timerId = window.setTimeout(loadFromLocation, 0);
    window.addEventListener('popstate', loadFromLocation);
    return () => {
      window.clearTimeout(timerId);
      window.removeEventListener('popstate', loadFromLocation);
      requestRef.current?.abort();
    };
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
    urls,
    loadDemo,
    loadRemoteList,
  };
}
