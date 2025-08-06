'use client';

import { useState, useEffect } from 'react';
import { YouTubeEmbed } from '@next/third-parties/google';
import { extractYouTubeVideoId } from '../utils/urlDetection';

interface YouTubeMetadata {
  title: string;
  author_name: string;
  author_url: string;
  thumbnail_url: string;
  provider_name: string;
}

interface YouTubeCardProps {
  url: string;
}

export default function YouTubeCard({ url }: YouTubeCardProps) {
  const videoId = extractYouTubeVideoId(url);
  const [metadata, setMetadata] = useState<YouTubeMetadata | null>(null);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [metadataError, setMetadataError] = useState<string | null>(null);


  useEffect(() => {
    if (!videoId) return;

    const fetchMetadata = async () => {
      setIsLoadingMetadata(true);
      setMetadataError(null);
      
      try {
        const oembedUrl = `https://www.youtube.com/oembed?format=json&url=https://www.youtube.com/watch?v=${videoId}`;
        const response = await fetch(oembedUrl);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json() as YouTubeMetadata;
        setMetadata(data);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to fetch video metadata';
        setMetadataError(errorMsg);
        console.error('Failed to fetch YouTube metadata:', error);
      } finally {
        setIsLoadingMetadata(false);
      }
    };

    fetchMetadata();
  }, [videoId]);
  
  if (!videoId) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border-2 border-red-200 p-4 sm:p-6">
        <div className="text-red-500 text-center">
          <div className="text-4xl mb-2">⚠️</div>
          <div>Invalid YouTube URL</div>
          <div className="text-sm text-gray-500 mt-2 break-all">{url}</div>
        </div>
      </div>
    );
  }

  return (
    <article className="bg-white rounded-2xl shadow-lg border-2 border-red-200 p-4 sm:p-6 hover:shadow-xl hover:border-red-300 transition-all duration-300">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
        </div>
        <div className="flex-1">
          {metadata ? (
            <div>
              <div className="font-bold text-red-600 text-sm sm:text-base">{metadata.author_name}</div>
              <div className="text-xs text-gray-500">YouTube Channel</div>
            </div>
          ) : (
            <span className="font-bold text-red-600 text-sm sm:text-base">YouTube Video</span>
          )}
        </div>
      </div>
      
      {metadata && (
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{metadata.title}</h3>
        </div>
      )}
      
      {isLoadingMetadata && (
        <div className="mb-4 text-sm text-gray-500 flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-red-500 rounded-full animate-spin"></div>
          Loading video info...
        </div>
      )}
      
      {metadataError && (
        <div className="mb-4 text-sm text-gray-500">
          YouTube Video (metadata unavailable)
        </div>
      )}
      
      <div className="w-full">
        <div className="aspect-video w-full rounded-xl overflow-hidden mx-auto">
          <YouTubeEmbed 
            videoid={videoId}
            style="width: 100%; height: 100%; margin: 0 auto; display: block;"
            params="controls=1&modestbranding=1&rel=0"
          />
        </div>
      </div>
      
    </article>
  );
}