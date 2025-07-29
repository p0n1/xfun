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
  const [urlList, setUrlList] = useState<string[]>([]);
  const [externalUrl, setExternalUrl] = useState<string>('');
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [showDemoOptions, setShowDemoOptions] = useState(false);
  const [loadStats, setLoadStats] = useState({ successful: 0, failed: 0, total: 0 });

  const fetchUrlList = async (listUrl: string) => {
    setIsLoadingList(true);
    try {
      const response = await fetch(listUrl);
      const text = await response.text();
      const urls = text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#') && !line.startsWith('//'))
        .map(line => {
          const urlMatch = line.match(/^(https:\/\/(?:twitter\.com|x\.com)\/\w+\/status\/\d+)/);
          return urlMatch ? urlMatch[1] : null;
        })
        .filter((url): url is string => url !== null);
      
      if (urls.length > 0) {
        setUrlList(urls);
        setError(null);
      } else {
        setError('No valid Twitter/X URLs found in the list');
      }
    } catch (err) {
      setError('Failed to fetch URL list. Make sure the URL is accessible and contains valid Twitter/X URLs.');
      console.error('Failed to fetch URL list:', err);
    } finally {
      setIsLoadingList(false);
    }
  };

  const handleLoadExternalList = () => {
    if (externalUrl.trim()) {
      const url = externalUrl.trim();
      fetchUrlList(url);
      
      // Update browser URL without encoding
      const baseUrl = window.location.origin + window.location.pathname;
      const newUrl = `${baseUrl}?list=${url}`;
      window.history.pushState({}, '', newUrl);
    }
  };

  const handleLoadDemo = () => {
    setUrlList(DEMO_URLS);
    setExternalUrl('');
    setError(null);
    setShowDemoOptions(false);
    
    // Clear URL parameter
    const baseUrl = window.location.origin + window.location.pathname;
    window.history.pushState({}, '', baseUrl);
  };

  const handleLoadDemoUrl = (demoUrl: string) => {
    setExternalUrl(demoUrl);
    fetchUrlList(demoUrl);
    setShowDemoOptions(false);
    
    // Update browser URL
    const baseUrl = window.location.origin + window.location.pathname;
    const newUrl = `${baseUrl}?list=${demoUrl}`;
    window.history.pushState({}, '', newUrl);
  };

  // Demo URLs for testing
  const demoUrls = [
    {
      name: "SpaceX Posts",
      url: "https://raw.githubusercontent.com/p0n1/xfun/refs/heads/main/demo-lists/spacex.txt",
      description: "Demo list with SpaceX tweets"
    }
  ];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const listUrl = params.get('list');
    
    if (listUrl) {
      setExternalUrl(listUrl);
      fetchUrlList(listUrl);
    } else {
      // Load default demo if no URL parameter
      setUrlList(DEMO_URLS);
    }
  }, []);

  useEffect(() => {
    const fetchTweets = async () => {
      try {
        const promises = urlList.map(async (url) => {
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

        const failedCount = results.filter(result => result.status === 'rejected').length;
        
        setTweets(successfulTweets);
        setLoadStats({
          successful: successfulTweets.length,
          failed: failedCount,
          total: urlList.length
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch tweets');
      } finally {
        setLoading(false);
      }
    };

    if (urlList.length > 0) {
      setLoading(true);
      fetchTweets();
    }
  }, [urlList]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading tweets...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <header className="bg-gradient-to-r from-blue-400 to-purple-500 shadow-lg">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-sm">🌟 X Fun</h1>
            <p className="text-blue-100 mt-1 sm:mt-2 text-sm sm:text-base">Fun and exciting X/Twitter content for curious minds</p>
          </div>
        </header>
        
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">😅</div>
            <div className="text-xl text-red-500 mb-6">Error: {error}</div>
            <button
              onClick={handleLoadDemo}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium"
            >
              Return to Demo
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <header className="bg-gradient-to-r from-blue-400 to-purple-500 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-sm">🌟 X Fun</h1>
              <p className="text-blue-100 mt-1 sm:mt-2 text-sm sm:text-base">Fun and exciting X/Twitter content for curious minds</p>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <button
                  onClick={() => setShowDemoOptions(!showDemoOptions)}
                  className="px-3 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-500 font-medium text-sm border border-white/30"
                >
                  {showDemoOptions ? 'Hide' : 'Try Examples'} ▼
                </button>
                {showDemoOptions && (
                  <div className="absolute top-full mt-1 left-1/2 -translate-x-4/5 sm:left-auto sm:right-0 sm:translate-x-0 bg-white rounded-lg shadow-lg border z-10 w-72 sm:w-80 max-w-[calc(100vw-2rem)]">
                    <div className="p-3 border-b">
                      <button
                        onClick={handleLoadDemo}
                        className="w-full text-left px-3 py-2 rounded hover:bg-gray-50 text-gray-900"
                      >
                        <div className="font-medium">Default Demo</div>
                        <div className="text-xs text-gray-500">Built-in example posts</div>
                      </button>
                    </div>
                    <div className="p-2">
                      <div className="text-xs text-gray-500 px-3 py-1 font-medium">Test External URLs:</div>
                      {demoUrls.map((demo, index) => (
                        <button
                          key={index}
                          onClick={() => handleLoadDemoUrl(demo.url)}
                          className="w-full text-left px-3 py-2 rounded hover:bg-gray-50 text-gray-900"
                        >
                          <div className="font-medium text-sm">{demo.name}</div>
                          <div className="text-xs text-gray-500">{demo.description}</div>
                          <div className="text-xs text-blue-600 break-all mt-1">{demo.url}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="px-3 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-500 font-medium text-sm border border-white/30"
              >
                {showUrlInput ? 'Hide' : 'Custom List'}
              </button>
            </div>
          </div>
          
          {showUrlInput && (
            <div className="mt-4 space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  placeholder="Enter URL to plain text list (e.g., GitHub raw URL)"
                  className="flex-1 px-3 py-2 rounded-lg border border-blue-200 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent text-gray-900 text-sm"
                  disabled={isLoadingList}
                />
                <button
                  onClick={handleLoadExternalList}
                  disabled={!externalUrl.trim() || isLoadingList}
                  className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm whitespace-nowrap"
                >
                  {isLoadingList ? 'Loading...' : 'Load List'}
                </button>
              </div>
              <div className="bg-white/10 rounded-lg p-3 text-white text-sm">
                <p className="font-medium mb-2">📝 Recommended Services (CORS-enabled):</p>
                <ul className="space-y-1 text-white/90">
                  <li>• <strong>GitHub:</strong> Create a public repo → Upload .txt file → Use raw URL</li>
                  <li>• <strong>GitHub Gist:</strong> Create public gist → Use raw URL</li>
                  <li>• <strong>Pastebin Pro:</strong> CORS-enabled for Pro accounts only</li>
                </ul>
                <p className="mt-2 text-white/80 text-xs">
                  <strong>Format:</strong> One URL per line, comments allowed after URLs
                </p>
              </div>
            </div>
          )}
        </div>
      </header>
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {!loading && loadStats.total > 0 && (
          <div className="mb-6 bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <span className="text-gray-600">
                  📊 <strong>{loadStats.total}</strong> URLs in list
                </span>
                <span className="text-green-600">
                  ✅ <strong>{loadStats.successful}</strong> loaded
                </span>
                {loadStats.failed > 0 && (
                  <span className="text-red-600">
                    ❌ <strong>{loadStats.failed}</strong> failed
                  </span>
                )}
              </div>
              <div className="text-gray-500">
                {Math.round((loadStats.successful / loadStats.total) * 100)}% success rate
              </div>
            </div>
          </div>
        )}
        
        <div className="space-y-6">
          {tweets.map((tweet) => (
            <PostCard key={tweet.id} tweet={tweet} />
          ))}
        </div>
      </main>
    </div>
  );
}
