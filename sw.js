// Generated from this exact build. Company API/media are deliberately not runtime-cached.
const CACHE='mmb-shell-f32a9070c3887b7c';
const URLS=["./", "./assets/index-B-bRbWuZ.css", "./assets/index-BFaq-zpy.js", "./assets/index-Cf7UMjii-DWUFvTkx.js", "./assets/starter-items-1-CSK8NdQk.js", "./assets/starter-items-2-CuzduP7m.js", "./assets/starter-items-3-nd5oyQ4j.js", "./assets/starter-items-4-B2o9krMQ.js", "./assets/starter-template-riTzTBPC.js", "./assets/web-B2skKh-g-uuAAAHiM.js", "./assets/web-CvhwepZE-DdfpdxjJ.js", "./assets/web-g5t7OFMZ-Df-vWl2L.js", "./icon-192.png", "./icon-512.png", "./icon.svg", "./index.html", "./manifest.webmanifest", "./pcm-worklet.js"];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(URLS))));
self.addEventListener('activate',event=>event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('mmb-shell-')&&k!==CACHE).map(k=>caches.delete(k)))),self.clients.claim()])));
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(url.pathname.endsWith('/config.js')){event.respondWith(caches.open(CACHE).then(async cache=>{try{const response=await fetch(event.request);if(response.ok)await cache.put(event.request,response.clone());return response;}catch{return (await cache.match(event.request))||new Response('window.MMB_CONFIG={translationEnabled:false};',{headers:{'Content-Type':'application/javascript'}});}}));return;}
if(event.request.method!=='GET'||url.origin!==self.location.origin||(url.pathname.includes('/api/')||url.pathname.includes('/translation-api/')))return;
if(event.request.mode==='navigate'){event.respondWith(fetch(event.request).catch(()=>caches.open(CACHE).then(c=>c.match(new URL('./',self.registration.scope).href))));return;}
event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match(event.request))||fetch(event.request)));
});
