'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePwaState() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const updateNetwork = () => setIsOnline(window.navigator.onLine);
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const updateStandalone = () =>
      setIsStandalone(
        mediaQuery.matches ||
          (window.navigator as Navigator & { standalone?: boolean }).standalone ===
            true,
      );

    updateNetwork();
    updateStandalone();

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener('online', updateNetwork);
    window.addEventListener('offline', updateNetwork);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    mediaQuery.addEventListener('change', updateStandalone);

    return () => {
      window.removeEventListener('online', updateNetwork);
      window.removeEventListener('offline', updateNetwork);
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt,
      );
      mediaQuery.removeEventListener('change', updateStandalone);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) {
      return false;
    }

    const prompt = deferredPrompt;
    setDeferredPrompt(null);

    await prompt.prompt();
    const choice = await prompt.userChoice;
    return choice.outcome === 'accepted';
  };

  return {
    canInstall: Boolean(deferredPrompt) && !isStandalone,
    installApp,
    isOnline,
    isStandalone,
  };
}
