const CACHE="cozy-game-day-v7-espn-failover";
const SHELL=["./manifest.webmanifest","./icon-192.png","./icon-512.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
 if(e.request.method!=="GET")return;
 const u=new URL(e.request.url);
 if(u.pathname.startsWith("/api/")||u.pathname.startsWith("/.netlify/functions/")){e.respondWith(fetch(e.request,{cache:"no-store"}));return}
 if(e.request.mode==="navigate"){
  e.respondWith(fetch(e.request,{cache:"no-store"}).then(r=>{const c=r.clone();caches.open(CACHE).then(x=>x.put("./index.html",c));return r}).catch(()=>caches.match("./index.html")));
  return;
 }
 e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request)));
});
self.addEventListener("notificationclick",e=>{e.notification.close();e.waitUntil(clients.matchAll({type:"window",includeUncontrolled:true}).then(list=>{for(const c of list){if("focus" in c)return c.focus()}return clients.openWindow?clients.openWindow("./"):undefined}))});