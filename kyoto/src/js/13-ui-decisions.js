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
  const yq=S.mode==='q';
  const L=LEARN[S.pid][S.policy==='学び'?'study':'work'],e=L[rnd(L.length)];
  const np={};if(e.np)for(const k in e.np)if(S.npc[k].known&&!S.npc[k].dead)np[k]=e.np[k];
  addLog('n',e.x);lastBubble=e.b;applyFx(e.fx,np);
  for(const k in np)hist(k,e.x);
  S.skill=clamp(S.skill+e.sk*(yq?0.2:0.5),0,1000);
}
function rollSlots(){
  if(S.quarterSlots)return S.quarterSlots;
  const list=[],n=3+rnd(3),r=Math.random(),choices=r<.2?0:r<.55?1:r<.9?2:3;
  for(let i=0;i<n;i++)list.push({k:'o',at:0.1+Math.random()*0.8});
  if(S.age>=4)for(let i=0;i<choices;i++)list.push({k:'c',at:0.1+Math.random()*0.8});
  return S.quarterSlots=list.sort((a,b)=>a.at-b.at);
}
function lifeBlocked(){return !!(S.decision||S.pendingResult||S.dead)}
function runSlot(s){
  if(!S||lifeBlocked())return;
  const i=slots.indexOf(s);if(i<0)return;slots.splice(i,1);
  popQ=[];lastBubble=null;
  if(s.k==='o')fireOrdinary();
  else if(s.k==='c'){
    const pool=EV.filter(e=>(e.k==='s'||(S.age>=13&&e.k==='b'))&&evElig(e));
    const e=evChoose(pool);if(e)S.decision=evBuild(e);
  }
  if(lifeBlocked()&&timer){resume=true;stop()}
}
function fireSlot(s){runSlot(s);render();showFx();saveAutoSoon()}
function flushSlots(){slots.slice().forEach(runSlot)}
function armSlots(ms){
  evT.forEach(clearTimeout);evT=[];
  const full=SPEEDS[speedIdx][0],p0=1-ms/full;
  slots.forEach(s=>evT.push(setTimeout(()=>fireSlot(s),Math.max(50,(s.at-p0)*full))));
}
function tick(){
  if(lifeBlocked())return false;
  S.mode='q';
  const P=PERSONAS[S.pid],yq=S.mode==='q',yrs=yq?0.25:1;
  popQ=[];lastBubble=null;
  const notices=[];
  // calendar
  let bday=false;
  if(yq){S.q++;S.t+=0.25;if(S.q>3){S.q=0;S.year++;S.age++;bday=true}}
  else{S.year++;S.age++;S.t+=1;bday=true}
  if(bday){
    const was=bandOf(S.age-1),now=bandOf(S.age);
    if(was!==now)addLog('k',`${now}になった。（${S.age}歳）`,true);
    else addLog('k',`${S.age}歳になった。`,S.age%10===0);
    lastBubble=`${S.age}歳！`;
    S.npc.forEach(n=>{if(!n.known&&n.from!=null&&S.age>=n.from){n.known=true;const tx=n.fromText?`${n.name}${n.fromText}`:`${n.name}と顔を合わせるようになった。`;addLog('n',tx,true);hist(S.npc.indexOf(n),n.fromText?'生まれた':'顔を合わせるようになった')}});

  }
  // growth / policy drift (all numbers are placeholders)
  natStep(S,S.age,yrs,true);
  xpDecay(S,yrs,S.age,XP_DECAY_ME);starAll();
  S.npc.forEach(n=>{if(n.known&&!n.dead)n.aff=clamp(n.aff+rnd(5)-2,0,100)});
  tmReport();
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
        notices.push(`${n.name}が亡くなった。`);
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
    notices.push('近所の人や親族に支えられて暮らすことになった。');
    S.orphan=true;addLog('c','身寄りが少なくなり、近所の人や親族に支えられて暮らすことになった。',true);applyFx([0,0,-9,0]);S.sx[2]-=40;starAll();
  }
  stIds();stMonths(yq?3:12);                // 状態の進行：外側は四半期・年のまま、内部だけ月順（収支・活動・件の確認・期限）
  // 後日談（旧形式）：旧セーブに残っている予約だけを届ける。新しい決断の後日談は「件」が受け持つ
  if(S.pending&&S.pending.length){
    const due=[];S.pending=S.pending.filter(p=>{if(--p.in<=0){due.push(p);return false}return true});
    due.forEach(p=>{if(p.fu)evFollowDue(p);else{addLog(p.t==='r'?'r':'n',p.x,true);applyFx(p.fx,null,'rec')}});
  }
  // illness
  if(S.ongoing){
    S.stats[0]=clamp(S.stats[0]+10,0,1000);
    if(--S.ongoing.left<=0){addLog('c','体調がすっかり戻った。',true);S.ongoing=null}
  }else{
    const pill=(0.05+S.age/1500)*(yq?1:3)*(S.age<6?1.6:1);
    if(Math.random()<pill){
      const sev=Math.random()<0.05+S.age/1200;
      S.ongoing={name:sev?'重い病':'風邪',mult:sev?HZ.sevMult:HZ.illMult,left:yq?1+rnd(2):1};
      if(sev)notices.push('重い病にかかり、長く床につくことになった。');
      const d=sev?150:60;S.stats[0]=clamp(S.stats[0]-d,0,1000);popQ.push([0,-d]);emo('self','sad');if(sev){S.sx[0]-=70;starAll()}   /* 重い病は、体力の伸びやすさを下げることがある（特別な経験） */
      lastBubble=sev?'ううっ…':'ゴホゴホ…';
      addLog('c',sev?'重い病にかかり、長く床につくことになった。':'風邪をひき、しばらく療養することになった。',true);
    }
  }
  stHlSync();
  // death (age-based hazard, raised by low stamina, illness and accidents)
  const h=annualHazard(S.age,S.stats[0],S.ongoing);
  if(S.age>=MAXAGE||Math.random()<1-Math.exp(-h.tot*yrs)){die(h);saveAutoSoon();return true}
  // 随時の選択はゲージの途中で抽選。必要な件の進行は stMonths が担当する。
  S.quarterSlots=null;slots=[];S.quarterProgress=0;
  if(notices.length)(S.stopQueue||(S.stopQueue=[])).push(...notices);
  lifeShowNotice();
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
  if(S&&S.pendingResult&&!$('scr-life').hidden){if(evMode!=='result'){const r=S.pendingResult;openResult(r.d,r.o,r.stats)}return}
  if(!S||!S.decision||$('scr-life').hidden){if(evMode==='decision'&&(!S||!S.decision))evHide();return}
  if(!evDecOk(S.decision)){evHide();evBanner();return}      // 不備のある回答待ちは、黙って消さずに報告して止める
  if(evMode==='decision'||evMode==='result')return;
  const d=S.decision;evHide();evMode='decision';evPartner=partnerOf(d);
  const h=$('evwin');h.innerHTML=evFrame(d.small?'小さな選択':'イベント！',d.title);h.hidden=false;
  drawZoom();
  if(evPartner!=null&&d.say)evBub('pt',d.say);
  evType(d.body,()=>{$('evextra').innerHTML=`<div class="evopts">${d.opts.map((o,i)=>`<button class="pbtn" data-opt="${i}"${stPreWhy(o)?' disabled':''}>${esc(o.l)}${lifeCost(o)?`<small class="fit">${esc(lifeCost(o))}</small>`:''}${tmFit(o)?'<small class="fit">気質に合う</small>':''}${stPreWhy(o)?`<small class="fit">${esc(stPreWhy(o))}</small>`:''}</button>`).join('')}</div>`;const b=$('evextra').querySelector('button');if(b)b.focus()});
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
    $('evextra').innerHTML=st+more('タップで続ける');
    if(!hasRep)evFinal=true;
  });
  evRun=()=>{                       /* 相手の返事 → 閉じる */
    evBub('pt',o.rep);evFinal=true;
    $('evextra').innerHTML=st+more('タップで続ける');
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
  if(S)S.pendingResult=null;
  evHide();lifeShowNotice();render();showFx();saveAutoSoon();
  if(resume){resume=false;start()}
}
function choose(i){
  if(!S||!S.decision||S.pendingResult)return;              // 回答は一度だけ反映する
  popQ=[];lastBubble=null;
  const d=S.decision;const o=d.opts[i];if(!o)return;
  if(stPreWhy(o)){evHide();syncEvent();return}      // 資源が足りない選択肢は、適用せずに選び直させる
  const oldState={cases:S.ths.map(t=>`${t.id}|${t.st}`),info:S.inf.map(x=>x.id),form:S.wk.form,acts:S.wk.acts.map(a=>`${a.k}|${a.st}`)};
  const before={stats:S.stats.slice(),aff:S.npc.map(n=>n.aff),fund:S.hh.fund,food:S.hh.food,goods:S.hh.goods};
  S.decision=null;
  if(d.small)addLog('n',`「${d.title}」で「${o.l}」を選んだ。${o.x}`,false);else addLog('k',`「${d.title}」で「${o.l}」を選んだ。${o.x}`);
  applyFx(o.fx,o.np,o.rec?'rec':'act',o.sc);
  if(o.np)for(const k in o.np)if(S.npc[k].known&&!S.npc[k].dead)hist(k,`${d.title}：${o.l}`);
  if(o.sk)S.skill=clamp(S.skill+o.sk,0,1000);
  if(o.sx){o.sx.forEach((x,k)=>{S.sx[k]+=x});starAll()}                       // 特別な経験：★の経験値が一気に動く
  if(o.tm){o.tm.forEach(([ax,dir,w])=>tmNudge(S.tm,ax,dir,w,S.age,`${d.title}：${o.l}`));tmReport()}   // 本人の選択で気質が少し動く
  stRun(o,d,i);                                                                // 状態の変更（件・情報・資源・活動）。一つの選択の効果として一度だけ
  if(o.later){if(o.later.fu)S.pending.push({in:evIn(o.later.fu.sp.m),fu:o.later.fu});else S.pending.push({in:S.mode==='q'?Math.max(1,Math.ceil(o.later.m/3)):1,t:o.later.t,x:o.later.x,fx:o.later.fx})}
  lastBubble=o.l+'！';
  const stats=S.stats.map((v,k)=>[k,v-before.stats[k]]).filter(([,v])=>v!==0);
  const changes=[];
  S.npc.forEach((n,k)=>{const v=n.aff-before.aff[k];if(v)changes.push(`${n.name}との親しさ ${v>0?'+':''}${v}`)});
  for(const [k,label] of [['fund','お金'],['food','食料'],['goods','物資']]){const v=S.hh[k]-before[k];if(v)changes.push(`${label} ${v>0?'+':''}${stFmt(v)}`)}
  S.ths.forEach(t=>{if(!oldState.cases.includes(`${t.id}|${t.st}`))changes.push(`${t.ttl}：${t.st}`)});
  S.inf.forEach(x=>{if(!oldState.info.includes(x.id))changes.push(x.x)});
  if(oldState.form!==S.wk.form)changes.push(`仕事：${S.wk.form}`);
  S.wk.acts.forEach(a=>{if(!oldState.acts.includes(`${a.k}|${a.st}`))changes.push(`${a.k}：${a.st}`)});
  const resultOption={...o,x:[o.x,...changes].filter(Boolean).join('\n')};
  S.pendingResult={d,o:resultOption,stats};
  saveAutoSoon();
  render();
  openResult(d,resultOption,stats);
}

// 自発的な行動も、現在の条件で成立する既存の出来事だけを使う。
const LIFE_ACTIONS={相談:e=>/相談/.test(e.t+' '+e.b),学習:e=>e.g===4,仕事:e=>e.g===5};
function lifeActionPool(k){
  if(S.age<4||(k==='学習'&&S.age<6)||(k==='仕事'&&S.age<13))return [];
  return EV.filter(e=>(e.k==='s'||(e.k==='b'&&S.age>=13))&&LIFE_ACTIONS[k](e)&&evElig(e));
}
function lifeActionsRender(){
  const el=$('life-actions');if(!el)return;
  el.innerHTML=S.age<4?'<p class="note">養育者に任せて、暮らしを見守る時期です。</p>':Object.keys(LIFE_ACTIONS).map(k=>`<button class="pbtn" data-action="${k}"${lifeBlocked()||!lifeActionPool(k).length?' disabled':''}>${k}</button>`).join('')+'<p class="note">今の年齢や人とのつながりでできる行動が選べます。選んだ後に内容と選択肢を確認します。</p>';
}
function lifeAction(k){
  if(!LIFE_ACTIONS[k]||lifeBlocked())return;
  const e=evChoose(lifeActionPool(k));if(!e)return;
  if(timer){resume=true;stop()}
  S.decision=evBuild(e);go('life');render();saveAutoSoon();
}

function lifeShowNotice(){
  if(S.decision||S.pendingResult||!S.stopQueue?.length||S.dead)return;
  const x=S.stopQueue.shift();
  S.pendingResult={d:{title:'暮らしの変化'},o:{l:'確認',x},stats:[]};
}
function lifeCost(o){
  const labels={fund:'お金',food:'食料',goods:'物資'},cost=[];
  for(const c of o.st||[]){
    if(c.t==='rs'&&c.hard&&c.sg<0)cost.push(`${labels[c.a]||'資源'} −${stFmt(c.n)}`);
    else if(c.t==='ln')cost.push(`お金 −${stFmt(c.n)}`);
    else if(c.t==='tm')cost.push(`自由時間 −${c.n}`);
  }
  return cost.length?cost.join('・'):'';
}
