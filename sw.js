/* Offline cache for the hosted web version only (Electron / Capacitor don't register it). */
const V = 'msa-v21';
const CORE = ['./'].concat(["index.html", "css/style.css", "js/i18n.js", "js/icons.js", "js/db.js", "js/ui.js", "js/know.js", "js/rates.js", "js/connectors.js", "js/projects.js", "js/tpl.js", "js/suggest.js", "js/explore.js", "js/studio.js", "js/pdf.js", "js/demo.js", "js/refs.js", "js/map.js", "js/clients.js", "js/completed.js", "js/learning.js", "js/tasks.js", "js/permissions.js", "js/settings.js", "js/capture.js", "js/art.js", "js/home.js", "js/lock.js", "js/native.js", "js/biz.js", "js/tools.js", "js/apps.js", "js/sync.js", "js/board.js", "js/app.js", "icons/icon-192.png", "icons/icon-512.png", "icons/maskable-512.png", "icons/apple-touch-icon.png", "icons/favicon.png", "assets/img-0fb45762.png", "assets/img-7989f345.jpg", "assets/img-94fe3f77.png", "assets/img-e1e7e6d4.png"]);
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(fetch(r).then(res => { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); return res; }).catch(() => caches.match(r).then(m => m || caches.match('./'))));
});
