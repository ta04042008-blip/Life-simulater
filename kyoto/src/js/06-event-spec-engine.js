// 06-event-spec-engine.js — イベント仕様の処理（変化量・人物・選ばれやすさ・自動/小さな選択/大きな選択・後日談）
/* ==================================================================
   イベント140件（設計案 v0.1 の取り込み）
   ・題材140件は採用確定。本文は設計案、後日談の結果文・換算・確率の補正は【仮】（このゲームの仮定であり、確定数値ではない）
   ・イベントは EV_RAW に1件ずつ足すだけで増やせる。起動時に検査し、不備のあるものは使わずに画面の上で報告する（黙って消さない）
   ================================================================== */
const EV_GENRES=['日常・暮らし','家族・養育','交流・友情','恋愛・婚姻','学習・技能','仕事・生業','財産・家計','健康・療養','遊び・趣味・創作','文化・信仰・行事','地域・共同体','社会・制度・争い','移動・旅・移住','自然・災害'];
const EV_BAND={a:[1,2],s:[3,5],b:[6,10]};                                   // 区分ごとの変化量（確認済み：自動＝小、小さな選択＝中、大きな選択＝大）
const EV_MAP={a:{1:1,2:2,3:2},s:{1:3,2:5,3:5},b:{1:6,2:10,3:10}};            // 設計案の値 → 区分の範囲への換算（仮）
const EV_FOL=[3,5];                                                          // 後日談の成功時の変化量（中程度）
let EV_NPC_MAX=18, EV_CD=0.25, EV_D_AFF=60, EV_P0=0.5;                     // 人物数の上限（仮）／同じ出来事の最短間隔（年）／保留型が動く好感度（仮）／基本成功率50％
const EV_POLG={'交流':2,'学び':4,'仕事':5,'家族':1,'休養':7};                  // 生活方針 → 重みが2倍になるジャンル（仮）
const EV_GROUPS={
 self:{}, fam:{rel:'家族'}, cofam:{rel:'家族',alias:[]},
 friend:{rel:'友人',alias:['友人','仲間'],nm:'友人',off:[-3,3],aff:8},
 acq:{rel:'知人',alias:['知人','邸の人'],nm:'知人',off:[-8,12],aff:8},
 neigh:{rel:'隣人',alias:['隣人','近所'],nm:'隣人',off:[-10,15],aff:8},
 work:{rel:'仕事仲間',alias:['仕事仲間','取引'],nm:'仕事仲間',off:[-5,15],aff:8},
 mentor:{rel:'師',alias:['師'],nm:'先輩',off:[10,28],aff:8},
 love:{rel:'想い人',alias:['想い人'],nm:'想い人',off:[-3,5],aff:8},
 local:{rel:'地域の人',alias:['地域の人'],nm:'地域の人',off:[8,28],aff:8},
 trav:{rel:'旅人',alias:['旅人'],nm:'旅人',off:[-5,15],aff:8},
 junior:{rel:'教え子',alias:['教え子'],nm:'教え子',off:[-18,-6],aff:8},
 child:{rel:'子ども',alias:['子ども'],nm:'子ども',off:[-12,-3],aff:8},
 newfam:{rel:'家族',alias:[],nm:'新しい家族',off:[0,0],aff:40,birth:true}
};
const EV_RAW=[];   // 2026-10-21：140件は削除（ユーザー指示）。元データは kyoto/legacy/events-140.json に保存。新しい出来事は設計室から作る予定
let EV=[],EV_BY_ID={},EV_BAD=[],EV_RT=[];                                    // 使える出来事／ID索引／不備のある出来事／実行中に見つかった不備
const evEsc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const evStr=v=>typeof v==='string'&&v.trim().length>0, evNum=v=>typeof v==='number'&&isFinite(v);
const evFx4=v=>Array.isArray(v)&&v.length===4&&v.every(evNum);
function evCheck(e){
  const w=[];
  if(!e||typeof e!=='object')return['データが壊れている'];
  if(!evStr(e.id))return['IDがない'];
  if(!['a','s','b'].includes(e.k))w.push('区分が不正');
  if(!evStr(e.t))w.push('題名がない');
  if(!Array.isArray(e.ag)||e.ag.length!==2||!e.ag.every(evNum)||e.ag[0]<0||e.ag[0]>e.ag[1])w.push('年齢帯が不正');
  if(!Object.prototype.hasOwnProperty.call(EV_GROUPS,e.gr))w.push('人物の役割が未登録');
  if(!Number.isInteger(e.g)||e.g<0||e.g>=EV_GENRES.length)w.push('ジャンルが不正');
  if(e.k==='a'){
    if(!evStr(e.x))w.push('本文がない');
    if(!evFx4(e.fx))w.push('能力の変化が不正');
    if(e.af!=null&&!evNum(e.af))w.push('好感度の変化が不正');
  }else if(e.k==='s'||e.k==='b'){
    if(!evStr(e.b))w.push('状況の文がない');
    if(!Array.isArray(e.o)||e.o.length!==2)w.push('選択肢が2つではない');
    else e.o.forEach((o,j)=>{
      const p=`選択肢${j+1}`;
      if(!o||!evStr(o.l))w.push(p+'の名前がない');
      else{
        if(!evStr(o.x))w.push(p+'の結果文がない');
        if(!evFx4(o.fx))w.push(p+'の能力の変化が不正');
        if(o.af!=null&&!evNum(o.af))w.push(p+'の好感度の変化が不正');
        if(e.k==='b'&&(!evStr(o.y)||!evStr(o.rep)))w.push(p+'のセリフがない');
        if(o.tm!=null&&!(Array.isArray(o.tm)&&o.tm.every(t=>Array.isArray(t)&&t.length===3&&t.every(evNum)&&t[0]>=0&&t[0]<=4)))w.push(p+'の気質の指定が不正');
        if(o.fw!=null&&![0,1,2].includes(o.fw))w.push(p+'の後日談の指定が不正');
      }
    });
    if(e.k==='b'){
      if(!evStr(e.sy))w.push('相手のセリフがない');
      const f=e.f;
      if(!f||!['A','B','C','D','E'].includes(f.k))w.push('後日談の種類が不正');
      else{
        if(!evNum(f.m)||f.m<1||f.m>24)w.push('後日談の期間が不正');
        if(!f.ok||!evStr(f.ok.x)||!evFx4(f.ok.fx))w.push('後日談（成功）が不正');
        if((f.k==='B'||f.k==='E')&&(!f.ng||!evStr(f.ng.x)||!evFx4(f.ng.fx)))w.push('後日談（失敗）が不正');
      }
    }
  }
  return w;
}
function evInit(list){
  EV=[];EV_BY_ID={};EV_BAD=[];
  (Array.isArray(list)?list:[]).forEach((e,i)=>{
    const w=evCheck(e);
    if(e&&evStr(e.id)&&EV_BY_ID[e.id])w.push('IDが重複している');
    if(w.length){EV_BAD.push({id:(e&&e.id)||('#'+(i+1)),t:(e&&e.t)||'',why:w.join('／'),big:!!e&&e.k==='b'});console.error('[イベント不備]',(e&&e.id)||i,w.join('／'));return}
    EV.push(e);EV_BY_ID[e.id]=e;
  });
  evBanner();
}
/* 不備の報告：画面の上に出し続ける。回答待ちのイベントに不備があるときは、先へ進む操作を待つ */
function evBanner(){
  const el=document.getElementById('evwarn');if(!el)return;
  const items=EV_BAD.map(b=>`${b.id}${b.t?'「'+b.t+'」':''}：${b.why}${b.big?'（大きな選択）':''}`).concat(EV_RT).concat(S&&S.bad?S.bad.map(b=>`状態：${b.item}：${b.why}`):[]);
  const dec=S&&S.decision&&!evDecOk(S.decision)?S.decision:null;
  if(!items.length&&!dec){el.hidden=true;el.innerHTML='';return}
  el.hidden=false;
  el.innerHTML=`<b>イベントに不備があります</b>`+
    (dec?`<p class="note">回答待ちのイベント「${evEsc(dec.title||'名称なし')}」に不備があり、選択肢を出せません（${evEsc(evDecWhy(dec))}）。結果は適用していません。</p><button class="pbtn" id="evbadok">不備を記録して先へ進む</button>`:'')+
    (items.length?`<p class="note">使わずに止めているもの（${items.length}件）：<br>${items.slice(0,8).map(evEsc).join('<br>')}${items.length>8?'<br>ほか'+(items.length-8)+'件':''}</p>`:'');
}
function evProblem(msg){EV_RT.push(msg);console.error('[イベント不備]',msg);if(S)addLog('c','【イベントの不備】'+msg,true);evBanner()}
function evDecWhy(d){
  if(!d||typeof d!=='object')return'データが壊れている';
  if(!evStr(d.title))return'題名がない';
  if(!evStr(d.body))return'状況の文がない';
  if(!Array.isArray(d.opts)||d.opts.length<2)return'選択肢が足りない';
  for(let j=0;j<d.opts.length;j++){const o=d.opts[j];if(!o||!evStr(o.l))return`選択肢${j+1}の名前がない`;if(!evFx4(o.fx))return`選択肢${j+1}の能力の変化が不正`}
  return'';
}
const evDecOk=d=>evDecWhy(d)==='';
/* ---- 変化量：区分の範囲に収める ---- */
function evMag(k,v){
  if(!evNum(v)||!v)return 0;
  const s=v<0?-1:1,a=Math.min(3,Math.abs(v)),[lo,hi]=EV_BAND[k];let m=EV_MAP[k][a];
  if(rand()<0.35)m+=rand()<0.5?-1:1;                       // 範囲内でだけ揺らす
  return s*clamp(m,lo,hi);
}
function evFol(v){
  if(!evNum(v)||!v)return 0;
  const s=v<0?-1:1,a=Math.abs(v);let m=a;
  if(rand()<0.35)m+=rand()<0.5?-1:1;
  return s*((s>0&&a>=EV_FOL[0])?clamp(m,EV_FOL[0],EV_FOL[1]):clamp(m,1,2));
}
/* ---- 人物：役割に合う人を、知っていて存命の人から選ぶ。いなければ新しく生まれさせる ---- */
function evFind(gk){
  const G=EV_GROUPS[gk],c=[];
  S.npc.forEach((n,i)=>{if(n.known&&!n.dead&&npcAge(n)>=3&&(gk==='fam'?n.rel==='家族':gk==='cofam'?(n.rel==='家族'&&!!n.co):(G.alias||[]).includes(n.rel)))c.push(i)});
  return c.length?c[rnd(c.length)]:-1;
}
function evCan(e){
  if(e.gr==='self')return true;
  if(!e.nw&&evFind(e.gr)>=0)return true;
  if((e.gr==='fam'||e.gr==='cofam')&&!e.nw)return false;                                    // 家族がいない
  return S.npc.length<EV_NPC_MAX;
}
function evSpawn(gk){
  const P=PERSONAS[S.pid],G=EV_GROUPS[gk];
  const age=G.birth?0:Math.max(3,S.age+G.off[0]+rnd(G.off[1]-G.off[0]+1));
  const same=S.npc.filter(n=>n.rel===G.rel&&String(n.name).startsWith(G.nm)).length;
  const name=G.nm+(same?('二三四五六七八九'[same-1]||String(same+1)):'');
  S.npc.push({name,rel:G.rel,aff:G.aff,from:null,known:true,off:age-S.age,skill:100+rnd(500),skillName:P.skillName,dead:false,deadAge:null,hist:[],extra:{},fromText:null,...mkPerson(P,age)});
  const i=S.npc.length-1;nameNpcs(S);const name2=S.npc[i].name;
  addLog('n',`${name2}と知り合った。`,true);hist(i,'知り合った');
  return i;
}
function evResolve(e){                                                      // null＝人物なし／番号／-1＝用意できない
  if(e.gr==='self')return null;
  if(!e.nw){const i=evFind(e.gr);if(i>=0)return i}
  if((e.gr==='fam'||e.gr==='cofam')&&!e.nw)return -1;
  if(S.npc.length>=EV_NPC_MAX)return -1;
  return evSpawn(e.gr);
}
/* ---- 選ばれやすさ ---- */
const evSeen=id=>(S.evSeen&&S.evSeen[id])||{n:0,last:-9};
function evElig(e){
  if(S.age<e.ag[0]||S.age>e.ag[1])return false;
  if(stBlocked(e))return false;
  if(stHlGate(e))return false;                                            // 病状が要る・要らない出来事の出し分け                                           // 住居・世帯・健康が要る出来事は、その仕組みが入るまで出さない
  const z=evSeen(e.id);
  if(e.k==='b'||e.nw){if(z.n>0)return false}                                // 大きな選択と新しい人物の出会いは、一生に一度
  else if(S.t-z.last<EV_CD)return false;                                    // 同じ出来事は最短3か月あける
  return evCan(e);
}
function evW(e){let w=1/(1+evSeen(e.id).n);if(EV_POLG[S.policy]===e.g)w*=2;return w}
function evChoose(list){
  if(!list.length)return null;
  const ws=list.map(evW),sum=ws.reduce((a,b)=>a+b,0);let r=rand()*sum;
  for(let i=0;i<list.length;i++){r-=ws[i];if(r<=0)return list[i]}
  return list[list.length-1];
}
function evMark(e){if(!S.evSeen)S.evSeen={};S.evSeen[e.id]={n:evSeen(e.id).n+1,last:S.t}}
/* ---- 自動イベント（通常の出来事の候補に加わる） ---- */
function evAutoPool(){
  if(!EV.length)return[];
  return EV.filter(e=>e.k==='a'&&evElig(e)).map(e=>({evid:e.id,t:'n',x:e.x,b:e.bu,fx:e.fx,wt:0.4*evW(e)}));
}
function evFireAuto(p){
  const e=EV_BY_ID[p.evid];if(!e)return;
  const pi=(e.nw||e.af)?evResolve(e):null;
  if(pi===-1)return;
  evMark(e);
  const fx=e.fx.map(v=>evMag('a',v)),np=(pi!=null&&e.af)?{[pi]:evMag('a',e.af)}:null;
  addLog('n',e.x);lastBubble=e.bu;
  applyFx(fx,np,e.act?'act':'rec',1);
  if(pi!=null)hist(pi,e.x);
  const seq=++S.seq,stx=stBuild(e,0,pi);                                  // 状態の変更（資源・保留など）。出典ごとに一度だけ
  if(stx.length)stRun({st:stx,pid:pi!=null&&S.npc[pi]?S.npc[pi].id:null},{ev:e.id,seq,title:e.t},0);
}
/* ---- 小さな選択・大きな選択 ---- */
function evPick(k){
  const e=evChoose(EV.filter(x=>x.k===k&&evElig(x)));
  return e?evBuild(e):null;
}
function evBuild(e){
  const pi=evResolve(e);
  if(pi===-1)return null;
  evMark(e);                                                                // 出した時点で記録する（再開しても引き直さない）
  const big=e.k==='b';
  return{ev:e.id,seq:++S.seq,title:e.t,body:e.b,small:!big,who:(big&&pi!=null)?pi:null,say:big?e.sy:undefined,
    opts:e.o.map((o,j)=>{
      const op={l:o.l,x:o.x,fx:o.fx.map(v=>evMag(e.k,v)),rec:true,sc:1};
      if(o.y)op.y=o.y;if(o.rep)op.rep=o.rep;
      if(o.af&&pi!=null)op.np={[pi]:evMag(e.k,o.af)};
      if(o.tm)op.tm=o.tm;
      op.st=stBuild(e,j,pi);                                                 // 状態の変更：対象人物・費用の量はここで固定する
      op.pid=(pi!=null&&S.npc[pi])?S.npc[pi].id:null;
      if(big&&j===0&&e.f)op.sp=JSON.parse(JSON.stringify(e.f));              // 後日談は「件」に結びつけて進める（選択肢2の汎用文は廃止）
      return op;
    })};
}
/* ---- 後日談：期間がたつと一度だけ届く。判定の性質で扱いを分ける ----
   A 条件成立型＝判定なし／B 返事・承諾型・E 成果型＝基本50％＋補正／C 他の仕組み依存型＝判定なし（結果を文章にするだけ）／D 保留型＝好感度が足りるまで確定しない */
function evProb(pi,k){
  let p=EV_P0;const n=pi!=null?S.npc[pi]:null;
  if(n)p+=clamp((n.aff-50)/250,-0.2,0.2);                                   // 相手との親しさ
  p+=clamp((S.stats[2]-500)/5000,-0.1,0.1);                                 // 意欲（準備の度合い）
  if(k==='E')p+=clamp((S.skill-300)/3000,-0.1,0.1);                         // 技能
  return clamp(p,0.2,0.8);
}
const evIn=m=>Math.max(1,Math.ceil(m/3));              // 後日談の待ち：内部の四半期数（月数÷3）
function evFollowDue(p){
  const f=p.fu,sp=f&&f.sp;
  if(!sp||!sp.ok||!evStr(sp.ok.x)||!evFx4(sp.ok.fx)){evProblem(`後日談（${(f&&f.id)||'?'}）の内容が不正なため、適用せずに中止した`);return}
  const pn=(f.pi!=null&&S.npc[f.pi])?S.npc[f.pi]:null;
  let res='ok';
  if(sp.k==='D'){if(!pn||pn.dead||pn.aff<EV_D_AFF){addLog('c','返事はまだ出ていない。（保留のまま）',true);return}}
  else if(sp.k==='B'||sp.k==='E'){res=(sp.ng&&evFx4(sp.ng.fx)&&rand()>=evProb(f.pi,sp.k))?'ng':'ok'}
  const r=res==='ok'?sp.ok:sp.ng;
  addLog('r',r.x,true);
  const np={};if(pn&&!pn.dead&&r.af)np[f.pi]=r.af>0?evFol(r.af):-clamp(Math.abs(r.af),1,2);
  applyFx(r.fx.map(evFol),np,'rec',1);
  if(np[f.pi])hist(f.pi,r.x);
  lastBubble=res==='ok'?'ありがたい！':'うーん…';
}
evInit(EV_RAW);
['E01-05','E01-10','E13-08'].forEach(id=>{if(EV_BY_ID[id])EV_BY_ID[id].gr='cofam'});   // 「同居人」が要る出来事は、同居している家族だけを相手にする
