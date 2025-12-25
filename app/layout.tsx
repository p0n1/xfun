import type { Metadata } from "next";
import "./globals.css";
import DynamicManifest from "./components/DynamicManifest";


export const metadata: Metadata = {
  title: "X Fun",
  description: "Fun and engaging content for curious minds",
  // Twitter now returns 403 for hotlinked videos when a third-party Referer is present.
  // Using a no-referrer policy fixes direct video.twimg.com playback without a server proxy.
  referrer: "no-referrer",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "X Fun",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1da1f2",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="antialiased"
      >
        <DynamicManifest />
        {children}
      </body>
    </html>
  );
}
