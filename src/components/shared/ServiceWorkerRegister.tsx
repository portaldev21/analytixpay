"use client";

import { useEffect } from "react";

/**
 * Registers the service worker, which is what makes the app installable as a
 * real app on Android instead of a browser shortcut.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // An app that cannot be installed still works in the browser.
    });
  }, []);

  return null;
}
