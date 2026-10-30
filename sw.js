/* 携帯への通知（材料の注文が来たとき）。中身は Firebase の通知（data）から出す（2026/10/30） */
self.addEventListener("install",()=>self.skipWaiting());
self.addEventListener("activate",e=>e.waitUntil(self.clients.claim()));
self.addEventListener("push",e=>{
  let p={};try{p=e.data?e.data.json():{};}catch(x){}
  const d=p.data||p.notification||p||{};
  e.waitUntil(self.registration.showNotification(d.title||"材料の注文",{body:d.body||"",icon:"apple-touch-icon.png",badge:"favicon.png",tag:d.tag||undefined,data:{url:d.url||"genba.html"}}));
});
// 通知を押したら、その現場の注文の画面を開く。アプリが開いていれば、その画面を切り替える（iPhone は navigate が使えないので知らせて切り替えてもらう）
self.addEventListener("notificationclick",e=>{
  e.notification.close();
  const url=new URL((e.notification.data&&e.notification.data.url)||"genba.html",self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({type:"window",includeUncontrolled:true}).then(async ws=>{
    const w=ws[0];
    if(w){w.postMessage({type:"open",url});try{await w.focus();}catch(x){}return;}
    return self.clients.openWindow(url);
  }));
});
