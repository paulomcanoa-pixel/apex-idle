const BUILD_SHELL=[];
const VERSION='apex-product-20261118c';
const CACHE=VERSION+'-static';
const SHELL=new Set(['/', '/index.html', '/style.css', '/night.css', '/src/v2.css', '/src/core/service-worker-update.js', '/manifest.webmanifest', ...BUILD_SHELL]);

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll([...SHELL])));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys()
    .then(keys=>Promise.all(keys.filter(key=>key.startsWith('apex-')&&key!==CACHE).map(key=>caches.delete(key))))
    .then(()=>self.clients.claim()));
});
self.addEventListener('message',event=>{
  if(event.data==='SKIP_WAITING')event.waitUntil(self.skipWaiting());
});

self.addEventListener('fetch',event=>{
  const request=event.request;
  const url=new URL(request.url);
  if(request.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/api/')||url.pathname==='/tuning.json')return;

  if(SHELL.has(url.pathname)){
    // Serve the HTML and startup scripts from the same installed release.
    // Retain the public config snapshot for offline play and refresh it online.
    event.respondWith(caches.open(CACHE).then(async cache=>{
      const cached=await cache.match(url.pathname);
      if(cached&&url.pathname!=='/config.js')return cached;
      try {
        const response=await fetch(request);
        if(response.ok&&url.pathname==='/config.js')await cache.put(url.pathname,response.clone()).catch(()=>{});
        return response.ok||!cached?response:cached;
      } catch {
        return cached||Response.error();
      }
    }));
    return;
  }
  event.respondWith(fetch(request).catch(()=>Response.error()));
});
