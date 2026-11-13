/* 社員みんなが開ける画面（便利ツールなど 2026/11/14 ユーザー「全員に開放」）
   この携帯で会社の暗証番号が入っていれば（members に登録）中身を出す。まだなら、どこかの画面で暗証番号を入れてもらう。
   ページ側は <main id="main" hidden> にしておき、確かめてから出す */
import {initializeApp} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {getAuth,signInAnonymously} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {getFirestore,doc,getDoc} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {FIREBASE_CONFIG} from "./firebase-config.js";

const main=document.getElementById("main");
const msg=document.createElement("div");
msg.className="lock";
msg.innerHTML='<b>確かめています…</b>';
main.before(msg);
try{
  const app=initializeApp(FIREBASE_CONFIG);
  const auth=getAuth(app);
  await signInAnonymously(auth);
  const m=await getDoc(doc(getFirestore(app),"members",auth.currentUser.uid));
  if(m.exists()){msg.remove();main.hidden=false;}
  else msg.innerHTML='<b>会社の暗証番号がまだです</b><span>「現場一覧」などを開いて、暗証番号を入れてください。</span><a href="./">メニューにもどる</a>';
}catch(e){
  msg.innerHTML='<b>つながりません</b><span>電波を確認して、開き直してください。</span><a href="./">メニューにもどる</a>';
}
