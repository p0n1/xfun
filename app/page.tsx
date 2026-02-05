'use client';

import { useState, useEffect, useCallback } from 'react';
import XPostCard from './components/XPostCard';
import YouTubeCard from './components/YouTubeCard';
import ScrollToTop from './components/ScrollToTop';
import Image from 'next/image';
import { getContentType, normalizeXUrl } from './utils/urlDetection';

const DEMO_URLS = [
  'https://www.youtube.com/watch?v=VxkMSkDF8vY',
  'https://x.com/SpaceX/status/1949680387330027593',
  'https://x.com/SpaceX/status/1949993416604951017',
  'https://www.youtube.com/watch?v=hI9HQfCAw64',
  'https://x.com/AMAZlNGNATURE/status/1932563688667373813',
  'https://www.youtube.com/watch?v=AZ7AcvbebKo',
  'https://x.com/NoContextHumans/status/1949803858063970648',
  'https://x.com/niccruzpatane/status/1946967976005042231',
  'https://x.com/SpaceX/status/1946437942265987384',
  'https://youtu.be/2R8V68viXqk',
  'https://x.com/johnkrausphotos/status/1947054042787762669',
  'https://x.com/SpaceBasedFox/status/1946403321646116865',
  'https://x.com/AMAZlNGNATURE/status/1941281137915040187',
  'https://www.youtube.com/watch?v=6yb6cSHqEGs',
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

interface ContentItem {
  type: 'twitter' | 'youtube';
  url: string;
  data?: Tweet;
  id: string;
}

interface ApiResponse {
  code: number;
  message: string;
  tweet: Tweet;
}

function looksLikeHtml(content: string): boolean {
  const trimmed = content.trim().toLowerCase();
  if (!trimmed) return false;
  return (
    trimmed.startsWith('<!doctype html') ||
    trimmed.startsWith('<html') ||
    (trimmed.includes('<head') && trimmed.includes('<body')) ||
    (trimmed.includes('<script') && trimmed.includes('</html>'))
  );
}

function looksLikeCloudflareChallenge(content: string): boolean {
  const lower = content.toLowerCase();
  return (
    lower.includes('cf_chl') ||
    lower.includes('cloudflare') ||
    lower.includes('just a moment') ||
    lower.includes('challenge-error-text') ||
    lower.includes('checking your browser')
  );
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
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
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
  const [hasMoreContent, setHasMoreContent] = useState(true);

  // CORS proxy fallback system - tries proxies in order of reliability
  // https://gist.github.com/reynaldichernando/eab9c4e31e30677f176dc9eb732963ef CORS proxies list
  const fetchWithCorsProxy = async (url: string): Promise<string> => {
    const proxies = [
      {
        name: 'codetabs',
        url: `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(url)}`,
        extractContent: (response: string) => response // Returns content directly
      },
      {
        name: 'corsproxy.io',
        url: `https://corsproxy.io/?${encodeURIComponent(url)}`,
        extractContent: (response: string) => response // Returns content directly
      },
      {
        name: 'allorigins',
        url: `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
        extractContent: (response: string) => {
          const data = JSON.parse(response);
          return data.contents;
        }
      }
    ];

    let lastError: Error | null = null;
    
    for (const proxy of proxies) {
      try {
        console.log(`Trying CORS proxy: ${proxy.name}`);
        const response = await fetch(proxy.url);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const text = await response.text();
        const content = proxy.extractContent(text);
        if (looksLikeHtml(content)) {
          if (looksLikeCloudflareChallenge(content)) {
            throw new Error('Received Cloudflare challenge HTML');
          }
          throw new Error('Received HTML instead of plain text');
        }
        
        console.log(`Successfully fetched via ${proxy.name}`);
        return content;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.warn(`CORS proxy ${proxy.name} failed: ${errorMsg}`);
        lastError = error instanceof Error ? error : new Error(errorMsg);
        continue;
      }
    }
    
    if (lastError) {
      throw new Error(`All CORS proxies failed: ${lastError.message}`);
    }
    throw new Error('All CORS proxies failed');
  };

  const fetchUrlList = useCallback(async (listUrl: string) => {
    setIsLoadingList(true);
    // Use CORS proxy for URLs that don't support CORS
    const needsProxy = listUrl.startsWith('https://pastebin.com/raw');
    
    try {
      let text: string;
      
      if (needsProxy) {
        text = await fetchWithCorsProxy(listUrl);
      } else {
        const response = await fetch(listUrl);
        text = await response.text();
      }
      const rawUrls = text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#') && !line.startsWith('//'))
        .map(line => {
          // Match Twitter/X URLs
          const twitterMatch = line.match(/^(https:\/\/(?:twitter\.com|x\.com)\/\w+\/status\/\d+)/);
          if (twitterMatch) return twitterMatch[1];
          
          // Match YouTube URLs
          const youtubeMatch = line.match(/^(https:\/\/(?:www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})[^\s]*)/);
          if (youtubeMatch) return youtubeMatch[1];
          
          return null;
        })
        .filter((url): url is string => url !== null);
      
      if (rawUrls.length > 0) {
        const { deduplicated, duplicatesRemoved } = deduplicateUrls(rawUrls);
        setUrlList(deduplicated);
        setLoadStats(prev => ({ ...prev, duplicatesRemoved }));
        setError(null);
      } else {
        if (looksLikeHtml(text)) {
          if (looksLikeCloudflareChallenge(text)) {
            setError('Pastebin is protected by Cloudflare and blocked the proxy. Please try again later or use a GitHub raw URL or Gist instead.');
          } else {
            setError('The URL list returned an HTML page instead of plain text. Make sure you are using a raw text URL.');
          }
        } else {
          setError('No valid Twitter/X or YouTube URLs found in the list');
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      // Provide more specific error messages
      if (needsProxy && errorMessage.toLowerCase().includes('cloudflare')) {
        setError('Pastebin is protected by Cloudflare and blocked the proxy. Please try again later or use a GitHub raw URL or Gist instead.');
      } else if (needsProxy && errorMessage.toLowerCase().includes('html')) {
        setError('A CORS proxy returned HTML instead of plain text. Make sure you are using a raw text URL, or try a GitHub raw URL or Gist instead.');
      } else if (needsProxy && errorMessage.includes('All CORS proxies failed')) {
        setError('All CORS proxies failed to load the URL. The services may be temporarily down. Please try again later or use a different URL source (GitHub, Gist).');
      } else if (needsProxy) {
        setError(`CORS proxy error: ${errorMessage}. Try using GitHub raw URLs or Gists instead.`);
      } else {
        setError(`Failed to load URL list: ${errorMessage}. Make sure the URL is accessible and contains valid Twitter/X URLs.`);
      }
      
      console.error('Failed to fetch URL list:', err);
    } finally {
      setIsLoadingList(false);
    }
  }, []);

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
  }, [fetchUrlList]);

  const fetchBatch = useCallback(async (batchIndex: number, isInitial = false) => {
    const startIndex = batchIndex * BATCH_SIZE;
    const endIndex = Math.min(startIndex + BATCH_SIZE, urlList.length);
    const batchUrls = urlList.slice(startIndex, endIndex);
    
    if (batchUrls.length === 0) {
      setHasMoreContent(false);
      return;
    }
    
    try {
      const promises = batchUrls.map(async (url): Promise<ContentItem> => {
        const contentType = getContentType(url);
        
        if (contentType === 'youtube') {
          return {
            type: 'youtube',
            url,
            id: url
          };
        } else if (contentType === 'twitter') {
          const apiUrl = normalizeXUrl(url);
          const response = await fetch(apiUrl);
          const data: ApiResponse = await response.json();
          
          if (data.code === 200) {
            return {
              type: 'twitter',
              url,
              data: data.tweet,
              id: data.tweet.id
            };
          }
          throw new Error(`Failed to fetch tweet: ${data.message}`);
        }
        
        throw new Error(`Unsupported content type for URL: ${url}`);
      });

      const results = await Promise.allSettled(promises);
      const successfulContent = results
        .filter((result): result is PromiseFulfilledResult<ContentItem> => result.status === 'fulfilled')
        .map(result => result.value);

      const failedCount = results.filter(result => result.status === 'rejected').length;
      
      if (isInitial) {
        setContentItems(successfulContent);
        setLoadStats(prev => ({
          ...prev,
          successful: successfulContent.length,
          failed: failedCount,
          total: urlList.length
        }));
      } else {
        let newContent: ContentItem[] = [];
        setContentItems(prev => {
          const existingIds = new Set(prev.map(item => item.id));
          newContent = successfulContent.filter(item => !existingIds.has(item.id));
          return [...prev, ...newContent];
        });
        setLoadStats(prev => ({
          ...prev,
          successful: prev.successful + newContent.length,
          failed: prev.failed + failedCount
        }));
      }
      
      setHasMoreContent(endIndex < urlList.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch content');
    }
  }, [urlList]);
  
  const loadMoreContent = useCallback(async () => {
    if (isLoadingMore || !hasMoreContent) return;
    
    setIsLoadingMore(true);
    const nextBatch = currentBatch + 1;
    await fetchBatch(nextBatch);
    setCurrentBatch(nextBatch);
    setIsLoadingMore(false);
  }, [isLoadingMore, hasMoreContent, currentBatch, fetchBatch]);

  useEffect(() => {
    const initializeContent = async () => {
      setLoading(true);
      
      if (urlList.length === 0) {
        setLoading(false);
        return;
      }
      
      setContentItems([]);
      setCurrentBatch(0);
      setHasMoreContent(true);
      
      await fetchBatch(0, true);
      setLoading(false);
    };

    initializeContent();
  }, [urlList, fetchBatch]);
  
  useEffect(() => {
    const handleScroll = () => {
      if (loading || isLoadingMore || !hasMoreContent) return;
      
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      if (scrollTop + windowHeight >= documentHeight - 1000) {
        loadMoreContent();
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, isLoadingMore, hasMoreContent, loadMoreContent]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="inline-flex items-center gap-3 bg-white rounded-full px-6 py-4 shadow-lg">
            <div className="flex gap-1">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
              <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
            </div>
            <span className="text-lg font-medium text-gray-700">Finding awesome posts...</span>
          </div>
        </div>
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
              title="Click to refresh and get new posts"
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
            <p className="text-blue-100 mt-1 sm:mt-2 text-sm sm:text-base">Fun and engaging content for curious minds</p>
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
          <div className="space-y-3">
            <div className="text-center">
              <h1 
                className="text-2xl sm:text-3xl font-bold text-white drop-shadow-sm cursor-pointer hover:text-blue-100 transition-colors flex items-center justify-center gap-2" 
                onClick={() => window.location.reload()}
                title="Click to refresh and get new posts"
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
              <p className="text-blue-100 mt-1 sm:mt-2 text-sm sm:text-base">Fun and engaging content for curious minds</p>
            </div>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => window.location.reload()}
                className="px-3 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-500 font-medium text-sm border border-white/30 transition-all hover:scale-105"
                title="Refresh to get new posts"
              >
                🔄 Refresh
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowDemoOptions(!showDemoOptions)}
                  className="px-3 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-500 font-medium text-sm border border-white/30"
                >
                  {showDemoOptions ? 'Hide' : 'Try Examples'} ▼
                </button>
                {showDemoOptions && (
                  <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-lg border z-10 w-72 sm:w-80 max-w-[calc(100vw-2rem)]">
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
                  <li>• <strong>Pastebin:</strong> Any public paste URL (uses multiple CORS proxies with fallback)</li>
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
          {contentItems.map((item) => {
            if (item.type === 'youtube') {
              return <YouTubeCard key={item.id} url={item.url} />;
            } else if (item.type === 'twitter' && item.data) {
              return <XPostCard key={item.id} tweet={item.data} />;
            }
            return null;
          })}
        </div>
        
        {isLoadingMore && (
          <div className="flex items-center justify-center py-8">
            <div className="inline-flex items-center gap-3 bg-white rounded-full px-5 py-3 shadow-md border border-gray-100">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0ms'}}></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{animationDelay: '200ms'}}></div>
                <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse" style={{animationDelay: '400ms'}}></div>
              </div>
              <span className="text-base font-medium text-gray-600">Getting more fun posts...</span>
            </div>
          </div>
        )}
        
        {!loading && !isLoadingMore && hasMoreContent && contentItems.length > 0 && (
          <div className="flex items-center justify-center py-8">
            <button
              onClick={loadMoreContent}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium transition-colors"
            >
              Load More Content
            </button>
          </div>
        )}
        
        {!loading && !hasMoreContent && contentItems.length > 0 && (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">🎉 All content loaded!</div>
          </div>
        )}
      </main>
      <ScrollToTop />
    </div>
  );
}
