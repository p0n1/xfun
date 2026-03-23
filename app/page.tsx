'use client';

import { type FormEvent, type ReactNode, useState } from 'react';
import Image from 'next/image';
import Reveal from './components/Reveal';
import ScrollToTop from './components/ScrollToTop';
import XPostCard from './components/XPostCard';
import YouTubeCard from './components/YouTubeCard';
import { useFeedLoader } from './hooks/useFeedLoader';
import { useListSource } from './hooks/useListSource';
import { usePwaState } from './hooks/usePwaState';
import { collectPreviewMedia } from './lib/content';

function StatusPill({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'online' | 'offline' | 'accent';
}) {
  const toneClassName =
    tone === 'online'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : tone === 'offline'
        ? 'border-amber-200 bg-amber-50 text-amber-700'
        : tone === 'accent'
          ? 'border-sky-200 bg-sky-50 text-sky-700'
          : 'border-white/60 bg-white/65 text-slate-700';

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${toneClassName}`}
    >
      {children}
    </span>
  );
}

function HeroPreview({ images }: { images: string[] }) {
  if (images.length === 0) {
    return (
      <div className="grid h-full min-h-[20rem] grid-cols-2 gap-3 rounded-[2.5rem] border border-white/60 bg-white/40 p-4 backdrop-blur">
        <div className="rounded-[1.75rem] bg-gradient-to-br from-sky-200 via-cyan-100 to-white" />
        <div className="rounded-[1.75rem] bg-gradient-to-br from-yellow-100 via-orange-100 to-rose-100" />
        <div className="rounded-[1.75rem] bg-gradient-to-br from-violet-100 via-fuchsia-100 to-white" />
        <div className="flex items-end rounded-[1.75rem] bg-slate-900 p-5 text-white">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-sky-200">
              Curiosity reel
            </p>
            <p className="mt-2 max-w-[14rem] text-xl font-semibold leading-tight">
              Photos and videos land here without the X timeline clutter.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-[20rem] grid-cols-2 gap-3 rounded-[2.5rem] border border-white/60 bg-white/40 p-4 backdrop-blur">
      {images.slice(0, 3).map((imageUrl, index) => (
        <div
          key={imageUrl}
          className={`relative overflow-hidden rounded-[1.75rem] ${
            index === 0 ? 'row-span-2' : ''
          }`}
        >
          <Image
            src={imageUrl}
            alt="Preview from the current feed"
            fill
            sizes="(min-width: 1024px) 24rem, 50vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 via-transparent to-transparent" />
        </div>
      ))}
      {images.length === 1 ? (
        <div className="rounded-[1.75rem] bg-gradient-to-br from-sky-100 to-white" />
      ) : null}
    </div>
  );
}

export default function Home() {
  const {
    activeSource,
    demoLists,
    duplicatesRemoved,
    error: listError,
    inputUrl,
    isLoading: isLoadingList,
    setInputUrl,
    urls,
    loadDemo,
    loadDemoListUrl,
    loadRemoteList,
  } = useListSource();
  const {
    error: feedError,
    hasMoreContent,
    isInitialLoading,
    isLoadingMore,
    items,
    loadMore,
    stats,
  } = useFeedLoader(urls);
  const { canInstall, installApp, isOnline, isStandalone } = usePwaState();
  const [shareMessage, setShareMessage] = useState('');
  const previewMedia = collectPreviewMedia(items);
  const processedCount = stats.successful + stats.failed;
  const progressPercent =
    stats.total > 0 ? Math.round((processedCount / stats.total) * 100) : 0;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!inputUrl.trim()) {
      return;
    }

    await loadRemoteList(inputUrl);
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'X Fun',
          text: 'A curated feed of X posts and videos.',
          url: shareUrl,
        });
        setShareMessage('Shared.');
        return;
      }

      await navigator.clipboard.writeText(shareUrl);
      setShareMessage('Link copied.');
    } catch {
      setShareMessage('Share was canceled.');
    } finally {
      window.setTimeout(() => setShareMessage(''), 2400);
    }
  };

  const handleInstall = async () => {
    const installed = await installApp();
    if (installed) {
      setShareMessage('App installed.');
      window.setTimeout(() => setShareMessage(''), 2400);
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top,_rgba(125,211,252,0.45),_transparent_28%),linear-gradient(180deg,_#f8fbff_0%,_#fdf8f2_48%,_#ffffff_100%)]">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[8%] top-16 h-40 w-40 rounded-full bg-sky-200/40 blur-3xl" />
        <div className="absolute right-[12%] top-32 h-48 w-48 rounded-full bg-amber-200/35 blur-3xl" />
        <div className="absolute bottom-16 left-1/3 h-44 w-44 rounded-full bg-fuchsia-200/25 blur-3xl" />
      </div>

      <main className="relative">
        <section className="px-4 pb-10 pt-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="rounded-[2.75rem] border border-white/70 bg-white/35 p-4 shadow-[0_30px_90px_rgba(148,163,184,0.16)] backdrop-blur-md sm:p-6 lg:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 shadow-lg">
                    <Image
                      src="/icon.svg"
                      alt="X Fun"
                      width={28}
                      height={28}
                      className="h-7 w-7"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
                      X Fun
                    </p>
                    <p className="text-sm text-slate-500">
                      Curated posts for curious kids.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <StatusPill tone={isOnline ? 'online' : 'offline'}>
                    {isOnline ? 'Online' : 'Offline cache mode'}
                  </StatusPill>
                  {activeSource.kind === 'remote' ? (
                    <StatusPill tone="accent">Shared list</StatusPill>
                  ) : (
                    <StatusPill>Built-in demo</StatusPill>
                  )}
                  {isStandalone ? (
                    <StatusPill>Installed app</StatusPill>
                  ) : null}
                </div>
              </div>

              <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] lg:items-center">
                <div className="max-w-2xl">
                  <Reveal>
                    <p className="text-sm font-semibold uppercase tracking-[0.26em] text-sky-700">
                      Mixed media, quieter browsing
                    </p>
                    <h1 className="mt-4 max-w-xl text-4xl font-semibold leading-[1.02] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                      A calmer way to watch the most interesting corners of X.
                    </h1>
                    <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
                      Load a public text file of X or YouTube links and let the browser
                      play the photos and videos directly, without the noisy feed around
                      them.
                    </p>
                  </Reveal>

                  <Reveal className="mt-8">
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-slate-700">
                          Public text-file URL
                        </span>
                        <input
                          type="url"
                          value={inputUrl}
                          onChange={(event) => setInputUrl(event.target.value)}
                          placeholder="https://raw.githubusercontent.com/.../list.txt"
                          disabled={isLoadingList}
                          className="w-full rounded-[1.5rem] border border-slate-200 bg-white/80 px-5 py-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-70"
                        />
                      </label>

                      <div className="flex flex-wrap gap-3">
                        <button
                          type="submit"
                          disabled={!inputUrl.trim() || isLoadingList}
                          className="rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                        >
                          {isLoadingList ? 'Loading list...' : 'Load list'}
                        </button>
                        <button
                          type="button"
                          onClick={loadDemo}
                          className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                        >
                          Built-in demo
                        </button>
                        <button
                          type="button"
                          onClick={handleShare}
                          className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                        >
                          Share this view
                        </button>
                        {canInstall ? (
                          <button
                            type="button"
                            onClick={handleInstall}
                            className="rounded-full border border-sky-200 bg-sky-50 px-5 py-3 text-sm font-medium text-sky-700 transition hover:border-sky-300 hover:bg-sky-100"
                          >
                            Install app
                          </button>
                        ) : null}
                      </div>
                    </form>

                    {shareMessage ? (
                      <p className="mt-3 text-sm text-sky-700">{shareMessage}</p>
                    ) : null}
                  </Reveal>

                  <Reveal className="mt-8">
                    <div className="flex flex-wrap gap-3">
                      {demoLists.map((demo) => (
                        <button
                          key={demo.url}
                          type="button"
                          onClick={() => void loadDemoListUrl(demo.url)}
                          className="group rounded-[1.5rem] border border-white/70 bg-white/65 px-4 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
                        >
                          <p className="text-sm font-semibold text-slate-900">
                            {demo.name}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {demo.description}
                          </p>
                        </button>
                      ))}
                    </div>
                  </Reveal>
                </div>

                <Reveal>
                  <HeroPreview images={previewMedia} />
                </Reveal>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 pb-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <Reveal>
              <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-[2rem] border border-white/70 bg-white/80 p-5 shadow-[0_18px_70px_rgba(148,163,184,0.12)] backdrop-blur-sm sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
                        Current list
                      </p>
                      <p className="mt-2 text-lg font-semibold text-slate-900">
                        {activeSource.kind === 'remote'
                          ? 'Loaded from a shared text file'
                          : 'Loaded from the built-in demo feed'}
                      </p>
                    </div>
                    <StatusPill tone="accent">
                      {stats.total} item{stats.total === 1 ? '' : 's'}
                    </StatusPill>
                  </div>

                  <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                    <p className="break-all">
                      {activeSource.kind === 'remote' && activeSource.url
                        ? activeSource.url
                        : 'The demo feed mixes X posts and YouTube videos so you can test photos, quotes, and inline playback quickly.'}
                    </p>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-sky-400 via-cyan-300 to-amber-300 transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                      <span>{stats.successful} loaded</span>
                      <span>{stats.failed} failed</span>
                      <span>{duplicatesRemoved} duplicates removed</span>
                      <span>{progressPercent}% processed</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-[2rem] border border-white/70 bg-white/80 p-5 shadow-[0_18px_70px_rgba(148,163,184,0.12)] backdrop-blur-sm sm:p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
                    Notes
                  </p>
                  <details className="mt-3 group">
                    <summary className="cursor-pointer list-none text-base font-semibold text-slate-900">
                      Supported sources and troubleshooting
                    </summary>
                    <div className="mt-3 space-y-3 text-sm leading-6 text-slate-600">
                      <p>
                        Use GitHub raw URLs, public gists, or public Pastebin links.
                        The app requests everything from the browser, not the server.
                      </p>
                      <p>
                        One supported URL per line. Inline comments are fine after the
                        URL. `twitter.com` links are normalized to `x.com` automatically.
                      </p>
                      <p>
                        If a list fails to load, verify that the source is public and
                        returns plain text instead of an HTML landing page.
                      </p>
                    </div>
                  </details>
                </div>
              </div>
            </Reveal>

            {listError ? (
              <Reveal className="mt-4">
                <div className="rounded-[2rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm leading-6 text-rose-700">
                  {listError}
                </div>
              </Reveal>
            ) : null}

            {feedError ? (
              <Reveal className="mt-4">
                <div className="rounded-[2rem] border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-800">
                  {feedError}
                </div>
              </Reveal>
            ) : null}
          </div>
        </section>

        <section className="px-4 pb-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
                  Feed
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950 sm:text-3xl">
                  A continuous stream, in the order you picked it.
                </h2>
              </div>
              <p className="max-w-md text-sm leading-6 text-slate-500">
                Photos enlarge in place, videos play inline, and original X links stay
                behind a deliberate extra step.
              </p>
            </div>

            {isInitialLoading ? (
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
              {items.map((item) => (
                <Reveal key={item.id}>
                  {item.kind === 'x' ? (
                    <XPostCard item={item} />
                  ) : (
                    <YouTubeCard item={item} />
                  )}
                </Reveal>
              ))}
            </div>

            {!isInitialLoading && items.length === 0 && !listError && !feedError ? (
              <div className="rounded-[2rem] border border-white/70 bg-white/80 px-6 py-10 text-center text-slate-500 shadow-[0_18px_70px_rgba(148,163,184,0.12)]">
                No supported posts were loaded yet.
              </div>
            ) : null}

            {isLoadingMore ? (
              <div className="flex justify-center py-8">
                <div className="rounded-full border border-white/70 bg-white/80 px-5 py-3 text-sm text-slate-600 shadow-sm">
                  Loading more from the list...
                </div>
              </div>
            ) : null}

            {!isInitialLoading && !isLoadingMore && hasMoreContent && items.length > 0 ? (
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

        <footer className="px-4 pb-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl rounded-[2rem] border border-white/70 bg-white/75 px-6 py-5 shadow-[0_18px_70px_rgba(148,163,184,0.12)] backdrop-blur-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Keep a simple public list, share the URL, and the browser does the rest.
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Cached items remain available when the connection drops.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <a
                  href="https://github.com/p0n1/xfun"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Source code
                </a>
                {!canInstall && !isStandalone ? (
                  <StatusPill>{isOnline ? 'Install from your browser menu' : 'Offline-ready'}</StatusPill>
                ) : null}
              </div>
            </div>
          </div>
        </footer>
      </main>

      <ScrollToTop />
    </div>
  );
}
