'use client';

import { useState } from 'react';
import Image from 'next/image';
import PhotoSwipe from 'photoswipe';
import 'photoswipe/style.css';

interface Tweet {
  url: string;
  id: string;
  text: string;
  author: {
    name: string;
    screen_name: string;
    avatar_url: string;
  };
  created_at: string;
  media?: {
    photos?: Array<{
      type: string;
      url: string;
      width: number;
      height: number;
    }>;
    videos?: Array<{
      url: string;
      thumbnail_url: string;
      duration: number;
      width: number;
      height: number;
      variants: Array<{
        content_type: string;
        url: string;
        bitrate?: number;
      }>;
    }>;
  };
  quote?: Tweet;
}

interface PostCardProps {
  tweet: Tweet;
}

export default function PostCard({ tweet }: PostCardProps) {
  const [clickCount, setClickCount] = useState(0);
  
  const allPhotos = [
    ...(tweet.media?.photos || []),
    ...(tweet.quote?.media?.photos || [])
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getBestVideoUrl = (variants: Array<{content_type: string; url: string; bitrate?: number}>) => {
    const mp4Variants = variants.filter(v => v.content_type === 'video/mp4' && v.bitrate);
    if (mp4Variants.length === 0) return variants[0]?.url;
    
    mp4Variants.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
    return mp4Variants[0].url;
  };

  const openGallery = (photoUrl: string) => {
    const index = allPhotos.findIndex(photo => photo.url === photoUrl);
    
    const dataSource = allPhotos.map((photo) => ({
      src: photo.url,
      width: photo.width,
      height: photo.height,
      alt: 'Tweet image'
    }));

    const lightbox = new PhotoSwipe({
      dataSource,
      index: index !== -1 ? index : 0,
      showHideAnimationType: 'zoom',
      showAnimationDuration: 400,
      hideAnimationDuration: 400,
      bgOpacity: 0.95,
      spacing: 0.12,
      allowPanToNext: true,
      zoom: true,
      close: true,
      arrowKeys: true,
      returnFocus: true,
      trapFocus: true,
      clickToCloseNonZoomable: false,
      imageClickAction: 'zoom-or-close',
      tapAction: 'toggle-controls',
      doubleTapAction: 'zoom',
      preloaderDelay: 2000,
      loop: true
    });

    lightbox.init();
  };

  const handleDateClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const newClickCount = clickCount + 1;
    setClickCount(newClickCount);
    
    if (newClickCount === 3) {
      window.open(tweet.url, '_blank', 'noopener,noreferrer');
      setClickCount(0);
    } else {
      setTimeout(() => {
        setClickCount(0);
      }, 3000);
    }
  };

  const getClickMessage = () => {
    switch (clickCount) {
      case 0:
        return '';
      case 1:
        return 'Click 2 more times to open original post';
      case 2:
        return 'Click 1 more time to open original post';
      default:
        return '';
    }
  };


  const renderMedia = (media: Tweet['media']) => {
    if (!media) return null;

    return (
      <div className="mt-3">
        {media.videos && media.videos.length > 0 && (
          <div className="space-y-3 sm:space-y-4">
            {media.videos.map((video, index) => (
              <div key={index} className="relative overflow-hidden rounded-xl shadow-md">
                <video
                  controls
                  poster={video.thumbnail_url}
                  className="w-full h-auto object-contain bg-black rounded-xl"
                  style={{ 
                    aspectRatio: `${video.width}/${video.height}`,
                    maxHeight: 'min(70vh, 400px)'
                  }}
                  preload="auto"
                >
                  <source src={getBestVideoUrl(video.variants)} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                <div className="absolute inset-0 pointer-events-none rounded-xl ring-1 ring-black/5"></div>
              </div>
            ))}
          </div>
        )}

        {media.photos && media.photos.length > 0 && (
          <div className={`grid gap-2 sm:gap-3 ${media.videos && media.videos.length > 0 ? 'mt-4' : ''} ${
            media.photos.length === 1 
              ? 'grid-cols-1' 
              : media.photos.length === 2 
              ? 'grid-cols-1 sm:grid-cols-2' 
              : media.photos.length === 3
              ? 'grid-cols-1 lg:grid-cols-3'
              : 'grid-cols-1 sm:grid-cols-2'
          }`}>
            {media.photos.map((photo, index) => (
              <div
                key={index}
                className="relative cursor-pointer hover:opacity-90 hover:scale-[1.02] transition-all duration-200"
                onClick={() => openGallery(photo.url)}
              >
                <Image
                  src={photo.url}
                  alt="Tweet image"
                  width={photo.width}
                  height={photo.height}
                  className="w-full h-40 sm:h-48 lg:h-96 object-cover rounded-xl shadow-sm"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderQuoteTweet = (quote: Tweet) => {
    return (
      <div className="mt-3 border-l-4 border-l-pink-400 border-2 border-pink-200 rounded-xl p-3 sm:p-4 bg-gradient-to-r from-pink-50 to-purple-50">
        <div className="flex items-center space-x-2 mb-2">
          <Image
            src={quote.author.avatar_url}
            alt={quote.author.name}
            width={28}
            height={28}
            className="w-7 h-7 rounded-full"
          />
          <span className="font-semibold text-sm text-purple-700">{quote.author.name}</span>
          <span className="text-pink-600 text-sm">@{quote.author.screen_name}</span>
        </div>
        <p className="text-sm text-gray-800 mb-2 leading-relaxed">{quote.text}</p>
        {renderMedia(quote.media)}
      </div>
    );
  };

  return (
    <>
      <article className="bg-white rounded-2xl shadow-lg border-2 border-blue-200 p-4 sm:p-6 hover:shadow-xl hover:border-purple-300 transition-all duration-300">
        <div className="flex items-start space-x-2 sm:space-x-3 mb-3">
          <Image
            src={tweet.author.avatar_url}
            alt={tweet.author.name}
            width={48}
            height={48}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex-shrink-0"
          />
          
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-purple-700 text-sm sm:text-base leading-tight truncate">{tweet.author.name}</h3>
            <div className="text-blue-600 text-xs sm:text-sm truncate">@{tweet.author.screen_name}</div>
          </div>
        </div>
        
        <p className="text-gray-800 text-sm sm:text-base leading-relaxed mb-3 whitespace-pre-wrap">
          {tweet.text}
        </p>

        {renderMedia(tweet.media)}
        {tweet.quote && renderQuoteTweet(tweet.quote)}

        <div className="mt-3 sm:mt-4">
          <div className="flex flex-col space-y-1">
            <button
              onClick={handleDateClick}
              className="text-gray-400 hover:text-gray-600 text-xs sm:text-sm transition-colors text-left cursor-pointer"
            >
              <time>{formatDate(tweet.created_at)}</time>
            </button>
            {clickCount > 0 && (
              <div className="text-xs text-blue-600 font-medium animate-pulse">
                {getClickMessage()} 💡
              </div>
            )}
          </div>
        </div>
      </article>

    </>
  );
}