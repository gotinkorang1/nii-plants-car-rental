export function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return Promise.resolve(undefined);
  }

  try {
    return Promise.resolve(navigator.serviceWorker.register("/sw.js")).catch(
      () => undefined,
    );
  } catch {
    return Promise.resolve(undefined);
  }
}
