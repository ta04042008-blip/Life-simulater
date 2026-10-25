// 13-ui-decisions.js — ゲージ途中のイベント、決断イベントの演出・吹き出し・文字送り
/* ---------- ゲージの途中で起こるイベント ----------
   ゲージ（1回の進行）が始まるとき、その間に起こるイベントの数とタイミング（10〜90%）を決めておき、
   ゲージが進んでその位置に来たら発生させる。停止中は進まない（残り時間と同じ扱い）。
   手動の「1か月」などでは、各回の直前にまとめて発生させる */
let slots=[],evT=[];
function fireOrdinary(){
  const pool=eventPool().filter(e=>e.meet==null||!S.npc[e.meet].dead);
  let e=tmPick(S.tm,pool);if(!e)return;    // その人の気質に合う出来事が、少し出やすい
  if(e.evid){evFireAuto(e);return}         // 設計案140件の自動イベント
  if(e.fam){
    const fm=S.npc.map((n,j)=>[n,j]).filter(([n])=>n.rel==='家族'&&n.known&&!n.dead);
    if(!fm.length)return;
    const [fn,fi]=fm[rnd(fm.length)];
    e={t:'n',x:e.x.replace('{n}',fn.name),fx:e.fx,np:{[fi]:e.aff},b:e.b,k:e.k,tm:e.tm};
  }
  if(e.meet!=null&&!S.npc[e.meet].known){S.npc[e.meet].known=true;addLog('n',e.x+`（${S.npc[e.meet].name}と知り合った）`,true);hist(e.meet,'知り合った')}
  else addLog(e.t,e.x);
  lastBubble=e.b;applyFx(e.fx,e.np,e.k);
  if(e.tm){tmNudge(S.tm,e.tm[0],e.tm[1],e.tm[2],S.age,e.x);tmReport()}
  if(e.np)for(const k in e.np)if(S.npc[k].known&&!S.npc[k].dead)hist(k,e.x);
}
function fireLearn(){
  const yq=S.age<TIME.ADULT_FROM;
  const L=LEARN[S.pid][S.policy==='学び'?'study':'work'],e=L[rnd(L.length)];
  const np={};if(e.np)for(const k in e.np)if(S.npc[k].known&&!S.npc[k].dead)np[k]=e.np[k];
  addLog('n',e.x);lastBubble=e.b;applyFx(e.fx,np);
  for(const k in np)hist(k,e.x);
  S.skill=clamp(S.skill+e.sk*(yq?0.2:0.5),0,1000);
}
function rollSlots(){
  const sm=stepMonths(S.age),yq=S.age<TIME.ADULT_FROM,ne=yq?sm/3:sm/6,list=[];     // 画面の1回分の長さに比例（旧: 3か月=1回、1年=2回）
  for(let i=0;i<ne;i++)if(Math.random()<0.6)list.push({k:'o',at:0.1+Math.random()*0.8});
  const nl=yq?sm/3:1,pl=yq?0.5:0.5*sm/12;
  if(S.age>=6&&(S.policy==='学び'||(S.policy==='仕事'&&S.age>=13)))for(let i=0;i<nl;i++)if(Math.random()<pl)list.push({k:'l',at:0.1+Math.random()*0.8});
  return list.sort((a,b)=>a.at-b.at);
}
function runSlot(s){
  const i=slots.indexOf(s);if(i<0)return;slots.splice(i,1);
  if(!S||S.dead||S.decision)return;
  popQ=[];lastBubble=null;
  if(s.k==='o')fireOrdinary();else fireLearn();
}
function fireSlot(s){runSlot(s);render();showFx();saveAutoSoon()}
function flushSlots(){slots.slice().forEach(runSlot)}
function armSlots(ms){
  evT.forEach(clearTimeout);evT=[];
  const full=SPEEDS[speedIdx][0],p0=1-ms/full;
  slots.forEach(s=>evT.push(setTimeout(()=>fireSlot(s),Math.max(50,(s.at-p0)*full))));
}
/* ---------- 時間の進め方（仕様v1.7 §2）----------
   画面の1回分（ゲージ）の長さは年齢で決まる（TIME.STEP_MONTHS）。内部は常に3か月（1四半期）ずつ tickQ() で処理し、
   1回分の中で四半期ごとに病気・死亡・誕生日・小さな選択・月次の収支と期限を判定する。
   途中で選択や死亡が起きたら、そこで止まる（残りは回答後の次の進行で続ける。S.q が位置を保持するので二重処理しない）。 */
function tick(){
  if(S.decision||S.dead)return false;
  const k=stepMonths(S.age)/3,n=k-(S.q%k);                  // この回の残り四半期数（保存・再開の途中でも境目に揃う）
  for(let i=0;i<n;i++){tickQ();if(S.dead||S.decision)break}
  if(S.q%k===0)S.tk=(S.tk||0)+1;                            // 外側の進行（画面の1回分）の回数。本人の確認待ちの期限の基準
  syncStep();
  return true;
}
/* 内部の1四半期。年齢が TIME.ADULT_FROM 以上のときは、旧「1年進行」で調整した数値を1四半期あたりに換算して用いる（総量は同じ） */
function tickQ(){
  const P=PERSONAS[S.pid],yq=true,yrs=0.25,ad=S.age>=TIME.ADULT_FROM;
  popQ=[];lastBubble=null;
  // calendar
  let bday=false;
  S.q++;S.t+=0.25;if(S.q>3){S.q=0;S.year++;S.age++;bday=true}
  if(bday){
    const was=bandOf(S.age-1),now=bandOf(S.age);
    if(was!==now)addLog('k',`${now}になった。（${S.age}歳）`,true);
    else addLog('k',`${S.age}歳になった。`,S.age%10===0);
    lastBubble=`${S.age}歳！`;
    S.npc.forEach(n=>{if(!n.known&&n.from!=null&&S.age>=n.from){n.known=true;const tx=n.fromText?`${n.name}${n.fromText}`:`${n.name}と顔を合わせるようになった。`;addLog('n',tx,true);hist(S.npc.indexOf(n),n.fromText?'生まれた':'顔を合わせるようになった')}});
  }
  // growth / policy drift (all numbers are placeholders)
  const f=ad?1:1.5,pol=POLICIES[S.policy],act=S.policy!=='休養';
  natStep(S,S.age,yrs,yq);                  // 年齢による自然な成長と衰え（★は掛けない）
  S.stats=S.stats.map((v,i)=>{              // 生活方針による活動の成長（プラスの分だけ★が効く。休養は回復なので掛けない）
    let g=0;
    if(S.age>=13){
      g=pol[i]*f*(pol[i]>0?(1-v/1000):(0.2+v/1000));
      if(pol[i]>0&&act){xpAdd(S,i,pol[i]*yrs*XP_POL);g*=starMult(S.star[i])}
      g+=rnd(5)-2;
    }else if(S.age>=6){
      g=pol[i]*f*0.5;
      if(g>0&&act){xpAdd(S,i,pol[i]*yrs*XP_POL*0.5);g*=starMult(S.star[i])*SAT(v)}
    }
    return clamp(v+g,0,1000)});
  xpDecay(S,yrs,S.age,XP_DECAY_ME);starAll();   // 使わない力は、★の経験値がゆっくり減る（13歳から）
  S.npc.forEach(n=>{if(n.known&&!n.dead)n.aff=clamp(n.aff+(S.policy==='交流'?(ad?(Math.random()<0.25?1:0):1):0)+(rnd(5)-2),0,100)});
  tmReport();                               // 主人公の気質：表示の開始・文字の変化
  // skill (hidden 0-1000; only the level is shown)
  if(S.age>=6){
    const pf=S.policy,gain=(S.age<13?(pf==='学び'?12:6):(pf==='仕事'?30:pf==='学び'?20:8))*(1-S.skill/1100);
    const before=skillLv(S.skill);
    S.skill=clamp(S.skill+gain*yrs-(S.age>70?(S.age-70)*0.5*yrs:0),0,1000);
    const after=skillLv(S.skill);
    if(after>before){addLog('k',`${P.skillName}がLv${after}になった。`,true);lastBubble=`Lv${after}！`}
  }
  // people around: aging and death (same hazard idea, placeholder stamina curve)
  S.npc.forEach((n,i)=>{
    if(n.dead)return;
    const a=S.age+n.off;
    if(a<0)return;                       // まだ生まれていない弟妹
    npcLife(n,a,yrs,yq);                 // 自分なりの活動・★・気質の変化（主人公の選択とは別）
    const hz=annualHazard(a,NPC_STAM_LINK?n.stats[0]:clamp(560-Math.max(0,a-35)*5,150,600),null);
    if(a>=MAXAGE||Math.random()<1-Math.exp(-hz.tot*yrs)){
      n.dead=true;n.deadAge=a;
      if(n.known){
        addLog('c',`${n.name}が亡くなった。`,true);hist(i,`亡くなった（${approxAge(a)}）`);lastBubble='…';
        if(n.aff>=40){applyFx([0,0,-6,0]);S.sx[2]-=15;starAll()}
        if(n.rel==='家族'){
          const rest=S.npc.filter(m=>m.rel==='家族'&&m.known&&!m.dead);
          if(rest.length){rest.forEach(m=>{m.aff=clamp(m.aff+4,0,100);emo('n'+S.npc.indexOf(m),'sad')});addLog('c','残された家族で、悲しみを分かち合った。',true)}
        }
      }
    }
  });
  if(S.age<13&&!S.orphan&&S.npc.some(n=>n.rel==='家族'&&n.dead)&&!S.npc.some(n=>n.rel==='家族'&&!n.dead&&S.age+n.off>=0)){
    S.orphan=true;addLog('c','身寄りが少なくなり、近所の人や親族に支えられて暮らすことになった。',true);applyFx([0,0,-9,0]);S.sx[2]-=40;starAll();
  }
  stIds();stMonths(3);                // 状態の進行：内部の1四半期＝3か月分を月順に処理（画面の1回分が半年・1年でも省略しない）（収支・活動・件の確認・期限）
  // 後日談（旧形式）：旧セーブに残っている予約だけを届ける。新しい決断の後日談は「件」が受け持つ
  if(S.pending&&S.pending.length){
    const due=[];S.pending=S.pending.filter(p=>{if(--p.in<=0){due.push(p);return false}return true});
    due.forEach(p=>{if(p.fu)evFollowDue(p);else{addLog(p.t==='r'?'r':'n',p.x,true);applyFx(p.fx,null,'rec')}});
  }
  // illness
  if(S.ongoing){
    S.stats[0]=clamp(S.stats[0]+(ad?2.5:10),0,1000);
    if(--S.ongoing.left<=0){addLog('c','体調がすっかり戻った。',true);S.ongoing=null}
  }else{
    const pill=(0.05+S.age/1500)*(ad?0.75:1)*(S.age<6?1.6:1);
    if(Math.random()<pill){
      const sev=Math.random()<0.05+S.age/1200;
      S.ongoing={name:sev?'重い病':'風邪',mult:sev?HZ.sevMult:HZ.illMult,left:ad?4:1+rnd(2)};
      const d=sev?150:60;S.stats[0]=clamp(S.stats[0]-d,0,1000);popQ.push([0,-d]);emo('self','sad');if(sev){S.sx[0]-=70;starAll()}   /* 重い病は、体力の伸びやすさを下げることがある（特別な経験） */
      lastBubble=sev?'ううっ…':'ゴホゴホ…';
      addLog('c',sev?'重い病にかかり、長く床につくことになった。':'風邪をひき、しばらく療養することになった。',true);
    }
  }
  stHlSync();
  // death (age-based hazard, raised by low stamina, illness and accidents)
  const h=annualHazard(S.age,S.stats[0],S.ongoing);
  if(S.age>=MAXAGE||Math.random()<1-Math.exp(-h.tot*yrs)){die(h);saveAutoSoon();return true}
  // decision
  if(S.age>=13&&S.t>=S.nextDecT){
    let d=Math.random()<0.85?evPick('b'):null;       // 設計案の大きな選択（なければ従来の決断）
    if(!d){d=P.dec[S.decCount%P.dec.length];
    for(let k=0;k<P.dec.length;k++){const c=P.dec[(S.decCount+k)%P.dec.length],pn=S.npc[c.who];if(pn&&pn.known&&!pn.dead){d=c;break}}}   /* 相手がいる決断を優先 */
    S.decision=d;lastBubble='どうしよう…！';S.decCount++;S.nextDecT=S.t+(ad?3+rnd(4):2+rnd(3));
    S.nextSmallT=Math.max(S.nextSmallT,S.t+1);
  }else if(S.age>=TIME.SMALL_FROM_AGE&&S.t>=S.nextSmallT){     // 小さな選択：選ぶまで時間が止まる
    S.decision=(Math.random()<0.85&&evPick('s'))||makeSmall();lastBubble='どうしよう…';S.nextSmallT=S.t+SMALL_GAP(!ad);
  }
  saveAutoSoon();
  return true;
}
/* ---------- 決断イベントの演出 ----------
   関わる人物（決断データの who）と主人公が向かい合い、セリフの吹き出しで進む。
   相手がいない（まだ知らない・亡くなった）ときは、主人公だけが場面に立ち、本文を吹き出しで話す */
let evMode=null,evTimer=null,evDone=false,evSkip=null,evSteps=[],evI=0,evSpk=null,evPartner=null,evFinal=false,evSpkT=0;
const evOpen=()=>evMode!==null;
function evHide(){if(evTimer){clearInterval(evTimer);evTimer=null}evMode=null;evDone=false;evSkip=null;evSteps=[];evI=0;evSpk=null;evPartner=null;evFinal=false;const h=$('evwin');if(h){h.hidden=true;h.innerHTML=''}}
function partnerOf(d){const n=d&&d.who!=null?S.npc[d.who]:null;return n&&n.known&&!n.dead?d.who:null}
const actc=document.createElement('canvas');actc.width=64;actc.height=64;
function drawActor(g,i,age,x,fy,flip,hop){
  const L=lookOf({i},age),body=spr(L.body),hair=spr(L.hair);if(!ok(body)||!ok(hair))return;
  const a=actc.getContext('2d');a.clearRect(0,0,64,64);a.drawImage(body,0,0);a.drawImage(hair,0,0);
  g.save();g.translate(x,0);if(flip)g.scale(-1,1);g.drawImage(actc,-64,fy-114-hop,128,128);g.restore();   /* 絵は左向き・2倍 */
}
function drawZoom(){
  const c=$('evscene');if(!c||!S)return;
  const g=c.getContext('2d');g.imageSmoothingEnabled=false;
  const m=walkers.self,mx=m?m.x:PERSONAS[S.pid].pos[0],x0=Math.round(clamp(mx-49,0,288-99));
  g.clearRect(0,0,396,200);g.drawImage(cv,x0,46,99,50,0,0,396,200);
  const hop=(performance.now()-evSpkT<900&&Math.floor(performance.now()/150)%2)?4:0,FY=192;      /* 話している間は、その人が小さく跳ねる */
  if(evPartner!=null){drawActor(g,evPartner,npcAge(S.npc[evPartner]),118,FY,true,evSpk==='pt'?hop:0);drawActor(g,-1,S.age,278,FY,false,evSpk==='me'?hop:0)}
  else drawActor(g,-1,S.age,198,FY,false,evSpk==='me'?hop:0);
}
/* 吹き出し：人物の短いひとこと（すぐ表示し、話した人が少し跳ねる） */
function evBub(who,text){
  const el=$('evbub');if(!el)return;
  const pn=evPartner!=null?S.npc[evPartner]:null;
  const nm=who==='me'?nameOf().replace('',''):pn.name.replace('',''),col=who==='me'?'var(--accent)':relCol(pn.rel);
  const sx=(who==='me'?(pn?278:198):118)/396*100;
  el.style.left=sx.toFixed(1)+'%';
  el.innerHTML=`<span class="evnm" style="background:${col}">${esc(nm)}</span>${esc(text)}`;el.hidden=false;
  evSpk=who;evSpkT=performance.now();
}
/* 本文：1文字ずつ（タップで一気に表示） */
function evType(text,onDone){
  const el=$('evtext');if(!el)return;
  if(evTimer){clearInterval(evTimer);evTimer=null}
  let i=0;evDone=false;
  const draw=n=>{el.innerHTML=`${esc(text.slice(0,n))}<span style="visibility:hidden">${esc(text.slice(n))}</span>`};
  draw(0);
  const fin=()=>{if(evTimer){clearInterval(evTimer);evTimer=null}draw(text.length);evDone=true;evSkip=null;onDone&&onDone()};
  evTimer=setInterval(()=>{i++;draw(i);if(i>=text.length)fin()},38);
  evSkip=fin;
}
function evFrame(tag,title){
  return `<div class="evback"></div><div class="evcard" id="evcard"><div class="evbanner"><span class="evtag">${esc(tag)}</span><span>${esc(title)}</span></div><div class="evscene"><canvas id="evscene" width="396" height="200"></canvas><div class="evbub" id="evbub" hidden></div></div><div class="evtext" id="evtext"></div><div id="evextra"></div></div>`;
}
function syncEvent(){
  if(!S||!S.decision||$('scr-life').hidden){if(evMode==='decision'&&(!S||!S.decision))evHide();return}
  if(!evDecOk(S.decision)){evHide();evBanner();return}      // 不備のある回答待ちは、黙って消さずに報告して止める
  if(evMode==='decision'||evMode==='result')return;
  const d=S.decision;evHide();evMode='decision';evPartner=partnerOf(d);
  const h=$('evwin');h.innerHTML=evFrame(d.small?'小さな選択':'イベント！',d.title);h.hidden=false;
  drawZoom();
  if(evPartner!=null&&d.say)evBub('pt',d.say);
  evType(d.body,()=>{$('evextra').innerHTML=`<div class="evopts">${d.opts.map((o,i)=>`<button class="pbtn" data-opt="${i}"${stPreWhy(o)?' disabled':''}>${esc(o.l)}${tmFit(o)?'<small class="fit">気質に合う</small>':''}${stPreWhy(o)?`<small class="fit">${esc(stPreWhy(o))}</small>`:''}</button>`).join('')}</div>`;const b=$('evextra').querySelector('button');if(b)b.focus()});
}
function openResult(d,o,stats){
  evHide();evMode='result';evPartner=partnerOf(d);
  const h=$('evwin');h.innerHTML=evFrame('結果',`「${o.l}」`);h.hidden=false;
  drawZoom();
  const more=t=>`<div class="evmore">▼ ${t}</div>`;
  const st=stats.length?`<div class="evstats">${stats.map(([k,c])=>`<span style="color:var(${STAT[k][1]})">${STAT[k][0]} ${c>0?'+':''}${c}</span>`).join('')}</div>`:'';
  const hasRep=evPartner!=null&&!!o.rep;
  if(o.y)evBub('me',o.y);
  evType(o.x||'…',()=>{
    $('evextra').innerHTML=st+more(hasRep?'タップで続ける':'タップで閉じる');
    if(!hasRep)evFinal=true;
  });
  evRun=()=>{                       /* 相手の返事 → 閉じる */
    evBub('pt',o.rep);evFinal=true;
    $('evextra').innerHTML=st+more('タップで閉じる');
  };
}
let evRun=null;
function evTap(){
  if(!evOpen())return;
  if(!evDone){evSkip&&evSkip();return}
  if(evMode!=='result')return;
  if(evFinal)evClose();else if(evRun){const f=evRun;evRun=null;f()}
}
function evClose(){
  evHide();showFx();
  if(resume){resume=false;start()}
}
function choose(i){
  if(!S||!S.decision)return;              // 回答は一度だけ反映する
  popQ=[];lastBubble=null;
  const d=S.decision;const o=d.opts[i];if(!o)return;
  if(stPreWhy(o)){evHide();syncEvent();return}      // 資源が足りない選択肢は、適用せずに選び直させる
  S.decision=null;
  if(d.small)addLog('n',`「${d.title}」で「${o.l}」を選んだ。${o.x}`,false);else addLog('k',`「${d.title}」で「${o.l}」を選んだ。${o.x}`);
  applyFx(o.fx,o.np,o.rec?'rec':'act',o.sc);
  if(o.np)for(const k in o.np)if(S.npc[k].known&&!S.npc[k].dead)hist(k,`${d.title}：${o.l}`);
  if(o.sk)S.skill=clamp(S.skill+o.sk,0,1000);
  if(o.sx){o.sx.forEach((x,k)=>{S.sx[k]+=x});starAll()}                       // 特別な経験：★の経験値が一気に動く
  if(o.tm){o.tm.forEach(([ax,dir,w])=>tmNudge(S.tm,ax,dir,w,S.age,`${d.title}：${o.l}`));tmReport()}   // 本人の選択で気質が少し動く
  stRun(o,d,i);                                                                // 状態の変更（件・情報・資源・活動）。一つの選択の効果として一度だけ
  if(o.later){if(o.later.fu)S.pending.push({in:evIn(o.later.fu.sp.m),fu:o.later.fu});else S.pending.push({in:Math.max(1,Math.ceil(o.later.m/3)),t:o.later.t,x:o.later.x,fx:o.later.fx})}
  lastBubble=o.l+'！';
  const stats=popQ.filter(q=>Math.abs(q[1])>=3).map(q=>[q[0],q[1]]);
  saveAutoSoon();
  render();
  if(d.small){evClose();return}            // 小さな選択は結果の画面を出さず、そのまま続ける
  openResult(d,o,stats);
}

