// Generated from this exact build. Company API/media are deliberately not runtime-cached.
const CACHE='mmb-shell-d3afe50d574561bf';
const URLS=["./", "./assets/index-BCa4LCTt.js", "./assets/index-BSPHUTIz.css", "./assets/index-Cf7UMjii-rPXAYMDb.js", "./assets/web-B2skKh-g-DeSIeTvh.js", "./assets/web-CvhwepZE-Bpyq98_s.js", "./assets/web-g5t7OFMZ-DJI_yc43.js", "./icon-192.png", "./icon-512.png", "./icon.svg", "./index.html", "./manifest.webmanifest"];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(URLS))));
self.addEventListener('activate',event=>event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('mmb-shell-')&&k!==CACHE).map(k=>caches.delete(k)))),self.clients.claim()])));
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin||url.pathname.includes('/api/'))return;
if(event.request.mode==='navigate'){event.respondWith(fetch(event.request).catch(()=>caches.open(CACHE).then(c=>c.match(new URL('./',self.registration.scope).href))));return;}
event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match(event.request))||fetch(event.request)));
});
