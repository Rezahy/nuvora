"use client";

import { useEffect } from "react";

/**
 * Registers the service worker (public/sw.js) in production builds.
 * Skipped in `next dev`, where a caching worker would serve stale code.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {
      // Registration can fail on insecure origins; the game still works online.
    });
  }, []);
  return null;
}
