// Generated from this exact build. Company API/media are deliberately not runtime-cached.
const CACHE='mmb-shell-1c38a8dfb5f7c0b0';
const URLS=["./", "./assets/index-Cf7UMjii-W2q-iOYG.js", "./assets/index-DpKEPb5O.js", "./assets/index-qK1bQ60m.css", "./assets/starter-items-1-CCrKEabB.js", "./assets/starter-items-2-DfbtbrbW.js", "./assets/starter-items-3-CTATI2PM.js", "./assets/starter-items-4-CSZnli1b.js", "./assets/starter-template-DLmuKnQb.js", "./assets/web-B2skKh-g-Bj8AkqtO.js", "./assets/web-CvhwepZE-CMOFRLkV.js", "./assets/web-g5t7OFMZ-CC8uQ8tb.js", "./icon-192.png", "./icon-512.png", "./icon.svg", "./index.html", "./manifest.webmanifest"];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(URLS))));
self.addEventListener('activate',event=>event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('mmb-shell-')&&k!==CACHE).map(k=>caches.delete(k)))),self.clients.claim()])));
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin||url.pathname.includes('/api/'))return;
if(event.request.mode==='navigate'){event.respondWith(fetch(event.request).catch(()=>caches.open(CACHE).then(c=>c.match(new URL('./',self.registration.scope).href))));return;}
event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match(event.request))||fetch(event.request)));
});
