import pathlib,hashlib,json,sys
root=pathlib.Path(sys.argv[1]);files=sorted(p for p in root.rglob('*') if p.is_file() and p.name not in ['sw.js','.nojekyll','config.js'])
version=hashlib.sha256(b''.join(p.read_bytes() for p in files)).hexdigest()[:16]
urls=['./']+['./'+p.relative_to(root).as_posix() for p in files]
(root/'sw.js').write_text('''// Generated from this exact build. Company API/media are deliberately not runtime-cached.
const CACHE='mmb-shell-'''+version+'''';
const URLS='''+json.dumps(urls)+''';
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(URLS))));
self.addEventListener('activate',event=>event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('mmb-shell-')&&k!==CACHE).map(k=>caches.delete(k)))),self.clients.claim()])));
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(url.pathname.endsWith('/config.js')){event.respondWith(caches.open(CACHE).then(async cache=>{try{const response=await fetch(event.request);if(response.ok)await cache.put(event.request,response.clone());return response;}catch{return (await cache.match(event.request))||new Response('window.MMB_CONFIG={translationEnabled:false};',{headers:{'Content-Type':'application/javascript'}});}}));return;}
if(event.request.method!=='GET'||url.origin!==self.location.origin||(url.pathname.includes('/api/')||url.pathname.includes('/translation-api/')))return;
if(event.request.mode==='navigate'){event.respondWith(fetch(event.request).catch(()=>caches.open(CACHE).then(c=>c.match(new URL('./',self.registration.scope).href))));return;}
event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match(event.request))||fetch(event.request)));
});
''')
(root/'.nojekyll').write_text('')
print('PWA shell:',version,len(urls),'assets')
