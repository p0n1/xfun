'use client';

import { useState } from 'react';
import Image from 'next/image';
import PhotoSwipe from 'photoswipe';
import 'photoswipe/style.css';
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

function getPhotoGridClass(photoCount: number) {
  if (photoCount === 1) {
    return 'grid-cols-1';
  }

  if (photoCount === 3) {
    return 'grid-cols-2 md:grid-cols-3';
  }

  if (photoCount === 4) {
    return 'grid-cols-2';
  }

  if (photoCount === 2) {
    return 'grid-cols-2';
  }

  return 'grid-cols-2 md:grid-cols-3';
}

function getPhotoTileClass(photoCount: number, index: number) {
  if (photoCount === 3 && index === 0) {
    return 'col-span-2 md:col-span-1';
  }

  return '';
}

function getPhotoFrameClass(photoCount: number, index: number) {
  if (photoCount === 1) {
    return 'aspect-[4/5] sm:aspect-[16/10]';
  }

  if (photoCount === 3) {
    if (index === 0) {
      return 'aspect-[16/10] md:aspect-[4/3]';
    }

    return 'aspect-square md:aspect-[4/3]';
  }

  if (photoCount === 4) {
    return 'aspect-square lg:aspect-[6/5]';
  }

  return 'aspect-[4/5] sm:aspect-[4/3]';
}

function getPhotoSizes(photoCount: number, index: number) {
  if (photoCount === 1) {
    return '(min-width: 1024px) 52rem, 100vw';
  }

  if (photoCount === 3) {
    if (index === 0) {
      return '(min-width: 768px) 32vw, 100vw';
    }

    return '(min-width: 768px) 32vw, 50vw';
  }

  if (photoCount === 4 || photoCount === 2) {
    return '(min-width: 1024px) 26rem, 50vw';
  }

  return '(min-width: 768px) 32vw, 50vw';
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
        <div className={`grid gap-3 ${getPhotoGridClass(photos.length)}`}>
          {photos.map((photo, index) => (
            <button
              key={photo.url}
              type="button"
              onClick={() => openGallery(photo.url)}
              className={`group relative overflow-hidden rounded-[1.5rem] bg-slate-100 text-left ${getPhotoTileClass(
                photos.length,
                index,
              )} ${getPhotoFrameClass(photos.length, index)}`}
            >
              <Image
                src={photo.url}
                alt="Post image"
                fill
                sizes={getPhotoSizes(photos.length, index)}
                className="object-cover transition duration-500 group-hover:scale-[1.02]"
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
  const [clickCount, setClickCount] = useState(0);

  const handleDateClick = () => {
    const nextClickCount = clickCount + 1;
    setClickCount(nextClickCount);

    if (nextClickCount >= 3) {
      window.open(item.sourceUrl, '_blank', 'noopener,noreferrer');
      setClickCount(0);
      return;
    }

    window.setTimeout(() => {
      setClickCount(0);
    }, 3000);
  };

  const getClickMessage = () => {
    if (clickCount === 1) {
      return 'Click 2 more times to open the original post';
    }

    if (clickCount === 2) {
      return 'Click 1 more time to open the original post';
    }

    return '';
  };

  return (
    <article className="relative overflow-hidden rounded-[2rem] border border-white/65 bg-white/80 p-5 shadow-[0_24px_80px_rgba(148,163,184,0.16)] backdrop-blur-sm sm:p-7">
      <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-sky-300/70 to-transparent" />

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

      <div className="mt-5 space-y-5">
        {item.text ? (
          <p className="whitespace-pre-wrap text-[1rem] leading-7 text-slate-700 sm:text-[1.05rem]">
            {item.text}
          </p>
        ) : null}

        <MediaGallery photos={item.photos} videos={item.videos} />

        {item.quote ? <QuoteBlock quote={item.quote} /> : null}
      </div>

      <footer className="mt-5 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={handleDateClick}
          className="text-left text-sm text-slate-500 transition hover:text-slate-700"
        >
          <time>{formatDate(item.createdAt)}</time>
        </button>
        {clickCount > 0 ? (
          <p className="mt-2 text-xs font-medium text-sky-600">{getClickMessage()}</p>
        ) : null}
      </footer>
    </article>
  );
}
