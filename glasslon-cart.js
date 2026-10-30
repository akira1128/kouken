/* 東京グラスロンECサイトで動かす「コウケン→カート」（2026/10/30）
   コウケンのアプリの「グラスロンに注文」で開いたページ（#kouken=…）で、ブックマークから読み込む。
   品物と数をカートに入れるだけ。注文の確定は西崎さんがカートの画面で押す */
(async()=>{
  const box=document.createElement("div");
  box.style.cssText="position:fixed;inset:auto 12px 12px 12px;z-index:99999;background:#fff;border:2px solid #1f3a8a;border-radius:12px;padding:14px;font:15px/1.6 sans-serif;color:#111;box-shadow:0 6px 24px rgba(0,0,0,.25);max-height:70vh;overflow:auto";
  const say=html=>{box.innerHTML=html;};
  document.body.appendChild(box);
  try{
    if(!/ec-tokyog\.com$/.test(location.hostname)){say("東京グラスロンのECサイトを開いてから押してください。");return;}
    // 注文の中身：URLの #kouken=… 。ログインし直しで消えたときのために、この携帯に覚えておく
    let raw=(location.hash.match(/kouken=([^&]+)/)||[])[1];
    if(raw)try{localStorage.setItem("kouken-ec",raw);}catch(e){}
    else try{raw=localStorage.getItem("kouken-ec");}catch(e){}
    if(!raw){say("コウケンのアプリの「グラスロンに注文」から開いてください。");return;}
    const ord=JSON.parse(decodeURIComponent(raw));
    say("<b>カートに入れる準備をしています…</b><br>"+ord.site);
    const nz=s=>(s||"").replace(/\s+/g," ").trim();
    const cache={};
    const search=async a=>{
      if(!cache[a]){const t=await fetch("/aec/user/shohin_search_list?sort_page_div=user_shohin_search&sort_no=12&limit=200&k="+encodeURIComponent(a),{credentials:"include"}).then(r=>r.text());
        const j=JSON.parse(t);if(j.isLogin===false)throw new Error("login");cache[a]=j.search_items||[];}
      return cache[a];};
    const ok=[],ng=[];
    for(const l of ord.lines){
      // 候補（[商品名, 寸法]）を順に探す。寸法の末尾 * は「ここから先は何でも」
      let hit=null;
      for(const [a,b] of (l.k||[])){const list=await search(a);
        hit=list.find(x=>nz(x.item_name1)===nz(a)&&(b.endsWith("*")?nz(x.item_name2).startsWith(b.slice(0,-1)):nz(x.item_name2)===b));if(hit)break;}
      if(hit)ok.push({l,hit});else ng.push(l);
    }
    if(!ok.length){say("<b>カートに入れられる品物がありませんでした。</b><br>"+ng.map(l=>"・"+l.n+" "+l.q+l.u).join("<br>"));return;}
    const csrf=(document.querySelector("input[name=_csrf]")||{}).value||((await fetch("/aec/user/",{credentials:"include"}).then(r=>r.text())).match(/name="_csrf" value="([^"]+)"/)||[])[1];
    const form_list=ok.map(({l,hit},i)=>({row_num:i,order_quantity:String(l.q),order_case_quantity:"0",cart_id:"",item_cd:hit.item_cd,case_div:"0",unit_div:"1",cs1_cd:"",cs2_cd:"",quantity_per_case:""}));
    const res=await fetch("/aec/user/cart_in_async",{method:"POST",credentials:"include",headers:{"Content-Type":"application/x-www-form-urlencoded; charset=UTF-8","X-Requested-With":"XMLHttpRequest"},
      body:new URLSearchParams({_csrf:csrf,form_list:JSON.stringify(form_list)})}).then(r=>r.text());
    let msgs=[];try{const j=JSON.parse(res);for(const v of Object.values(j.messages||{}))(Array.isArray(v)?v:[]).forEach(m=>m&&m.message&&msgs.push(m.message));}catch(e){msgs=["カートの返事が読めませんでした"];}
    try{localStorage.removeItem("kouken-ec");}catch(e){}
    history.replaceState(null,"",location.pathname+location.search);
    say("<b>"+ord.site+"</b><br>カートに入れました："+ok.length+"品<br>"+ok.map(({l,hit})=>"・"+nz(hit.item_name1)+" "+nz(hit.item_name2)+"　"+l.q+l.u).join("<br>")+
      (ng.length?"<br><br><b style='color:#b91c1c'>入らなかった（自分で探してください）："+ng.length+"品</b><br>"+ng.map(l=>"・"+l.n+"　"+l.q+l.u).join("<br>"):"")+
      (msgs.length?"<br><br><span style='color:#b91c1c'>"+msgs.join("<br>")+"</span>":"")+
      "<br><br><a href='/aec/user/cart' style='display:block;text-align:center;background:#1f3a8a;color:#fff;padding:12px;border-radius:8px;text-decoration:none;font-weight:bold'>カートを見る（確定はカートで）</a>");
  }catch(e){
    say(e&&e.message==="login"?"グラスロンにログインしてから、もう一度ブックマークを押してください。":"うまく動きませんでした（"+(e&&e.message||e)+"）");
  }
})();
