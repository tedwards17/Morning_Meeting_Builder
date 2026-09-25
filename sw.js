// Generated from this exact build. Company API/media are deliberately not runtime-cached.
const CACHE='mmb-shell-02f7e569a0cd653a';
const URLS=["./", "./assets/index-Cf7UMjii-B941J1VO.js", "./assets/index-Djplhgp2.js", "./assets/index-Dz7rfxlo.css", "./assets/microsoft.cognitiveservices.speech.sdk-DTKS0Sqd.js", "./assets/rolldown-runtime-CbXtAM7H.js", "./assets/starter-items-1-CSK8NdQk.js", "./assets/starter-items-2-CuzduP7m.js", "./assets/starter-items-3-nd5oyQ4j.js", "./assets/starter-items-4-B2o9krMQ.js", "./assets/starter-template-riTzTBPC.js", "./assets/web-B2skKh-g-W35Hq6Nh.js", "./assets/web-CvhwepZE-xrfREi9G.js", "./assets/web-g5t7OFMZ-BtVE5x8A.js", "./icon-192.png", "./icon-512.png", "./icon.svg", "./index.html", "./manifest.webmanifest"];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(URLS))));
self.addEventListener('activate',event=>event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('mmb-shell-')&&k!==CACHE).map(k=>caches.delete(k)))),self.clients.claim()])));
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin||url.pathname.includes('/api/'))return;
if(event.request.mode==='navigate'){event.respondWith(fetch(event.request).catch(()=>caches.open(CACHE).then(c=>c.match(new URL('./',self.registration.scope).href))));return;}
event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match(event.request))||fetch(event.request)));
});
