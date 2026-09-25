// Generated from this exact build. Company API/media are deliberately not runtime-cached.
const CACHE='mmb-shell-51b862290fefb104';
const URLS=["./", "./assets/index-46kwDikO.js", "./assets/index-9kohbLsv.css", "./assets/index-Cf7UMjii-BGuNkSkI.js", "./assets/starter-items-1-CSK8NdQk.js", "./assets/starter-items-2-CuzduP7m.js", "./assets/starter-items-3-nd5oyQ4j.js", "./assets/starter-items-4-B2o9krMQ.js", "./assets/starter-template-riTzTBPC.js", "./assets/web-B2skKh-g-Cy06uQS1.js", "./assets/web-CvhwepZE-B7kj7A5b.js", "./assets/web-g5t7OFMZ-v90EXH64.js", "./icon-192.png", "./icon-512.png", "./icon.svg", "./index.html", "./manifest.webmanifest"];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(URLS))));
self.addEventListener('activate',event=>event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('mmb-shell-')&&k!==CACHE).map(k=>caches.delete(k)))),self.clients.claim()])));
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin||url.pathname.includes('/api/'))return;
if(event.request.mode==='navigate'){event.respondWith(fetch(event.request).catch(()=>caches.open(CACHE).then(c=>c.match(new URL('./',self.registration.scope).href))));return;}
event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match(event.request))||fetch(event.request)));
});
