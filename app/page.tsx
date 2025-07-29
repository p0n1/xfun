'use client';

import { useState, useEffect } from 'react';
import PostCard from './components/PostCard';

const DEMO_URLS = [
  'https://twitter.com/jack/status/20',
  'https://twitter.com/elonmusk/status/1585841080431321088',
  'https://twitter.com/joely7758521/status/1947472826489016745',
  'https://x.com/niccruzpatane/status/1946967976005042231',
  'https://x.com/SpaceX/status/1946437942265987384',
  'https://x.com/SpaceX/status/1949680387330027593',
  'https://x.com/johnkrausphotos/status/1947054042787762669',
  'https://x.com/SpaceBasedFox/status/1946403321646116865',
  'https://x.com/Rainmaker1973/status/1945522890889212414',
  'https://x.com/yourcloudnin3/status/1944214180472733905'
];

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

interface ApiResponse {
  code: number;
  message: string;
  tweet: Tweet;
}

function normalizeUrl(url: string): string {
  return url.replace(/^https?:\/\/(twitter\.com|x\.com)/, 'https://api.fxtwitter.com');
}

export default function Home() {
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTweets = async () => {
      try {
        const promises = DEMO_URLS.map(async (url) => {
          const apiUrl = normalizeUrl(url);
          const response = await fetch(apiUrl);
          const data: ApiResponse = await response.json();
          
          if (data.code === 200) {
            return data.tweet;
          }
          throw new Error(`Failed to fetch tweet: ${data.message}`);
        });

        const results = await Promise.allSettled(promises);
        const successfulTweets = results
          .filter((result): result is PromiseFulfilledResult<Tweet> => result.status === 'fulfilled')
          .map(result => result.value);

        setTweets(successfulTweets);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch tweets');
      } finally {
        setLoading(false);
      }
    };

    fetchTweets();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading tweets...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <header className="bg-gradient-to-r from-blue-400 to-purple-500 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-sm">🌟 X Fun</h1>
          <p className="text-blue-100 mt-1 sm:mt-2 text-sm sm:text-base">Fun and exciting X/Twitter content for curious minds</p>
        </div>
      </header>
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="space-y-6">
          {tweets.map((tweet) => (
            <PostCard key={tweet.id} tweet={tweet} />
          ))}
        </div>
      </main>
    </div>
  );
}
