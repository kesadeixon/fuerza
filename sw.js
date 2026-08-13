const CACHE = "fuerza-v2";
const IMG = ["d1e1","d1e2","d1e3","d1e4","d1e5","d1e6",
  "d2e1","d2e2","d2e3","d2e4","d2e5","d2e6","d2e7","d2e8",
  "d3e1","d3e2","d3e3","d3e4","d3e5","d3e6","d3e7"].map(id => "./img/"+id+".png");
const ASSETS = [
  "./","./index.html","./manifest.webmanifest",
  "./icon-192.png","./icon-512.png","./apple-touch-icon.png"
].concat(IMG);

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const isNav = e.request.mode === "navigate" ||
    (e.request.headers.get("accept") || "").includes("text/html");

  if (isNav) {
    // Red primero para el HTML: siempre la última versión si hay conexión
    e.respondWith(
      fetch(e.request)
        .then((resp) => { const c = resp.clone(); caches.open(CACHE).then((ch) => ch.put("./index.html", c)).catch(() => {}); return resp; })
        .catch(() => caches.match("./index.html").then((r) => r || caches.match("./")))
    );
    return;
  }
  // Resto (imágenes, iconos, manifest): caché primero
  e.respondWith(
    caches.match(e.request).then((cached) =>
      cached || fetch(e.request).then((resp) => {
        const copy = resp.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        return resp;
      }).catch(() => cached)
    )
  );
});
