// Generated from this exact build. Company API/media are deliberately not runtime-cached.
const CACHE='mmb-shell-37187afba9c70294';
const URLS=["./", "./assets/index-BL97BVpi.css", "./assets/index-Bv-IuVAH.js", "./assets/index-Cf7UMjii-D5aKghfy.js", "./assets/starter-items-1-CCrKEabB.js", "./assets/starter-items-2-DfbtbrbW.js", "./assets/starter-items-3-CTATI2PM.js", "./assets/starter-items-4-CSZnli1b.js", "./assets/starter-template-DLmuKnQb.js", "./assets/web-B2skKh-g-CE8EIRtb.js", "./assets/web-CvhwepZE-CMwSOflc.js", "./assets/web-g5t7OFMZ-Dbd25rFg.js", "./icon-192.png", "./icon-512.png", "./icon.svg", "./index.html", "./manifest.webmanifest"];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(URLS))));
self.addEventListener('activate',event=>event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('mmb-shell-')&&k!==CACHE).map(k=>caches.delete(k)))),self.clients.claim()])));
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin||url.pathname.includes('/api/'))return;
if(event.request.mode==='navigate'){event.respondWith(fetch(event.request).catch(()=>caches.open(CACHE).then(c=>c.match(new URL('./',self.registration.scope).href))));return;}
event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match(event.request))||fetch(event.request)));
});
