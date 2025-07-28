'use client';

import { useState } from 'react';

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
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);

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

  const renderMedia = (media: Tweet['media']) => {
    if (!media) return null;

    return (
      <div className="mt-3">
        {media.videos && media.videos.length > 0 && (
          <div className="space-y-3">
            {media.videos.map((video, index) => (
              <div key={index} className="relative">
                <video
                  controls
                  poster={video.thumbnail_url}
                  className="w-full rounded-lg max-h-96"
                  style={{ aspectRatio: `${video.width}/${video.height}` }}
                  preload="metadata"
                >
                  <source src={getBestVideoUrl(video.variants)} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            ))}
          </div>
        )}

        {media.photos && media.photos.length > 0 && (
          <div className={`grid gap-2 ${media.photos.length === 1 ? 'grid-cols-1' : media.photos.length === 2 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3'}`}>
            {media.photos.map((photo, index) => (
              <div
                key={index}
                className="relative cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setEnlargedImage(photo.url)}
              >
                <img
                  src={photo.url}
                  alt="Tweet image"
                  className="w-full h-48 object-cover rounded-lg"
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
          <img
            src={quote.author.avatar_url}
            alt={quote.author.name}
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
          <img
            src={tweet.author.avatar_url}
            alt={tweet.author.name}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex-shrink-0"
          />
          
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-purple-700 text-base leading-tight">{tweet.author.name}</h3>
            <div className="text-blue-600 text-sm">@{tweet.author.screen_name}</div>
          </div>
        </div>
        
        <p className="text-gray-800 text-base leading-relaxed mb-3 whitespace-pre-wrap">
          {tweet.text}
        </p>

        {renderMedia(tweet.media)}
        {tweet.quote && renderQuoteTweet(tweet.quote)}

        <div className="mt-4 pt-3 border-t border-gray-100">
          <a
            href={tweet.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-gray-600 text-xs transition-colors"
          >
            <time>{formatDate(tweet.created_at)}</time>
          </a>
        </div>
      </article>

      {enlargedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setEnlargedImage(null)}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={enlargedImage}
              alt="Enlarged tweet image"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEnlargedImage(null);
              }}
              className="absolute top-4 right-4 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}