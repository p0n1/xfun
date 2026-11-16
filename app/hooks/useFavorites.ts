'use client';

import { useMemo, useState, useSyncExternalStore } from 'react';
import type { FeedItem } from '../lib/content';
import { itemKey, parseFavorites } from '../lib/favorites';

const STORAGE_KEY = 'xfun:favorites:v1';
const CHANGE_EVENT = 'xfun:favorites-changed';
const UNAVAILABLE = '__unavailable__';

function readSnapshot() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return UNAVAILABLE;
  }
}

function subscribe(onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) onChange();
  };
  window.addEventListener('storage', onStorage);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

export function useFavorites() {
  const raw = useSyncExternalStore(subscribe, readSnapshot, () => null);
  const [writeError, setWriteError] = useState<string | null>(null);
  const { favorites, readError } = useMemo(() => {
    try {
      return { favorites: parseFavorites(raw), readError: null };
    } catch {
      return { favorites: [], readError: 'Local favorites could not be read. Check that browser storage is available.' };
    }
  }, [raw]);
  const keys = useMemo(() => new Set(favorites.map(({ item }) => itemKey(item))), [favorites]);

  const toggleFavorite = (item: FeedItem) => {
    try {
      // Read the latest value to preserve changes made in another tab.
      const current = parseFavorites(localStorage.getItem(STORAGE_KEY));
      const key = itemKey(item);
      const next = current.some(entry => itemKey(entry.item) === key)
        ? current.filter(entry => itemKey(entry.item) !== key)
        : [{ item, savedAt: Date.now() }, ...current];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setWriteError(null);
      window.dispatchEvent(new Event(CHANGE_EVENT));
    } catch {
      setWriteError('Could not save this change. Browser storage may be full or unavailable.');
    }
  };

  return { favorites, keys, toggleFavorite, error: writeError ?? readError };
}
