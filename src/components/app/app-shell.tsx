"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { registerServiceWorker } from "@/lib/pwa/register-service-worker";

const SPLASH_STORAGE_KEY = "nii-plants:splash-seen:v1";
const SPLASH_DURATION = 1200;

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function AppShell({ children }: { children: ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(
    null,
  );

  useEffect(() => {
    void registerServiceWorker();

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let splashTimer: number | undefined;

    try {
      if (sessionStorage.getItem(SPLASH_STORAGE_KEY) === "1" || reducedMotion) {
        sessionStorage.setItem(SPLASH_STORAGE_KEY, "1");
        splashTimer = window.setTimeout(() => setShowSplash(false), 0);
      } else {
        sessionStorage.setItem(SPLASH_STORAGE_KEY, "1");
        splashTimer = window.setTimeout(
          () => setShowSplash(false),
          SPLASH_DURATION,
        );
      }
    } catch {
      splashTimer = window.setTimeout(
        () => setShowSplash(false),
        reducedMotion ? 0 : SPLASH_DURATION,
      );
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      if (splashTimer !== undefined) window.clearTimeout(splashTimer);
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, []);

  async function handleInstall() {
    if (!installPrompt) return;

    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  }

  return (
    <>
      {children}
      {showSplash && (
        <div className="pwa-splash" data-testid="pwa-splash" aria-hidden="true">
          <div className="pwa-splash__glow" />
          <div className="pwa-splash__mark">
            <img
              src="/brand/nii-plants-logo.png"
              alt=""
              className="pwa-splash__logo"
            />
          </div>
          <span className="pwa-splash__label">Nii Plants Car Rentals</span>
          <div className="pwa-splash__progress" />
        </div>
      )}
      {installPrompt && (
        <button
          type="button"
          className="pwa-install-button min-h-11"
          onClick={() => void handleInstall()}
        >
          Install Nii Plants
        </button>
      )}
    </>
  );
}
