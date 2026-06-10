import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

// New revision per build so the precached app shell is refetched on every deploy.
const appShellRevision = crypto.randomUUID();

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  // Precache the app shell so navigations can fall back to HTML that matches
  // the precached assets of the current build (see fallbacks in app/sw.ts).
  additionalPrecacheEntries: [{ url: "/", revision: appShellRevision }],
});

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
};

export default withSerwist(nextConfig);
