const CACHE_NAME = "meu-album-26-v1";

const OFFLINE_URL = "/offline";

const ARQUIVOS_INICIAIS = [
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/icon-192x192.png",
  "/icon-512x512.png",
  "/apple-touch-icon.png",
];

/*
 * Salva apenas os arquivos necessários
 * para exibir a página offline.
 */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        cache.addAll(ARQUIVOS_INICIAIS),
      ),
  );

  self.skipWaiting();
});

/*
 * Remove caches de versões anteriores.
 */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((nomesCaches) =>
        Promise.all(
          nomesCaches
            .filter(
              (nomeCache) =>
                nomeCache !== CACHE_NAME,
            )
            .map((nomeCache) =>
              caches.delete(nomeCache),
            ),
        ),
      ),
  );

  self.clients.claim();
});

/*
 * Para páginas:
 *
 * 1. tenta buscar normalmente na internet;
 * 2. se não houver conexão, mostra /offline.
 *
 * Dados autenticados não são colocados no cache.
 */
self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  if (request.mode !== "navigate") {
    return;
  }

  event.respondWith(
    (async () => {
      try {
        return await fetch(request);
      } catch {
        const paginaOffline =
          await caches.match(OFFLINE_URL);

        if (paginaOffline) {
          return paginaOffline;
        }

        return new Response(
          "Você está sem internet.",
          {
            status: 503,
            headers: {
              "Content-Type":
                "text/plain; charset=utf-8",
            },
          },
        );
      }
    })(),
  );
});