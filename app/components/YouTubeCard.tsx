'use client';

import type { YouTubeItem } from '../lib/content';

interface YouTubeCardProps {
  item: YouTubeItem;
}

export default function YouTubeCard({ item }: YouTubeCardProps) {
  return (
    <article className="relative overflow-hidden rounded-[2rem] border border-white/65 bg-white/80 p-5 shadow-[0_24px_80px_rgba(148,163,184,0.16)] backdrop-blur-sm sm:p-7">
      <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-rose-300/70 to-transparent" />

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rose-500">
          YouTube video
        </p>
        <div>
          <h2 className="max-w-3xl text-xl font-semibold leading-tight text-slate-900 sm:text-2xl">
            {item.metadata?.title ?? 'YouTube video'}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {item.metadata?.authorName ?? 'Metadata unavailable'}
          </p>
        </div>
      </div>

      {item.metadataError ? (
        <p className="mt-4 text-sm text-slate-500">
          The video still plays here, but extra YouTube metadata could not be loaded.
        </p>
      ) : null}

      <div className="mt-5 overflow-hidden rounded-[1.75rem] bg-slate-950 shadow-[0_20px_60px_rgba(15,23,42,0.18)]">
        <div className="relative aspect-video w-full">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${item.videoId}?controls=1&modestbranding=1&rel=0`}
            title={item.metadata?.title ?? 'YouTube video'}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
      </div>
    </article>
  );
}
