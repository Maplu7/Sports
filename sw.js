
const CACHE="cozy-game-day-v1";
const SHELL=["./","./index.html","./manifest.webmanifest","./icon-192.png","./icon-512.png"];
self.addEventListener("install",e=>{
 e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",e=>{
 e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch",e=>{
 if(e.request.method!=="GET")return;
 if(e.request.mode==="navigate"){
  e.respondWith(fetch(e.request).catch(()=>caches.match("./index.html")));
  return;
 }
 e.respondWith(caches.match(e.request).then(cached=>cached||fetch(e.request)));
});
self.addEventListener("notificationclick",e=>{
 e.notification.close();
 e.waitUntil(clients.matchAll({type:"window",includeUncontrolled:true}).then(list=>{
  for(const c of list){if("focus" in c)return c.focus()}
  if(clients.openWindow)return clients.openWindow("./");
 }));
});
