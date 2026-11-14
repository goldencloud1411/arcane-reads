const CACHE='arcane-reads-v0-8-0';
const ASSETS=['./','./index.html','./app.js?v=7.0','./extra.js?v=8.0','./site.webmanifest?v=7.0','./icon-192.png','./icon-512.png','./icon-180.png','./icon-maskable-512.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(n=>n.startsWith('arcane-reads-')&&n!==CACHE).map(n=>caches.delete(n)))).then(()=>self.clients.claim())));
// Red primero (siempre la versión más nueva); si no hay conexión, caché. Incluye fuentes y portadas.
self.addEventListener('fetch',e=>{
  const r=e.request; if(r.method!=='GET') return;
  const u=new URL(r.url), same=u.origin===self.location.origin;
  const cacheable=same||/fonts\.(googleapis|gstatic)\.com|covers\.openlibrary\.org|books\.google/.test(u.hostname);
  if(!cacheable) return;
  e.respondWith(fetch(r).then(res=>{if(res.ok||res.type==='opaque'){const copy=res.clone();caches.open(CACHE).then(c=>c.put(r,copy))}return res}).catch(()=>caches.match(r).then(m=>m||(r.mode==='navigate'?caches.match('./index.html'):Response.error()))));
});
