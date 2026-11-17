/* Zoryka — service worker
 * - Telas e arquivos do app ficam guardados: abre e navega sem internet.
 * - Recebe notificações push (lembretes) e abre o app ao tocar nelas.
 * Mude a versão para descartar caches antigos.
 */
const VERSAO = "zoryka-v3";
const CACHE_APP = `${VERSAO}-app`;
const CACHE_PAGINAS = `${VERSAO}-paginas`;

// Telas do app (o HTML é igual para todos; os dados vêm do aparelho/servidor).
const TELAS = ["/hoje", "/habitos", "/evolucao", "/perfil", "/configuracoes", "/onboarding", "/entrar", "/offline"];
const ARQUIVOS = ["/manifest.webmanifest", "/icon.svg", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const app = await caches.open(CACHE_APP);
      await Promise.all(ARQUIVOS.map((u) => app.add(u).catch(() => undefined)));
      const paginas = await caches.open(CACHE_PAGINAS);
      await Promise.all(
        TELAS.map(async (u) => {
          try {
            const r = await fetch(u, { credentials: "same-origin" });
            // Sem login, o servidor redireciona para /entrar: não guarda a resposta redirecionada.
            if (r.ok && !r.redirected) {
              // Guarda também os scripts/estilos que a tela usa: assim ela abre inteira sem internet.
              // Lê o HTML uma vez (sem clone: no service worker um clone não lido segura a conexão).
              const html = await r.text();
              await paginas.put(u, new Response(html, { status: 200, headers: r.headers }));
              const assets = [...new Set(html.match(/\/_next\/static\/[\w\-./()[\]%@]+?\.(?:js|css|woff2)/g) || [])];
              for (const a of assets) {
                if (!(await app.match(a))) await app.add(a).catch(() => undefined);
              }
            }
          } catch {
            // sem rede na instalação: guarda depois, ao navegar
          }
        }),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const nomes = await caches.keys();
      await Promise.all(nomes.filter((n) => !n.startsWith(VERSAO)).map((n) => caches.delete(n)));
      await self.clients.claim();
    })(),
  );
});

/** Rede primeiro (com limite de tempo); sem rede, o que estiver guardado. */
async function redePrimeiro(request, cacheName, timeoutMs) {
  const cache = await caches.open(cacheName);
  try {
    const resposta = await Promise.race([
      fetch(request),
      new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), timeoutMs)),
    ]);
    if (resposta.ok && !resposta.redirected) cache.put(request, resposta.clone());
    return resposta;
  } catch {
    const guardada = await cache.match(request, { ignoreSearch: request.mode === "navigate" });
    if (guardada) return guardada;
    if (request.mode === "navigate") {
      return (await cache.match("/offline")) ?? new Response("Sem conexão", { status: 503 });
    }
    return Response.error();
  }
}

/** Arquivos com nome versionado (/_next/static) nunca mudam: guardado primeiro. */
async function guardadoPrimeiro(request) {
  const cache = await caches.open(CACHE_APP);
  const guardada = await cache.match(request);
  if (guardada) return guardada;
  const resposta = await fetch(request);
  if (resposta.ok) cache.put(request, resposta.clone());
  return resposta;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // Supabase etc.: direto na rede
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/") || url.pathname === "/sw.js") return;

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/") || /\.(woff2?|png|svg|ico)$/.test(url.pathname)) {
    event.respondWith(guardadoPrimeiro(request));
    return;
  }
  if (request.mode === "navigate") {
    event.respondWith(redePrimeiro(request, CACHE_PAGINAS, 4000));
    return;
  }
  // Dados de navegação do Next (RSC) e demais GETs do próprio app
  event.respondWith(redePrimeiro(request, CACHE_PAGINAS, 4000));
});

// O app manda a lista de arquivos que já carregou, para ficarem disponíveis offline.
self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.tipo === "guardar" && Array.isArray(data.urls)) {
    event.waitUntil(
      caches.open(CACHE_APP).then((c) =>
        Promise.all(
          data.urls
            .filter((u) => typeof u === "string" && u.startsWith(self.location.origin + "/_next/static/"))
            .map((u) => c.match(u).then((m) => m || c.add(u).catch(() => undefined))),
        ),
      ),
    );
  }
});

// ── Notificações ─────────────────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  let dados = {};
  try {
    dados = event.data ? event.data.json() : {};
  } catch {
    dados = { title: "Zoryka", body: event.data ? event.data.text() : "" };
  }
  const titulo = dados.title || "Zoryka";
  event.waitUntil(
    self.registration.showNotification(titulo, {
      body: dados.body || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/badge-96.png",
      tag: dados.tag || undefined,
      data: { url: dados.url || "/hoje" },
      lang: "pt-BR",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const destino = new URL((event.notification.data && event.notification.data.url) || "/hoje", self.location.origin).href;
  event.waitUntil(
    (async () => {
      const janelas = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const j of janelas) {
        if (new URL(j.url).origin === self.location.origin) {
          await j.focus();
          if ("navigate" in j) await j.navigate(destino);
          return;
        }
      }
      await self.clients.openWindow(destino);
    })(),
  );
});
