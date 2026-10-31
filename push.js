/* 携帯への通知の登録（現場一覧・予定表で使う。2026/10/31 社員全員が受け取れるように）
   pushTokens/{id}：{token, who（正式名）, at, ua}。どの通知をだれに送るかは Functions で決める
   （注文・工程表 → 西崎さんだけ、予定表 → その予定に入っている人だけ） */
import {getMessaging,getToken,isSupported} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging.js";
import {doc,setDoc} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const VAPID_KEY="BIgE1nu5kfTRSKcNKpx7qwDm28Sk7_BrNUotCE2QK3Lc71ai3kB6CsHDJt-XXlJ3nlkqE2PP1lwNgm7wgRF5Y1g";

export async function pushToken(app,fs,name,ask){
  if(ask&&Notification.permission!=="granted"&&await Notification.requestPermission()!=="granted")return "";
  if(Notification.permission!=="granted")return "";
  const reg=await navigator.serviceWorker.register("sw.js");await navigator.serviceWorker.ready;
  const t=await getToken(getMessaging(app),{vapidKey:VAPID_KEY,serviceWorkerRegistration:reg});
  if(t)await setDoc(doc(fs,"pushTokens",t.slice(-40).replace(/[^A-Za-z0-9_-]/g,"_")),{token:t,who:name||"",at:Date.now(),ua:navigator.userAgent.slice(0,120)});
  return t;
}

/* box：欄を出す要素、name()：この携帯を使う人の正式名（まだなら ""）、pickName(then)：名前を選ばせる */
export async function renderPushBox({box,app,fs,name,pickName,h,toast}){
  if(!box||!fs){if(box)box.hidden=true;return;}
  const ok="serviceWorker" in navigator&&"Notification" in window&&"PushManager" in window&&await isSupported().catch(()=>false);
  const home=matchMedia("(display-mode: standalone)").matches||navigator.standalone;
  // もう受け取っている携帯は、開くたびに登録（と名前）を新しくするだけ（欄は出さない）
  if(ok&&Notification.permission==="granted"){box.hidden=true;if(name())pushToken(app,fs,name(),false).catch(()=>{});return;}
  // 一度「あとで」を押した携帯には出さない
  try{if(localStorage.getItem("kouken-push-later")==="1"){box.hidden=true;return;}}catch(e){}
  box.hidden=false;
  const later=h("button",{type:"button",class:"btn ghost small",onclick:()=>{try{localStorage.setItem("kouken-push-later","1");}catch(e){}box.hidden=true;}},"あとで");
  if(!ok){box.replaceChildren(h("h3",{text:"通知をこの携帯で受け取る"}),
    h("p",{class:"hint",text:home?"この携帯は通知に対応していません。iPhoneは「設定」→「一般」→「ソフトウェアアップデート」でiOSを新しくしてください。":"iPhoneは、Safariの共有ボタン（□に↑）→「ホーム画面に追加」をして、ホーム画面のコウケンのアイコンから開いてください。そこで通知を受け取れるようになります。"}),later);return;}
  if(Notification.permission==="denied"){box.replaceChildren(h("h3",{text:"通知が止められています"}),
    h("p",{class:"hint",text:"携帯の「設定」→「通知」→「コウケン」（またはブラウザ）で通知を許可してください。"}),later);return;}
  const err=h("p",{class:"err",hidden:true});
  const go=h("button",{type:"button",class:"btn small",onclick:()=>{
    const run=async()=>{go.disabled=true;err.hidden=true;
      try{const t=await pushToken(app,fs,name(),true);if(t){toast("通知を受け取れるようにしました");box.hidden=true;}else{err.textContent="通知が許可されませんでした。";err.hidden=false;}}
      catch(x){err.textContent="うまく登録できませんでした（"+(x&&x.code||x&&x.message||"")+"）";err.hidden=false;}
      go.disabled=false;};
    if(name())run();else pickName(run);}},"通知を受け取る");
  box.replaceChildren(h("h3",{text:"通知をこの携帯で受け取る"}),
    h("p",{class:"hint",text:"予定表にあなたの予定が入ったり変わったりしたら、すぐこの携帯に通知が届きます。"}),
    h("div",{class:"rowbtns"},go,later),err);
}
