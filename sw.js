/* Agenda cultural · service worker
   Funciona sin conexión con lo último descargado.
   Sube el número de CACHE al publicar cambios en los ficheros estáticos. */
const CACHE = "agenda-v1";
const CLAVE_DATOS = "datos-agenda";
const SHELL = [
  "./", "./index.html", "./manifest.webmanifest", "./eventos.json",
  "./icon-180.png", "./icon-192.png", "./icon-512.png",
  "./icon-maskable-512.png", "./favicon-64.png"
];

self.addEventListener("install", function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(SHELL); })
    .then(function(){ return self.skipWaiting(); }));
});

self.addEventListener("activate", function(e){
  e.waitUntil(caches.keys().then(function(ks){
      return Promise.all(ks.filter(function(k){ return k !== CACHE; })
                           .map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); }));
});

self.addEventListener("fetch", function(e){
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  const esDatos = url.pathname.endsWith("eventos.json");
  const esNavegacion = req.mode === "navigate";

  if (esDatos || esNavegacion) {
    const clave = esDatos ? CLAVE_DATOS : req;
    e.respondWith(fetch(req).then(function(r){
        const copia = r.clone();
        caches.open(CACHE).then(function(c){ c.put(clave, copia); });
        return r;
      }).catch(function(){
        return caches.match(clave).then(function(r){ return r || caches.match("./index.html"); });
      }));
    return;
  }

  e.respondWith(caches.match(req).then(function(r){
    return r || fetch(req).then(function(resp){
      const copia = resp.clone();
      caches.open(CACHE).then(function(c){ c.put(req, copia); });
      return resp;
    });
  }));
});
