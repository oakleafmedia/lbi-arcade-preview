// Decrypts the game on the fly. The key lives only in this browser (IndexedDB, non-extractable) after the password is entered.
const BASE = new URL('./', self.location).pathname, APP = BASE + 'app/';
const TYPES = { html: 'text/html', js: 'text/javascript', css: 'text/css', json: 'application/json', webp: 'image/webp', png: 'image/png', jpg: 'image/jpeg', svg: 'image/svg+xml', woff2: 'font/woff2', mp4: 'video/mp4', webm: 'video/webm', mp3: 'audio/mpeg', wav: 'audio/wav', ico: 'image/x-icon', txt: 'text/plain' };
let key = null, man = null;
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('message', (e) => { if (e.data && e.data.key) { key = e.data.key; man = null; } if (e.data === 'lock') { key = null; man = null; } });
function idbKey() {
  return new Promise((res) => { const r = indexedDB.open('sfc-gate', 1); r.onupgradeneeded = () => r.result.createObjectStore('k');
    r.onsuccess = () => { const g = r.result.transaction('k').objectStore('k').get('key'); g.onsuccess = () => res(g.result || null); g.onerror = () => res(null); }; r.onerror = () => res(null); });
}
async function dec(id) {
  const b = new Uint8Array(await (await fetch(BASE + 'e/' + id, { cache: 'no-cache' })).arrayBuffer());
  return crypto.subtle.decrypt({ name: 'AES-GCM', iv: b.slice(0, 12) }, key, b.slice(12));
}
async function serve(req) {
  const url = new URL(req.url);
  if (!key) key = await idbKey();
  if (!key) return Response.redirect(BASE, 302);
  if (!man) {
    try { man = JSON.parse(new TextDecoder().decode(await dec('m'))); }
    catch { key = null; await new Promise((res) => { const r = indexedDB.open('sfc-gate', 1); r.onsuccess = () => { const tx = r.result.transaction('k', 'readwrite'); tx.objectStore('k').delete('key'); tx.oncomplete = res; tx.onerror = res; }; r.onerror = res; }); return Response.redirect(BASE, 302); }
  }
  let rel = decodeURIComponent(url.pathname.slice(APP.length));
  if (rel.startsWith('api/')) return new Response(JSON.stringify({ error: 'Saving works on the Netlify link only' }), { status: 503, headers: { 'content-type': 'application/json' } });
  if (rel === '' || rel.endsWith('/')) rel += 'index.html';
  if (!man[rel] && man[rel + '/index.html']) return Response.redirect(url.pathname + '/' + url.search, 302);
  if (!man[rel]) return new Response('Not found', { status: 404 });
  const ext = rel.split('.').pop().toLowerCase();
  return new Response(await dec(man[rel]), { headers: { 'content-type': TYPES[ext] || 'application/octet-stream', 'cache-control': 'no-store' } });
}
self.addEventListener('fetch', (e) => { const u = new URL(e.request.url); if (u.origin === self.location.origin && u.pathname.startsWith(APP)) e.respondWith(serve(e.request)); });
