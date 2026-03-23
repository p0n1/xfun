'use client';

import { useState } from 'react';
import Image from 'next/image';
import PhotoSwipe from 'photoswipe';
import 'photoswipe/style.css';
import GuardedLinkDialog from './GuardedLinkDialog';
import { getBestVideoUrl, type XPhoto, type XPostItem, type XVideo } from '../lib/content';

interface XPostCardProps {
  item: XPostItem;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function pauseAllOtherVideos(currentVideo: HTMLVideoElement) {
  const allVideos = document.querySelectorAll('video');
  allVideos.forEach((video) => {
    if (video !== currentVideo && !video.paused) {
      video.pause();
    }
  });
}

function MediaGallery({
  photos,
  videos,
}: {
  photos: XPhoto[];
  videos: XVideo[];
}) {
  const openGallery = (photoUrl: string) => {
    const index = photos.findIndex((photo) => photo.url === photoUrl);
    const dataSource = photos.map((photo) => ({
      alt: 'Post image',
      height: photo.height,
      src: photo.url,
      width: photo.width,
    }));

    const lightbox = new PhotoSwipe({
      allowPanToNext: true,
      arrowKeys: true,
      bgOpacity: 0.92,
      clickToCloseNonZoomable: false,
      dataSource,
      doubleTapAction: 'zoom',
      index: index === -1 ? 0 : index,
      loop: true,
      preloaderDelay: 1000,
      returnFocus: true,
      showHideAnimationType: 'zoom',
      spacing: 0.12,
      tapAction: 'toggle-controls',
    });

    lightbox.init();
  };

  if (photos.length === 0 && videos.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {videos.length > 0 ? (
        <div className="space-y-3">
          {videos.map((video) => {
            const bestVideoUrl = getBestVideoUrl(video.variants);

            return (
              <div
                key={video.url}
                className="overflow-hidden rounded-[1.5rem] bg-slate-950 shadow-[0_20px_60px_rgba(15,23,42,0.18)]"
              >
                <video
                  controls
                  poster={video.thumbnailUrl}
                  className="h-auto w-full bg-slate-950 object-contain"
                  style={{
                    aspectRatio: `${video.width}/${video.height}`,
                    maxHeight: 'min(72vh, 34rem)',
                  }}
                  preload="metadata"
                  onPlay={(event) => pauseAllOtherVideos(event.currentTarget)}
                >
                  {bestVideoUrl ? (
                    <source src={bestVideoUrl} type="video/mp4" />
                  ) : null}
                  Your browser does not support the video tag.
                </video>
              </div>
            );
          })}
        </div>
      ) : null}

      {photos.length > 0 ? (
        <div
          className={`grid gap-3 ${
            photos.length === 1
              ? 'grid-cols-1'
              : photos.length === 2
                ? 'grid-cols-2'
                : 'grid-cols-2 md:grid-cols-3'
          }`}
        >
          {photos.map((photo) => (
            <button
              key={photo.url}
              type="button"
              onClick={() => openGallery(photo.url)}
              className="group relative overflow-hidden rounded-[1.5rem] bg-slate-100 text-left"
            >
              <Image
                src={photo.url}
                alt="Post image"
                width={photo.width}
                height={photo.height}
                className={`w-full object-cover transition duration-500 group-hover:scale-[1.02] ${
                  photos.length === 1 ? 'max-h-[38rem]' : 'h-56 md:h-72'
                }`}
              />
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950/15 to-transparent opacity-0 transition group-hover:opacity-100" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function QuoteBlock({ quote }: { quote: XPostItem }) {
  return (
    <section className="space-y-4 rounded-[1.75rem] border border-sky-200/80 bg-sky-50/80 p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <Image
          src={quote.author.avatarUrl}
          alt={quote.author.name}
          width={40}
          height={40}
          className="h-10 w-10 rounded-full"
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">
            {quote.author.name}
          </p>
          <p className="truncate text-sm text-slate-500">@{quote.author.handle}</p>
        </div>
      </div>

      {quote.text ? (
        <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
          {quote.text}
        </p>
      ) : null}

      <MediaGallery photos={quote.photos} videos={quote.videos} />
    </section>
  );
}

export default function XPostCard({ item }: XPostCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <article className="relative overflow-hidden rounded-[2rem] border border-white/65 bg-white/80 p-5 shadow-[0_24px_80px_rgba(148,163,184,0.16)] backdrop-blur-sm sm:p-7">
        <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-sky-300/70 to-transparent" />

        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <Image
              src={item.author.avatarUrl}
              alt={item.author.name}
              width={52}
              height={52}
              className="h-12 w-12 rounded-full ring-2 ring-white"
            />
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-slate-900">
                {item.author.name}
              </p>
              <p className="truncate text-sm text-slate-500">@{item.author.handle}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsDialogOpen(true)}
            className="shrink-0 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Open on X
          </button>
        </div>

        <div className="mt-5 space-y-5">
          {item.text ? (
            <p className="whitespace-pre-wrap text-[1rem] leading-7 text-slate-700 sm:text-[1.05rem]">
              {item.text}
            </p>
          ) : null}

          <MediaGallery photos={item.photos} videos={item.videos} />

          {item.quote ? <QuoteBlock quote={item.quote} /> : null}
        </div>

        <footer className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <time className="text-sm text-slate-500">{formatDate(item.createdAt)}</time>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-sky-600">
            X post
          </p>
        </footer>
      </article>

      <GuardedLinkDialog
        authorName={item.author.name}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        postUrl={item.sourceUrl}
      />
    </>
  );
}
