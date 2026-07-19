const CACHE_NAME = 'terapie-v2';
const ASSETS = ['/', '/index.html'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS).catch(()=>{})));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  if (e.request.url.includes('supabase.co')) {
    e.respondWith(fetch(e.request).catch(()=>new Response('Offline',{status:503})));
    return;
  }
  // Pagina principale: prova sempre prima la rete, così vedi subito le nuove versioni.
  // Se sei offline, usa l'ultima copia salvata.
  if (e.request.mode === 'navigate' || e.request.url.endsWith('/index.html') || e.request.url.endsWith('/')) {
    e.respondWith(
      fetch(e.request).then(resp => {
        const copy = resp.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, copy));
        return resp;
      }).catch(() => caches.match(e.request).then(c => c || caches.match('/')))
    );
    return;
  }
  // Altri file (icone, ecc.): cache-first va bene, cambiano raramente.
  e.respondWith(caches.match(e.request).then(c => c || fetch(e.request).catch(()=>caches.match('/'))));
});
