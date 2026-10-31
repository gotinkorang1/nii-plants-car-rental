"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { registerServiceWorker } from "@/lib/pwa/register-service-worker";

const SPLASH_STORAGE_KEY = "nii-plants:splash-seen:v1";
const INSTALL_DISMISSED_KEY = "nii-plants:install-dismissed:v1";
const SPLASH_DURATION = 1200;

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function AppShell({ children }: { children: ReactNode }) {
  const [showSplash, setShowSplash] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(
    null,
  );
  const installDismissedRef = useRef(false);

  useEffect(() => {
    void registerServiceWorker();

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const installed =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    let splashTimer: number | undefined;
    let splashStartTimer: number | undefined;

    try {
      if (sessionStorage.getItem(SPLASH_STORAGE_KEY) === "1" || reducedMotion) {
        sessionStorage.setItem(SPLASH_STORAGE_KEY, "1");
        splashTimer = undefined;
      } else {
        sessionStorage.setItem(SPLASH_STORAGE_KEY, "1");
        splashStartTimer = window.setTimeout(() => setShowSplash(true), 0);
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

    try {
      installDismissedRef.current =
        sessionStorage.getItem(INSTALL_DISMISSED_KEY) === "1";
    } catch {
      installDismissedRef.current = false;
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      if (installed || installDismissedRef.current) return;
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      if (splashTimer !== undefined) window.clearTimeout(splashTimer);
      if (splashStartTimer !== undefined) window.clearTimeout(splashStartTimer);
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, []);

  async function handleInstall() {
    if (!installPrompt) return;

    try {
      await installPrompt.prompt();
      await installPrompt.userChoice;
    } catch {
      // The browser can reject a prompt when installation is no longer available.
    } finally {
      setInstallPrompt(null);
    }
  }

  function handleDismissInstall() {
    installDismissedRef.current = true;
    try {
      sessionStorage.setItem(INSTALL_DISMISSED_KEY, "1");
    } catch {
      // Session storage can be unavailable in restricted browser contexts.
    }
    setInstallPrompt(null);
  }

  return (
    <>
      {children}
      {showSplash && (
        <div className="pwa-splash" data-testid="pwa-splash" aria-hidden="true">
          <div className="pwa-splash__glow" />
          <div className="pwa-splash__mark">
            <Image
              src="/brand/nii-plants-logo.png"
              alt=""
              width={84}
              height={84}
              className="pwa-splash__logo"
            />
          </div>
          <span className="pwa-splash__label">Nii Plants Car Rentals</span>
          <div className="pwa-splash__progress" />
        </div>
      )}
      {installPrompt && (
        <div className="pwa-install-affordance">
          <button
            type="button"
            className="pwa-install-button min-h-11"
            onClick={() => void handleInstall()}
          >
            Install Nii Plants
          </button>
          <button
            type="button"
            className="pwa-install-dismiss min-h-11"
            aria-label="Dismiss install prompt"
            onClick={handleDismissInstall}
          >
            ×
          </button>
        </div>
      )}
    </>
  );
}
