'use client';

import { useEffect } from 'react';

export default function DynamicManifest() {
  useEffect(() => {
    const updateManifest = () => {
      const params = new URLSearchParams(window.location.search);
      const listParam = params.get('list');
      
      // Create manifest object
      const manifest = {
        name: "X Fun",
        short_name: "X Fun",
        description: "Fun and engaging content for curious minds",
        start_url: listParam ? `/?list=${listParam}` : '/',
        display: "standalone",
        background_color: "#000000",
        theme_color: "#1da1f2",
        orientation: "portrait-primary",
        categories: ["fun", "education", "children", "entertainment", "social"],
        icons: [
          {
            src: "/icon.svg",
            sizes: "any",
            type: "image/svg+xml"
          },
          {
            src: "/apple-icon.png",
            sizes: "180x180",
            type: "image/png"
          }
        ]
      };

      // Create blob URL for the manifest
      const manifestBlob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
      const manifestUrl = URL.createObjectURL(manifestBlob);

      // Remove existing manifest link
      const existingManifest = document.querySelector('link[rel="manifest"]');
      if (existingManifest) {
        existingManifest.remove();
      }

      // Add new manifest link
      const link = document.createElement('link');
      link.rel = 'manifest';
      link.href = manifestUrl;
      document.head.appendChild(link);
    };

    // Update manifest on mount
    updateManifest();

    // Listen for URL changes (for SPAs)
    const handlePopState = () => {
      updateManifest();
    };

    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  return null;
}