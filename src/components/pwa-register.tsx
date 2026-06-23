"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    /*
     * Evita Service Worker durante npm run dev,
     * pois o cache pode atrapalhar o desenvolvimento.
     */
    if (process.env.NODE_ENV !== "production") {
      return;
    }

    if (!("serviceWorker" in navigator)) {
      return;
    }

    async function registrarServiceWorker() {
      try {
        await navigator.serviceWorker.register(
          "/sw.js",
          {
            scope: "/",
            updateViaCache: "none",
          },
        );
      } catch (error) {
        console.error(
          "Não foi possível registrar o Service Worker:",
          error,
        );
      }
    }

    registrarServiceWorker();
  }, []);

  return null;
}