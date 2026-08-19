"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

type RailState = "idle" | "pending" | "complete";

function isInternalNavigation(anchor: HTMLAnchorElement, event: MouseEvent) {
  if (event.defaultPrevented || event.button !== 0) {
    return false;
  }

  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return false;
  }

  if (anchor.target && anchor.target !== "_self") {
    return false;
  }

  const href = anchor.getAttribute("href");
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return false;
  }

  const url = new URL(anchor.href, window.location.href);
  if (url.origin !== window.location.origin) {
    return false;
  }

  return url.pathname !== window.location.pathname || url.search !== window.location.search;
}

export function SiteRail() {
  const pathname = usePathname();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [railState, setRailState] = useState<RailState>("idle");
  const [railPath, setRailPath] = useState(pathname);

  if (railPath !== pathname) {
    setRailPath(pathname);
    setRailState("complete");
  }

  useEffect(() => {
    function updateScroll() {
      const root = document.documentElement;
      const max = root.scrollHeight - root.clientHeight;
      setScrollProgress(max <= 0 ? 0 : Math.min(1, root.scrollTop / max));
    }

    updateScroll();
    window.addEventListener("scroll", updateScroll, { passive: true });
    return () => window.removeEventListener("scroll", updateScroll);
  }, [pathname]);

  useEffect(() => {
    if (railState !== "complete") {
      return;
    }

    const timeout = window.setTimeout(() => setRailState("idle"), 420);
    return () => window.clearTimeout(timeout);
  }, [railState]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = (event.target as HTMLElement | null)?.closest("a");
      if (!(target instanceof HTMLAnchorElement) || !isInternalNavigation(target, event)) {
        return;
      }

      setRailState("pending");
    }

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const scale =
    railState === "pending" ? 0.72 : railState === "complete" ? 1 : scrollProgress;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 print:hidden"
    >
      <div
        className={cn(
          "h-full w-full origin-left bg-accent transition-transform",
          railState === "idle" ? "duration-75" : "duration-500",
          railState === "pending" && "animate-pulse",
        )}
        style={{ transform: `scaleX(${scale})` }}
      />
    </div>
  );
}
