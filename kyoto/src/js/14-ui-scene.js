// 14-ui-scene.js — 描画：生活画面の風景・人物の絵・感情マーク・タップ選択
/* ---------- rendering ---------- */
const cv=$('cv'),cx=cv.getContext('2d');
const imgCache={};
function img(key,season){
  const k=key+season;
  if(!imgCache[k]){const im=new Image();im.onload=()=>drawScene();im.src=BG[key][season];imgCache[k]=im}
  return imgCache[k];
}
let frame=0;
function curSeason(){return seasonOv||(S.mode==='y'?'spring':QS[S.q])}
function playSeasons(){
  seasonTimers.forEach(clearTimeout);seasonTimers=[];
  if(S.mode!=='y'||!timer)return;
  const ms=SPEEDS[speedIdx][0]/4;
  QS.forEach((s,i)=>seasonTimers.push(setTimeout(()=>{seasonOv=s;drawScene()},i*ms)));
  seasonTimers.push(setTimeout(()=>{seasonOv=null;drawScene()},4*ms));
}
function drawScene(){
  if(!S)return;
  const P=PERSONAS[S.pid],im=img(S.pid,curSeason());
  cx.imageSmoothingEnabled=false;
  cx.clearRect(0,0,288,96);
  if(im.complete&&im.naturalWidth)cx.drawImage(im,0,0);
  drawPerson();
}
/* 人物：ユーザー制作のスプライト（64×64）を拡大せず等倍で重ねる。
   背景は2倍表示なので、人物のドットは背景より細かくなる（仮の見え方）。
   主人公と、知っている周りの人物が、道の帯（WALK）の中を歩き回る（位置は保存しない） */
const cv2=$('cv2'),cx2=cv2.getContext('2d');
const tmpc=document.createElement('canvas');tmpc.width=64;tmpc.height=64;const tcx=tmpc.getContext('2d');
const sprImg={};
function spr(url){
  if(!sprImg[url]){const im=new Image();im.onload=()=>{drawPerson();if(S&&!$('scr-map').hidden)renderMap()};im.src=url;sprImg[url]=im}
  return sprImg[url];
}
const ok=im=>im.complete&&im.naturalWidth;
function dropRows(age){
  if(age<3)return[];
  if(age<6)return[41,42,43,44,45,46,52,53,54];   /* 幼児：体を短くして頭を大きく見せる（仮） */
  if(age<13)return[41,42,43,44,53,54];             /* 学童（仮） */
  return[];
}
function layer(c,im,drops,dy,spread){
  let out=0,y=0;
  while(y<64){
    if(drops.includes(y)){y++;continue}
    let e=y+1;while(e<64&&!drops.includes(e)&&e!==51&&e!==59)e++;
    const h=e-y;
    if(spread&&y>=51&&e<=59){
      c.drawImage(im,0,y,32,h,-1,dy+out,32,h);c.drawImage(im,30,y,34,h,31,dy+out,34,h);   /* 内側の輪郭を両脚に残して左右に1ドットずつ開く */
    }else c.drawImage(im,0,y,64,h,0,dy+out,64,h);
    out+=h;y=e;
  }
}
const WALK={x0:16,x1:272,y0:82,y1:93};
const walkers={};let walkSid=null;
const SKINIDX={aristocrat:0,common:1,farm:2,artisan:1};
NEWP.concat(NEWP2).forEach(([k,b])=>{SKINIDX[k]=SKINIDX[b]});
const rr=(a,b)=>a+Math.random()*(b-a);
function mkW(x,y,i){return{x,y,tx:x,ty:y,wait:rr(.5,3),dir:1,moving:false,ph:0,i}}
function syncWalkers(){
  if(!S)return;
  if(walkSid!==S){for(const k in walkers)delete walkers[k];walkSid=S;selK=null}
  const P=PERSONAS[S.pid];
  if(!walkers.self)walkers.self=mkW(P.pos[0],WALK.y0+3,-1);
  S.npc.forEach((n,i)=>{
    const k='n'+i,on=n.known&&!n.dead;
    if(on&&!walkers[k])walkers[k]=mkW(clamp(P.pos[0]+rr(-70,70),WALK.x0,WALK.x1),rr(WALK.y0,WALK.y1),i);
    if(!on&&walkers[k])delete walkers[k];
  });
}
function ageOf(w){if(w.i<0)return S.age;const n=S.npc[w.i];return n?npcAge(n):30}
function stepW(w,dt,age){
  const sp=age<3?5:age<13?11:14;
  if(w.wait>0){w.wait-=dt;w.moving=false;if(w.wait<=0){const r=age<3?30:90;w.tx=clamp(w.x+rr(-r,r),WALK.x0,WALK.x1);w.ty=clamp(w.y+rr(-9,9),WALK.y0,WALK.y1)}return}
  const dx=w.tx-w.x,dy=w.ty-w.y,d=Math.hypot(dx,dy);
  if(d<1){w.moving=false;w.wait=rr(1.5,5);return}
  const s=Math.min(d,sp*dt);w.x+=dx/d*s;w.y+=dy/d*s;w.moving=true;if(Math.abs(dx)>.5)w.dir=dx>0?1:-1;w.ph+=dt*3.5;
}
function lookOf(w,age){
  if(w.i<0){return{baby:SPR.baby[hash(S.pid+S.switchAge)%2],body:SPR.body[S.pid],hair:(age>=60?SPR.hairGray:SPR.hair)[S.pid]}}
  const n=S.npc[w.i],h=hash(n.name+n.rel),fem=FEMALE.test(n.name+n.rel);
  const ci=age>=60?4:[0,0,1,1,2,3][(h>>>4)%6];
  return{baby:SPR.baby[h%2],body:SPR.nb[SKINIDX[S.pid]][h%7],hair:SPR.nh[fem?1:0][ci]};
}
let selK=null;
const olc=document.createElement('canvas');olc.width=68;olc.height=68;const olx=olc.getContext('2d');
/* 選択中は、tmpc の絵を白で縁取って描く（縁は2ドット）。通常は tmpc をそのまま描く */
function blit(w,x,y){
  if(selK&&walkers[selK]===w){
    olx.globalCompositeOperation='source-over';olx.clearRect(0,0,68,68);
    for(let a=-2;a<=2;a++)for(let b=-2;b<=2;b++){if(!a&&!b)continue;if(Math.abs(a)===2&&Math.abs(b)===2)continue;olx.drawImage(tmpc,2+a,2+b)}
    olx.globalCompositeOperation='source-in';olx.fillStyle='#fff';olx.fillRect(0,0,68,68);
    olx.globalCompositeOperation='source-over';olx.drawImage(tmpc,2,2);
    cx2.drawImage(olc,x-2,y-2);
  }else cx2.drawImage(tmpc,x,y);
}
function drawW(w,age){
  const L=lookOf(w,age),f=w.moving?Math.floor(w.ph)%2:0,bob=w.moving&&f?-1:0;
  const bx=Math.round(w.x*2),by=Math.round(w.y*2);
  let dx,dy;
  if(age<3){
    const bi=hash(w.i<0?S.pid+S.switchAge:S.npc[w.i].name+S.npc[w.i].rel)%2;const im=spr(SPR.baby[bi]);if(!ok(im))return;
    /* 這う動き：絵は1枚。歩く間、1ドットずつ頭〜体の上側を下げて戻す（輪郭のドットは崩さない） */
    tcx.clearRect(0,0,64,64);
    if(w.moving&&f){tcx.drawImage(im,0,0,64,46,0,1,64,46);tcx.drawImage(im,0,46,64,18,0,46,64,18)}else tcx.drawImage(im,0,0);
    cx2.save();cx2.translate(bx,0);if(w.dir>0)cx2.scale(-1,1);   /* 絵は左向き */
    blit(w,-32,by-60);cx2.restore();dx=bx-32;dy=by-60;
  }else{
    const body=spr(L.body),hair=spr(L.hair);if(!ok(body)||!ok(hair))return;
    const drops=dropRows(age),above=drops.filter(r=>r<57).length;
    tcx.clearRect(0,0,64,64);
    layer(tcx,body,drops,above,w.moving&&f);layer(tcx,hair,drops,above,false);
    cx2.save();cx2.translate(bx,0);if(w.dir>0)cx2.scale(-1,1);      /* 絵は左向き */
    blit(w,-31,by-57+bob);cx2.restore();dx=bx-31;dy=by-57;
  }
  if(w.i<0){ /* 主人公の目印 */
    const mx=bx,my=dy+(age<3?20:8)+bob;cx2.fillStyle='#ee7b2e';
    cx2.fillRect(mx-3,my,7,1);cx2.fillRect(mx-2,my+1,5,1);cx2.fillRect(mx-1,my+2,3,1);cx2.fillRect(mx,my+3,1,1);
  }
}
/* 感情マーク（9ドット以内の小さなドット絵）。出来事の結果で、頭の上に短く出る */
const EMO={
  joy:{c:'#f2a31c',m:['...###.','...#..#','...#.##','...#...','...#...','.###...','####...','.##....']},
  sad:{c:'#4a90d9',m:['..#..','..#..','.###.','.###.','#####','#####','.###.']},
  love:{c:'#e8506e',m:['.##.##.','#######','#######','.#####.','..###..','...#...']},
  anger:{c:'#d9302a',m:['##...##','###.###','.#####.','..###..','.#####.','###.###','##...##']}
};
function drawEmote(w,age){
  const e=w.emote;if(!e)return;
  const t=performance.now()-e.t0,D=2800;
  if(t>D){w.emote=null;return}
  const E=EMO[e.type];if(!E)return;
  if(t>D-500&&Math.floor(t/90)%2)return;                       /* 消える前に点滅 */
  const rise=Math.min(6,t/120),hy=Math.round(w.y*2)-(age<3?31:41);
  const x0=Math.round(w.x*2)+12,y0=hy-18-Math.round(rise);
  const dr=(c,dx,dy)=>{cx2.fillStyle=c;E.m.forEach((row,j)=>{for(let i=0;i<row.length;i++)if(row[i]==='#')cx2.fillRect(x0+i*2+dx,y0+j*2+dy,2,2)})};
  [[-2,0],[2,0],[0,-2],[0,2]].forEach(o=>dr('#3b2a14',o[0],o[1]));dr(E.c,0,0);
}
function drawPerson(){
  if(!S)return;
  syncWalkers();
  cx2.imageSmoothingEnabled=false;cx2.clearRect(0,0,576,192);
  Object.values(walkers).sort((a,b)=>a.y-b.y).forEach(w=>drawW(w,ageOf(w)));
  Object.values(walkers).forEach(w=>drawEmote(w,ageOf(w)));
  updateSel();
}
/* 選択中の人物の頭の上に、名前と好感度を出す */
function updateSel(){
  const el=$('sellab');if(!el)return;
  const w=selK&&walkers[selK];
  if(!w){selK=null;el.hidden=true;return}
  const age=ageOf(w),n=w.i>=0?S.npc[w.i]:null;
  const html=n?`${esc(n.name.replace('',''))} <b>♥${Math.round(n.aff)}</b>`:`${esc(nameOf().replace('',''))}`;
  if(el._h!==html){el.innerHTML=html;el._h=html}
  el.hidden=false;
  el.style.left=Math.round(clamp(w.x*2,44,532))+'px';
  el.style.top=Math.max(22,Math.round(w.y*2)-(age<3?34:46))+'px';
}
let lastWT=performance.now();
setInterval(()=>{
  const now=performance.now(),dt=Math.min(.2,(now-lastWT)/1000);lastWT=now;
  if(!S||$('scr-life').hidden||document.hidden)return;
  syncWalkers();
  if(!evOpen())for(const k in walkers)stepW(walkers[k],dt,ageOf(walkers[k]))
  drawPerson();
  if(evOpen())drawZoom();
},60);

let sceneX=null;
/* 人物をタップで選択、背景をタップで解除（ドラッグでスライドしたときは無視） */
(()=>{const el=$('scene');let dn=null;
 el.addEventListener('pointerdown',e=>{dn={x:e.clientX,y:e.clientY}});
 el.addEventListener('click',e=>{
  if(dn&&Math.hypot(e.clientX-dn.x,e.clientY-dn.y)>8){dn=null;return}
  dn=null;if(!S)return;
  const r=$('cv2').getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;
  let hit=null,hy=-1;
  for(const k in walkers){const w=walkers[k],bx=w.x*2,by=w.y*2,age=ageOf(w),hh=age<3?34:50;
   if(Math.abs(x-bx)<=18&&y>=by-hh&&y<=by+6&&by>hy){hit=k;hy=by}}
  selK=hit;drawPerson();
 });
})();
const sc=()=>$('scene');
function centerScene(){const el=sc();if(!el.clientWidth)return;el.scrollLeft=Math.max(0,PERSONAS[S.pid].pos[0]*2-el.clientWidth/2);sceneX=el.scrollLeft}
(()=>{let d=null;const el=sc();
 el.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse')return;d={x:e.clientX,s:el.scrollLeft};el.classList.add('drag');el.setPointerCapture(e.pointerId)});
 el.addEventListener('pointermove',e=>{if(d)el.scrollLeft=d.s-(e.clientX-d.x)});
 const up=()=>{d=null;el.classList.remove('drag')};
 el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);
 el.addEventListener('keydown',e=>{if(e.key==='ArrowLeft')el.scrollLeft-=40;if(e.key==='ArrowRight')el.scrollLeft+=40});
})();
function showFx(){
  const host=$('fxl');
  if(!host||$('scr-life').hidden||!S){emoQ=[];return}
  emoQ.forEach(([who,type])=>{const w=walkers[who];if(w)w.emote={type,t0:performance.now()}});emoQ=[];
  const P=PERSONAS[S.pid],mw=walkers.self,px=mw?mw.x:P.pos[0],py=mw?mw.y:P.pos[1];
  const add=(cls,html,left,top,color)=>{
    const el=document.createElement('div');el.className=cls;el.innerHTML=html;
    el.style.left=left/288*100+'%';el.style.top=top/96*100+'%';if(color)el.style.color=color;
    host.appendChild(el);setTimeout(()=>el.remove(),2300);
  };
  if(lastBubble){host.querySelectorAll('.bub').forEach(e=>e.remove());add('bub',lastBubble,px,py-25);}
  popQ.filter(q=>Math.abs(q[1])>=5).slice(0,3).forEach((q,i)=>{
    const sx=[-54,54,0][i];
    add('pop',`<small>${STAT[q[0]][0]}</small>${q[1]>0?'+':''}${q[1]}`,px+sx,i===2?py-56:py-14,`var(${STAT[q[0]][1]})`);
  });
  popQ=[];lastBubble=null;
}
function render(){
  const P=PERSONAS[S.pid],sm=S.sm||stepMonths(S.age),yq=sm<12;
  $('ym').textContent=dateLabel();
  evBanner();
  $('elapsed').textContent=`経過 ${Math.floor(S.t)}年（${sm===3?'3か月':sm===6?'半年':'1年'}ごとに進行）`;
  const segs=yq?4:11,on=yq?S.q:Math.floor(S.age/10);   // 1年未満ごとの間は1年の四季の位置、1年ごとの間は年代の位置
  $('months').style.gridTemplateColumns=`repeat(${segs},1fr)`;
  $('months').innerHTML=Array.from({length:segs},(_,i)=>`<i class="${i<=on?'on':''}"></i>`).join('');
  $('play').innerHTML=timer?'■ 停止':'<span class="tri">▲</span> 再生';
  $('play').disabled=!!S.decision||S.dead;
  $('speed').textContent=SPEEDS[speedIdx][1];
  $('adv1').textContent=sm===3?'1期':sm===6?'半年':'1年';$('adv12').textContent=sm===12?'5年':'1年';
  $('pname').textContent=nameOf();$('page').textContent=`${S.age}歳・${bandOf(S.age)}`;
  $('ptm').textContent=S.tm.on?`気質 ${tmType(S.tm)}`:'気質 形成中';
  $('pplace').textContent=`${P.place}（${P.label}）`;$('pera').textContent=S.era||P.era;
  $('seasonlab').textContent=`${yq?QL[S.q]:'一年'}の景色（左右にスライドできます）`;
  $('stats').innerHTML=STAT.map(([n,c],i)=>`<div class="stat"><div class="h"><span style="color:var(${c})">${n}</span><span>${Math.round(S.stats[i])}<span class="st">${starStr(S.star[i])}</span></span></div></div>`).join('');
  $('policy').innerHTML=S.age<6?'<span class="note">養育者に任せる時期です</span>':Object.keys(POLICIES).map(k=>`<button class="chip" data-pol="${k}" aria-pressed="${k===S.policy}">${k}</button>`).join('');
  const host=$('decisionHost');
  const li=a=>a.map(e=>`<li><time>${e.ym}</time><span class="t ${e.t}">${TYPE[e.t]}</span><span class="x">${e.x}</span></li>`).join('');
  if(S.dead){
    host.innerHTML=`<div class="card decision" role="region" aria-label="振り返り"><h3>${nameOf()}の人生</h3><p>${S.deathAge}歳で亡くなりました。（死因：${S.cause}）</p><h2>年表（節目と主な出来事）</h2><ul class="log">${S.chron.map(e=>`<li><time>${e.age}歳</time><span class="t ${e.t}">${TYPE[e.t]}</span><span class="x">${e.x}</span></li>`).join('')}</ul><div class="opts" style="margin-top:10px"><button class="pbtn primary" data-next="1">次の人生へ</button></div></div>`;
  }else host.innerHTML='';
  $('recent').innerHTML=li(S.log.slice(0,6));
  $('ledger').innerHTML=li(S.log);
  renderMap();
  stRender();stDevRender();
  syncEvent();
  document.querySelectorAll('#personas .chip').forEach(b=>{b.setAttribute('aria-pressed',b.dataset.p===S.pid);b.disabled=birthMode==='random'});
  document.querySelectorAll('#bmode .chip').forEach(b=>b.setAttribute('aria-pressed',b.dataset.bm===birthMode));
  $('newrand').hidden=birthMode!=='random';
  drawScene();
}
window.addEventListener('resize',()=>{if(S&&!$('scr-map').hidden)renderMap()});
function approxAge(a){
  if(a<13)return `約${a}歳`;
  const d=Math.floor(a/10)*10,r=a%10;
  return `${d}代${r<4?'前半':r<7?'半ば':'後半'}`;
}
