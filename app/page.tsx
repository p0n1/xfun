'use client';

import { useState, useEffect, useCallback } from 'react';
import PostCard from './components/PostCard';
import ScrollToTop from './components/ScrollToTop';
import Image from 'next/image';

const DEMO_URLS = [
  'https://x.com/SpaceX/status/1949680387330027593',
  'https://x.com/SpaceX/status/1949993416604951017',
  'https://x.com/AMAZlNGNATURE/status/1932563688667373813',
  'https://x.com/NoContextHumans/status/1949803858063970648',
  'https://x.com/niccruzpatane/status/1946967976005042231',
  'https://x.com/SpaceX/status/1946437942265987384',
  'https://x.com/johnkrausphotos/status/1947054042787762669',
  'https://x.com/SpaceBasedFox/status/1946403321646116865',
  'https://x.com/AMAZlNGNATURE/status/1941281137915040187',
  'https://x.com/satofishi/status/1908020230561075521',
  'https://x.com/Rainmaker1973/status/1950054930384830578',
  'https://x.com/Rainmaker1973/status/1945522890889212414',
  'https://x.com/yourcloudnin3/status/1944214180472733905',
  'https://x.com/not_2b_or_2b/status/1949666334616232152',
  'https://twitter.com/joely7758521/status/1947472826489016745',
  'https://x.com/interesting_aIl/status/1945914505633902667',
  'https://x.com/DashHuang/status/1945939956444410008',
  'https://x.com/earth_tracker/status/1944988485485781326',
  'https://x.com/Rainmaker1973/status/1943173340472185135',
  'https://x.com/catsareblessing/status/1941930158392553923',
  'https://x.com/iam_smx/status/1940714232821277108',
  'https://x.com/Ivar_A2428/status/1939698895598276770',
  'https://twitter.com/jack/status/20',
  'https://twitter.com/elonmusk/status/1585841080431321088',
  'https://x.com/konstructivizm/status/1939430423190470904',
  'https://x.com/HowThingsWork_/status/1938658586839990720',
  'https://x.com/Rainmaker1973/status/1938845424628179186',
  'https://x.com/historigins/status/1938630539696619880',
  'https://x.com/Crazymoments01/status/1938506613117358262',
  'https://x.com/gunsnrosesgirl3/status/1938283624794636738',
  'https://x.com/TodayiLearrned/status/1937704284713365861',
  'https://x.com/AMAZlNGNATURE/status/1937495493476487329',
  'https://x.com/PicturesFoIder/status/1936868452242760065',
  'https://x.com/UNIVERSE_FEEDS/status/1936873263038074891',
  'https://x.com/Rainmaker1973/status/1936647837615296894',
];

const BATCH_SIZE = 3;

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

function deduplicateUrls(urls: string[]): { deduplicated: string[], duplicatesRemoved: number } {
  const seen = new Set<string>();
  const deduplicated: string[] = [];
  let duplicatesRemoved = 0;
  
  for (const url of urls) {
    const normalizedForComparison = url.replace(/^https?:\/\/(twitter\.com|x\.com)/, 'https://x.com');
    if (!seen.has(normalizedForComparison)) {
      seen.add(normalizedForComparison);
      deduplicated.push(url);
    } else {
      duplicatesRemoved++;
    }
  }
  
  return { deduplicated, duplicatesRemoved };
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
  const [loadStats, setLoadStats] = useState({ successful: 0, failed: 0, total: 0, duplicatesRemoved: 0 });
  const [currentBatch, setCurrentBatch] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreTweets, setHasMoreTweets] = useState(true);

  const fetchUrlList = async (listUrl: string) => {
    setIsLoadingList(true);
    try {
      // Use CORS proxy for URLs that don't support CORS
      const needsProxy = listUrl.startsWith('https://pastebin.com/raw');
      const finalUrl = needsProxy ? `https://api.allorigins.win/get?url=${encodeURIComponent(listUrl)}` : listUrl;
      
      const response = await fetch(finalUrl);
      let text = await response.text();
      
      // If using CORS proxy, extract the actual content
      if (needsProxy) {
        const data = JSON.parse(text);
        text = data.contents;
      }
      const rawUrls = text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#') && !line.startsWith('//'))
        .map(line => {
          const urlMatch = line.match(/^(https:\/\/(?:twitter\.com|x\.com)\/\w+\/status\/\d+)/);
          return urlMatch ? urlMatch[1] : null;
        })
        .filter((url): url is string => url !== null);
      
      if (rawUrls.length > 0) {
        const { deduplicated, duplicatesRemoved } = deduplicateUrls(rawUrls);
        setUrlList(deduplicated);
        setLoadStats(prev => ({ ...prev, duplicatesRemoved }));
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
    const { deduplicated, duplicatesRemoved } = deduplicateUrls(DEMO_URLS);
    setUrlList(deduplicated);
    setLoadStats(prev => ({ ...prev, duplicatesRemoved }));
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
      const { deduplicated, duplicatesRemoved } = deduplicateUrls(DEMO_URLS);
      setUrlList(deduplicated);
      setLoadStats(prev => ({ ...prev, duplicatesRemoved }));
    }
  }, []);

  const fetchBatch = useCallback(async (batchIndex: number, isInitial = false) => {
    const startIndex = batchIndex * BATCH_SIZE;
    const endIndex = Math.min(startIndex + BATCH_SIZE, urlList.length);
    const batchUrls = urlList.slice(startIndex, endIndex);
    
    if (batchUrls.length === 0) {
      setHasMoreTweets(false);
      return;
    }
    
    try {
      const promises = batchUrls.map(async (url) => {
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
      
      if (isInitial) {
        setTweets(successfulTweets);
        setLoadStats(prev => ({
          ...prev,
          successful: successfulTweets.length,
          failed: failedCount,
          total: urlList.length
        }));
      } else {
        let newTweets: Tweet[] = [];
        setTweets(prev => {
          const existingIds = new Set(prev.map(tweet => tweet.id));
          newTweets = successfulTweets.filter(tweet => !existingIds.has(tweet.id));
          return [...prev, ...newTweets];
        });
        setLoadStats(prev => ({
          ...prev,
          successful: prev.successful + newTweets.length,
          failed: prev.failed + failedCount
        }));
      }
      
      setHasMoreTweets(endIndex < urlList.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tweets');
    }
  }, [urlList]);
  
  const loadMoreTweets = useCallback(async () => {
    if (isLoadingMore || !hasMoreTweets) return;
    
    setIsLoadingMore(true);
    const nextBatch = currentBatch + 1;
    await fetchBatch(nextBatch);
    setCurrentBatch(nextBatch);
    setIsLoadingMore(false);
  }, [isLoadingMore, hasMoreTweets, currentBatch, fetchBatch]);

  useEffect(() => {
    const initializeTweets = async () => {
      if (urlList.length === 0) return;
      
      setLoading(true);
      setTweets([]);
      setCurrentBatch(0);
      setHasMoreTweets(true);
      
      await fetchBatch(0, true);
      setLoading(false);
    };

    initializeTweets();
  }, [urlList, fetchBatch]);
  
  useEffect(() => {
    const handleScroll = () => {
      if (loading || isLoadingMore || !hasMoreTweets) return;
      
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      if (scrollTop + windowHeight >= documentHeight - 1000) {
        loadMoreTweets();
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, isLoadingMore, hasMoreTweets, loadMoreTweets]);

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
            <h1 
              className="text-2xl sm:text-3xl font-bold text-white drop-shadow-sm cursor-pointer hover:text-blue-100 transition-colors flex items-center gap-2" 
              onClick={() => window.location.reload()}
            >
              <Image 
                src="/icon.svg" 
                alt="X Fun Logo" 
                width={32} 
                height={32}
                className="w-8 h-8"
              />
              X Fun
            </h1>
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
              <h1 
                className="text-2xl sm:text-3xl font-bold text-white drop-shadow-sm cursor-pointer hover:text-blue-100 transition-colors flex items-center gap-2" 
                onClick={() => window.location.reload()}
              >
                <Image 
                  src="/icon.svg" 
                  alt="X Fun Logo" 
                  width={32} 
                  height={32}
                  className="w-8 h-8"
                />
                X Fun
              </h1>
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
                <p className="font-medium mb-2">📝 Supported Services:</p>
                <ul className="space-y-1 text-white/90">
                  <li>• <strong>GitHub:</strong> Create a public repo → Upload .txt file → Use raw URL</li>
                  <li>• <strong>GitHub Gist:</strong> Create public gist → Use raw URL</li>
                  <li>• <strong>Pastebin:</strong> Any public paste URL (uses CORS proxy)</li>
                </ul>
                <p className="mt-2 text-white/80 text-xs">
                  <strong>Format:</strong> One URL per line, comments allowed after URLs. Check examples above for working URLs.
                </p>
                <p className="mt-2 text-white/80 text-xs">
                  <strong>💡 Troubleshooting:</strong> If your list fails to load, test CORS support at{' '}
                  <a 
                    href="https://cors-test.codehappy.dev/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-white underline hover:text-blue-200"
                  >
                    cors-test.codehappy.dev
                  </a>
                </p>
                <p className="mt-2 text-white/80 text-xs">
                  <strong>🔗 Source Code:</strong>{' '}
                  <a 
                    href="https://github.com/p0n1/xfun" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-white underline hover:text-blue-200"
                  >
                    github.com/p0n1/xfun
                  </a>
                </p>
              </div>
            </div>
          )}
        </div>
      </header>
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {!loading && loadStats.total > 0 && (
          <div className="mb-6">
            <details className="group">
              <summary className="cursor-pointer text-xs text-gray-400 hover:text-gray-600 transition-colors select-none">
                <span className="inline-flex items-center gap-1">
                  <span className="text-[10px]">ℹ️</span>
                  <span>Details</span>
                  <span className="text-[10px] group-open:rotate-180 transition-transform">▼</span>
                </span>
              </summary>
              <div className="mt-2 text-xs text-gray-500 space-y-1 pl-3 border-l-2 border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                  <span>📋 {loadStats.total} URLs in current list</span>
                  <span className="text-green-600">✓ {loadStats.successful} successfully loaded</span>
                  {loadStats.failed > 0 && (
                    <span className="text-red-500">✗ {loadStats.failed} failed to load</span>
                  )}
                  {loadStats.duplicatesRemoved > 0 && (
                    <span className="text-orange-500">⚡ {loadStats.duplicatesRemoved} duplicates filtered</span>
                  )}
                </div>
                {externalUrl && (
                  <div className="text-blue-600 break-all">
                    <span className="text-gray-500">🔗 Source:</span> {externalUrl}
                  </div>
                )}
                {!externalUrl && (
                  <div className="text-gray-400">
                    <span className="text-gray-500">🔗 Source:</span> Built-in demo list
                  </div>
                )}
                <div className="text-gray-400">
                  <span className="text-gray-500">⏱️ Load progress:</span> {Math.round((loadStats.successful + loadStats.failed) / loadStats.total * 100)}% complete
                </div>
                <div className="text-gray-400">
                  <span className="text-gray-500">🔗 Source code:</span>{' '}
                  <a 
                    href="https://github.com/p0n1/xfun" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-700 underline"
                  >
                    github.com/p0n1/xfun
                  </a>
                </div>
              </div>
            </details>
          </div>
        )}
        
        <div className="space-y-6">
          {tweets.map((tweet) => (
            <PostCard key={tweet.id} tweet={tweet} />
          ))}
        </div>
        
        {isLoadingMore && (
          <div className="flex items-center justify-center py-8">
            <div className="text-lg text-gray-600">Loading more tweets...</div>
          </div>
        )}
        
        {!loading && !isLoadingMore && hasMoreTweets && tweets.length > 0 && (
          <div className="flex items-center justify-center py-8">
            <button
              onClick={loadMoreTweets}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium transition-colors"
            >
              Load More Tweets
            </button>
          </div>
        )}
        
        {!loading && !hasMoreTweets && tweets.length > 0 && (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">🎉 All tweets loaded!</div>
          </div>
        )}
      </main>
      <ScrollToTop />
    </div>
  );
}
