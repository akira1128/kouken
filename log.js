/* アプリを開いた記録（ログイン履歴）を残す（2026/11/02 ユーザー）
   logins/{id}：{uid, who（名前）, page（画面）, at, ua, home（ホーム画面のアプリから開いたか）}
   見られるのは西崎さんだけ（firestore.rules）。同じ携帯・同じ画面は30分に1回だけ残す */
import {getApps} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {getAuth,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {getFirestore,doc,getDoc,addDoc,collection} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const f=location.pathname.split("/").pop()||"index.html";
const PAGE={"":"メニュー","index.html":"メニュー","genba.html":"現場一覧","zaiko.html":/order=tanpatsu/.test(location.search)?"材料の注文":/order=/.test(location.search)?"材料を頼む":"工場在庫",
  "yotei.html":"予定表","shukei.html":"集計","benri.html":"便利ツール","ikei-tee.html":"異形チーズ","rireki.html":"ログイン履歴"}[f]||f;
const KEY="kouken-log-"+PAGE;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

(async()=>{
  try{const last=+localStorage.getItem(KEY)||0;if(Date.now()-last<30*60*1000)return;}catch(e){}
  let app;for(let i=0;i<60&&!(app=getApps()[0]);i++)await sleep(500);   // 画面が Firebase を始めるのを待つ
  if(!app)return;
  const auth=getAuth(app);
  const u=await new Promise(r=>{const off=onAuthStateChanged(auth,x=>{if(x){off();r(x);}});setTimeout(()=>r(null),30000);});
  if(!u)return;
  const fs=getFirestore(app);
  let who="";
  try{const ed=await getDoc(doc(fs,"editors",u.uid));if(ed.exists())who=ed.data().name||"";}catch(e){}
  if(!who)try{who=localStorage.getItem("kouken-who")||"";}catch(e){}
  const home=!!(matchMedia("(display-mode: standalone)").matches||navigator.standalone);
  // 暗証番号を入れたばかりの携帯は、登録が終わるまで書けないので何回か試す
  for(let i=0;i<6;i++){
    try{
      await addDoc(collection(fs,"logins"),{uid:u.uid,who,page:PAGE,at:Date.now(),ua:navigator.userAgent.slice(0,160),home});
      try{localStorage.setItem(KEY,String(Date.now()));}catch(e){}
      return;
    }catch(e){await sleep(10000);}
  }
})();
