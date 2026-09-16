'use client';

import { useEffect } from 'react';
import { buildListPath } from '../utils/urlDetection';

export default function DynamicManifest({ listUrl }: { listUrl?: string }) {
  useEffect(() => {
    const origin = window.location.origin;
    // Blob manifests need absolute URLs; relative URLs cannot resolve against blob:.
    const manifest = {
      name: 'X Fun',
      short_name: 'X Fun',
      description: 'Fun and engaging content for curious minds',
      start_url: new URL(buildListPath(window.location.pathname, listUrl), origin).href,
      scope: `${origin}/`,
      display: 'standalone',
      background_color: '#000000',
      theme_color: '#1da1f2',
      orientation: 'portrait-primary',
      categories: ['fun', 'education', 'children', 'entertainment', 'social'],
      icons: [
        { src: `${origin}/icon.svg`, sizes: 'any', type: 'image/svg+xml' },
        { src: `${origin}/apple-icon.png`, sizes: '180x180', type: 'image/png' },
      ],
    };
    const manifestUrl = URL.createObjectURL(
      new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' }),
    );
    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = manifestUrl;
    document.head.appendChild(link);
    return () => {
      link.remove();
      URL.revokeObjectURL(manifestUrl);
    };
  }, [listUrl]);

  return null;
}
