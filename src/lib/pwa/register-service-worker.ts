export function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return Promise.resolve(undefined);
  }

  return navigator.serviceWorker.register("/sw.js").catch(() => undefined);
}
