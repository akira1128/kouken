/* 西崎さんだけが開ける画面（便利ツールなど 2026/11/01 ユーザー）
   この携帯が editors に「西崎剣」として登録されていれば中身を出す。ほかの人には「西崎さんだけが開けます」を出す。
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
  const ed=await getDoc(doc(getFirestore(app),"editors",auth.currentUser.uid));
  if(ed.exists()&&ed.data().name==="西崎剣"){msg.remove();main.hidden=false;}
  else msg.innerHTML='<b>西崎さんだけが開けます</b><a href="./">メニューにもどる</a>';
}catch(e){
  msg.innerHTML='<b>つながりません</b><span>電波を確認して、開き直してください。</span><a href="./">メニューにもどる</a>';
}
