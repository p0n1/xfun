'use client';

import { type FormEvent, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import FeedControl from './components/FeedControl';
import DynamicManifest from './components/DynamicManifest';
import ListLoadingPanel from './components/ListLoadingPanel';
import Reveal from './components/Reveal';
import ScrollToTop from './components/ScrollToTop';
import XPostCard from './components/XPostCard';
import YouTubeCard from './components/YouTubeCard';
import { useFavorites } from './hooks/useFavorites';
import { itemKey, shuffleItems } from './lib/favorites';
import { useFeedLoader } from './hooks/useFeedLoader';
import { useListSource } from './hooks/useListSource';
import { usePwaState } from './hooks/usePwaState';
import { normalizeListSourceUrl } from './utils/urlDetection';

export default function Home() {
  const {
    activeSource,
    demoLists,
    duplicatesRemoved,
    error: listError,
    inputUrl,
    isLoading: isLoadingList,
    loadingProgress,
    setInputUrl,
    urls,
    loadDemo,
    loadRemoteList,
    loadPastedList,
  } = useListSource();
  const [view, setView] = useState<'list' | 'favorites'>('list');
  const [randomSeed, setRandomSeed] = useState<number | null>(null);
  const feedTopRef = useRef<HTMLDivElement>(null);
  const orderedUrls = useMemo(() => randomSeed === null ? urls : shuffleItems(urls, randomSeed), [urls, randomSeed]);
  const { favorites, keys: favoriteKeys, toggleFavorite, error: favoritesError } = useFavorites();
  const {
    error: feedError,
    hasMoreContent,
    isInitialLoading,
    isLoadingMore,
    items,
    loadMore,
    loadMoreRef,
    stats,
  } = useFeedLoader(orderedUrls, view === 'list');
  const displayedItems = view === 'favorites' ? favorites.map(entry => entry.item) : items;
  const shuffleFeed = () => {
    setRandomSeed(Math.floor(Math.random() * 4294967296));
    feedTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const { canInstall, installApp, isOnline } = usePwaState();
  const [showCustomList, setShowCustomList] = useState(false);
  const [installMessage, setInstallMessage] = useState('');
  const [pastedText, setPastedText] = useState('');

  let originalListUrl: string | undefined;
  try {
    if (activeSource.url) originalListUrl = normalizeListSourceUrl(activeSource.url);
  } catch {
    // Invalid list sources must not become clickable links.
  }

  const feedProgressPercent =
    stats.total > 0 ? Math.round((stats.processed / stats.total) * 100) : 0;
  const headerProgressPercent = isLoadingList
    ? loadingProgress?.progressPercent ?? 8
    : feedProgressPercent;
  const currentStatusHeadline = isLoadingList
    ? loadingProgress?.headline ?? 'Preparing your list'
    : activeSource.kind === 'remote' && activeSource.url
      ? activeSource.url
      : activeSource.label;
  const currentStatusDetail = isLoadingList
    ? loadingProgress?.detail ?? 'Checking the source and getting links ready.'
    : 'Use GitHub Raw URLs or public Gists for the most reliable loading and offline reuse. Public Pastebin links are best-effort through proxy bridges. One supported URL per line, with inline comments allowed after each URL.';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!inputUrl.trim()) {
      return;
    }

    await loadRemoteList(inputUrl);
  };

  const handleInstall = async () => {
    const installed = await installApp();
    if (installed) {
      setInstallMessage('App installed.');
      window.setTimeout(() => setInstallMessage(''), 2400);
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top,_rgba(125,211,252,0.45),_transparent_28%),linear-gradient(180deg,_#f8fbff_0%,_#fdf8f2_48%,_#ffffff_100%)]">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[8%] top-16 h-40 w-40 rounded-full bg-sky-200/40 blur-3xl" />
        <div className="absolute right-[12%] top-32 h-48 w-48 rounded-full bg-amber-200/35 blur-3xl" />
        <div className="absolute bottom-16 left-1/3 h-44 w-44 rounded-full bg-fuchsia-200/25 blur-3xl" />
      </div>

      <DynamicManifest listUrl={activeSource.url} />
      <main className="relative">
        <section className="px-4 pb-5 pt-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl rounded-[2.25rem] border border-white/70 bg-white/80 px-5 py-6 shadow-[0_24px_80px_rgba(148,163,184,0.16)] backdrop-blur-sm sm:px-6 sm:py-7">
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center gap-3">
                <Image
                  src="/icon.svg"
                  alt="X Fun"
                  width={42}
                  height={42}
                  className="h-10 w-10 rounded-xl"
                />
                <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                  X Fun
                </h1>
              </div>
              <p className="mt-3 max-w-2xl text-base text-slate-500 sm:text-lg">
                Fun and engaging content for curious minds
              </p>
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 text-sky-600" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 7v5h-5M4 17v-5h5" />
                  <path d="M6.1 7a7 7 0 0 1 11.5-1L20 9M4 15l2.4 3A7 7 0 0 0 17.9 17" />
                </svg>
                Refresh
              </button>
              <button
                type="button"
                onClick={() => loadDemo()}
                className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Built-in demo
              </button>
              {demoLists[0] ? (
                <button
                  type="button"
                  onClick={() => void loadRemoteList(demoLists[0].url)}
                  className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Try examples
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setShowCustomList((value) => !value)}
                className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                {showCustomList ? 'Hide custom list' : 'Custom list'}
              </button>
            </div>

            {showCustomList ? (
              <form onSubmit={handleSubmit} className="mx-auto mt-5 max-w-3xl space-y-3">
                <input
                  type="url"
                  aria-label="Public text-file URL"
                  value={inputUrl}
                  onChange={(event) => setInputUrl(event.target.value)}
                  placeholder="Public text-file URL"
                  disabled={isLoadingList}
                  className="w-full rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-70"
                />
                <div className="flex flex-wrap justify-center gap-3">
                  <button
                    type="submit"
                    disabled={!inputUrl.trim() || isLoadingList}
                    className="rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    {isLoadingList ? 'Loading list...' : 'Load list'}
                  </button>
                  {canInstall ? (
                    <button
                      type="button"
                      onClick={handleInstall}
                      className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      Install app
                    </button>
                  ) : null}
                </div>
                {installMessage ? (
                  <p className="text-center text-sm text-sky-700">{installMessage}</p>
                ) : null}
              </form>
            ) : null}

            <details className="mx-auto mt-5 max-w-4xl text-center">
              <summary className="cursor-pointer list-none text-sm text-slate-400 transition hover:text-slate-600">
                Details
              </summary>
              <div className="mt-3 space-y-3 rounded-[1.5rem] border border-slate-100 bg-slate-50/80 px-4 py-4 text-left text-sm leading-6 text-slate-600">
                <p className="break-all">{currentStatusHeadline}</p>
                <div className="h-2 overflow-hidden rounded-full bg-white">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-400 via-cyan-300 to-amber-300 transition-all duration-500"
                    style={{ width: `${headerProgressPercent}%` }}
                  />
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-1">
                  {isLoadingList ? (
                    <>
                      <span>{headerProgressPercent}% ready</span>
                      <span>
                        {loadingProgress?.usesProxy
                          ? 'Using best-effort proxy bridges'
                          : 'Using a direct browser request'}
                      </span>
                      {loadingProgress?.proxyAttempts.length ? (
                        <span>
                          {
                            loadingProgress.proxyAttempts.filter(
                              (attempt) => attempt.status === 'failed',
                            ).length
                          }{' '}
                          retries so far
                        </span>
                      ) : null}
                    </>
                  ) : (
                    <>
                      <span>{stats.successful} loaded</span>
                      <span>{stats.failed} failed</span>
                      <span>{duplicatesRemoved} duplicates removed</span>
                      <span>{feedProgressPercent}% processed</span>
                    </>
                  )}
                  {!isOnline ? <span>Offline cache mode</span> : null}
                </div>
                <p>{currentStatusDetail}</p>
              </div>
            </details>
          </div>

          {listError ? (
            <Reveal className="mx-auto mt-4 max-w-6xl">
              <div className="rounded-[2rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm leading-6 text-rose-700">
                <p role="alert" className="break-words">{listError}</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {originalListUrl ? (
                    <>
                      <button type="button" className="underline" onClick={() => void loadRemoteList(originalListUrl!)}>
                        Retry list
                      </button>
                      <a className="underline" href={originalListUrl} target="_blank" rel="noopener noreferrer">
                        Open original list
                      </a>
                    </>
                  ) : null}
                </div>
                <form className="mt-4" onSubmit={(event) => {
                  event.preventDefault();
                  loadPastedList(pastedText);
                }}>
                  <label htmlFor="pasted-list" className="block font-medium">Paste list contents</label>
                  <p id="pasted-list-help" className="mt-1">Copy the text from your original list. Imported links stay in this session only.</p>
                  <textarea
                    id="pasted-list"
                    aria-describedby="pasted-list-help"
                    value={pastedText}
                    onChange={(event) => setPastedText(event.target.value)}
                    rows={5}
                    placeholder="One X/Twitter or YouTube URL per line"
                    className="mt-2 block w-full min-w-0 rounded-xl border border-rose-200 bg-white p-3 text-slate-800"
                  />
                  <button type="submit" disabled={!pastedText.trim()} className="mt-3 rounded-full border border-rose-200 bg-white px-4 py-2 font-medium disabled:opacity-50">
                    Load pasted list
                  </button>
                </form>
              </div>
            </Reveal>
          ) : null}

          {view === 'list' && feedError ? (
            <Reveal className="mx-auto mt-4 max-w-6xl">
              <div className="rounded-[2rem] border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-800">
                {feedError}
              </div>
            </Reveal>
          ) : null}
        </section>

        <section className="px-4 pb-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div ref={feedTopRef} className="mb-5 flex scroll-mt-4 flex-wrap items-center justify-between gap-3">
              <div className="flex gap-2 rounded-[1.5rem] bg-slate-100/80 p-2" role="group" aria-label="Content view">
                <FeedControl icon="list" label="List" selected={view === 'list'} onClick={() => setView('list')} />
                <FeedControl icon="favorites" label="Favorites" count={favorites.length} selected={view === 'favorites'} onClick={() => setView('favorites')} />
              </div>
              {view === 'list' ? (
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex gap-2 rounded-[1.5rem] bg-slate-100/80 p-2" role="group" aria-label="Browsing order">
                    <FeedControl icon="order" label="In order" selected={randomSeed === null} onClick={() => setRandomSeed(null)} />
                    <FeedControl icon="random" label="Random" selected={randomSeed !== null} onClick={() => { if (randomSeed === null) shuffleFeed(); }} />
                  </div>
                  {randomSeed !== null ? <FeedControl icon="reshuffle" label="Shuffle again" onClick={shuffleFeed} /> : null}
                </div>
              ) : <p className="text-sm text-slate-500">Saved on this browser · Newest first</p>}
            </div>
            {favoritesError ? <p role="alert" className="mb-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">{favoritesError}</p> : null}
            {view === 'favorites' && favorites.length === 0 ? (
              <div className="rounded-[2rem] bg-white/80 px-6 py-10 text-center text-slate-500">No favorites yet. Tap the star on any post or video to save it here.</div>
            ) : null}
            {view === 'list' && isLoadingList ? (
              <ListLoadingPanel
                progress={loadingProgress}
                sourceLabel={activeSource.url ?? activeSource.label}
              />
            ) : null}

            {view === 'list' && isInitialLoading ? (
              <div className="grid gap-5">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/70 p-6 shadow-[0_18px_70px_rgba(148,163,184,0.12)]"
                  >
                    <div className="h-5 w-28 animate-pulse rounded-full bg-slate-100" />
                    <div className="mt-4 h-8 w-3/4 animate-pulse rounded-full bg-slate-100" />
                    <div className="mt-3 h-40 animate-pulse rounded-[1.5rem] bg-slate-100" />
                  </div>
                ))}
              </div>
            ) : null}

            <div className="grid gap-5">
              {displayedItems.map((item) => (
                <Reveal key={`${view}:${itemKey(item)}`}>
                  {item.kind === 'x' ? (
                    <XPostCard item={item} saved={favoriteKeys.has(itemKey(item))} onToggleFavorite={() => toggleFavorite(item)} />
                  ) : (
                    <YouTubeCard item={item} saved={favoriteKeys.has(itemKey(item))} onToggleFavorite={() => toggleFavorite(item)} />
                  )}
                </Reveal>
              ))}
            </div>

            {view === 'list' && !isLoadingList && !isInitialLoading && items.length === 0 && !listError && !feedError ? (
              <div className="rounded-[2rem] border border-white/70 bg-white/80 px-6 py-10 text-center text-slate-500 shadow-[0_18px_70px_rgba(148,163,184,0.12)]">
                No supported posts were loaded yet.
              </div>
            ) : null}

            <div ref={loadMoreRef} aria-hidden="true" />

            {view === 'list' && isLoadingMore ? (
              <div className="flex justify-center py-8">
                <div className="rounded-full border border-white/70 bg-white/80 px-5 py-3 text-sm text-slate-600 shadow-sm">
                  Loading more from the list...
                </div>
              </div>
            ) : null}

            {view === 'list' && !isInitialLoading && !isLoadingMore && hasMoreContent && items.length > 0 ? (
              <div className="flex justify-center py-10">
                <button
                  type="button"
                  onClick={() => void loadMore()}
                  className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Load more
                </button>
              </div>
            ) : null}
          </div>
        </section>
      </main>

      <ScrollToTop />
    </div>
  );
}
