// 18-birth-ceremony.js — 誕生の演出
/* ---------- 誕生の演出 ---------- */
let bthSound=true,bthAC=null,bthTimers=[];
function bthBeep(f,d,v,type){
  if(!bthSound)return;
  try{bthAC=bthAC||new (window.AudioContext||window.webkitAudioContext)();if(bthAC.state==='suspended')bthAC.resume();
    const o=bthAC.createOscillator(),g=bthAC.createGain();o.type=type||'square';o.frequency.value=f;
    const t=bthAC.currentTime,v0=v||.03;g.gain.setValueAtTime(v0,t);g.gain.exponentialRampToValueAtTime(.0001,t+(d||.05));
    o.connect(g);g.connect(bthAC.destination);o.start(t);o.stop(t+(d||.05)+.02)}catch(e){}
}
const bthWait=(fn,ms)=>{const t=setTimeout(fn,ms);bthTimers.push(t);return t};
const bthEnd=()=>{bthTimers.forEach(clearTimeout);bthTimers=[];const el=$('bth');if(el)el.remove();document.querySelectorAll('.cfet').forEach(e=>e.remove())};
function bthConfetti(){
  const box=document.createElement('div');box.className='cfet';box.setAttribute('aria-hidden','true');
  const cols=['var(--accent)','var(--good)','var(--s-know)','var(--s-will)','var(--s-charm)','var(--warn)'];
  box.innerHTML=Array.from({length:40},(_,i)=>`<i style="left:${Math.floor(Math.random()*100)}%;background:${cols[i%cols.length]};animation-delay:${(Math.random()*.6).toFixed(2)}s;animation-duration:${(1.4+Math.random()).toFixed(2)}s"></i>`).join('');
  document.body.appendChild(box);setTimeout(()=>box.remove(),2800);
}
/* ランダムで、その境遇に生まれる確率（％）：年が一様、その年に生まれうる境遇の重みで決まる */
function bthProb(pid){
  let p=0;for(let y=0;y<=1900;y++){const c=Object.keys(RANDW).filter(k=>y>=PERSONAS[k].yr[0]&&y<PERSONAS[k].yr[1]);
    if(c.includes(pid))p+=RANDW[pid]/c.reduce((a,k)=>a+RANDW[k],0)}
  return p/1901*100;
}
const BTH_ERAS=[['古代',0,794],['平安',794,1185],['鎌倉',1185,1333],['室町',1333,1573],['安土桃山',1573,1603],['江戸',1603,1868],['明治〜',1868,2000]];
const BTH_COL=['#e8d7a6','#e3c27a','#d9a867','#c98f5a','#d97a5a','#b9825a','#9fa89a'];
function bthRarity(p){return p<1?['とてもまれ','r3']:p<3?['まれ','r2']:p<8?['ときどき','r1']:['よくある','r0']}
function birthCeremony(rand){
  bthEnd();
  const P=PERSONAS[S.pid],yr=S.year,reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const el=document.createElement('div');el.className='bth';el.id='bth';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label','誕生');
  document.body.appendChild(el);el.scrollTop=0;
  const pct=bthProb(S.pid),[rk,rc]=bthRarity(pct);
  const pos=y=>Math.max(0,Math.min(100,y/2000*100));
  const showStep=(html)=>{el.innerHTML=`<div class="in">${html}</div>`;el.scrollTop=0};
  const skip=()=>{bthEnd()};
  /* 1. 時代のルーレット */
  showStep(`<div class="bth-top"><p>いつかの京都で、ひとりの赤ちゃんが生まれる。</p><button class="sm" id="bsnd" aria-pressed="${bthSound}">${bthSound?'音あり':'音なし'}</button></div>
    <div class="axis" aria-label="時代の年表"><div class="trk" id="btrk">${BTH_ERAS.map((e,i)=>`<div class="seg" style="width:${(e[2]-e[1])/20}%;background:${BTH_COL[i]}"></div>`).join('')}<div class="mk" id="bmk" style="left:0%"></div></div>
      <div class="lab">${BTH_ERAS.map(e=>`<span style="width:${(e[2]-e[1])/20}%">${e[0]}</span>`).join('')}</div></div>
    <div class="bth-now" id="bnow" aria-live="polite">　</div>
    <div class="bth-pc" id="bpc">　</div>
    <button class="sm" id="bskip" style="align-self:flex-end">とばす</button>`);
  $('bsnd').onclick=()=>{bthSound=!bthSound;$('bsnd').textContent=bthSound?'音あり':'音なし';$('bsnd').setAttribute('aria-pressed',bthSound)};
  $('bskip').onclick=()=>{bthEnd()};
  const steps=reduce?6:30,path=[];
  for(let i=0;i<steps-1;i++){
    if(rand){const b=randomBirth();path.push([b.pid,b.year])}
    else path.push([S.pid,P.yr[0]+rnd(P.yr[1]-P.yr[0])]);
  }
  path.push([S.pid,yr]);
  const show=(pid,y)=>{
    $('bmk').style.left=pos(y)+'%';
    $('bnow').innerHTML=`${y}年<small>${eraName(y)}・${PERSONAS[pid].label}</small>`;
  };
  let i=0;
  const tick=()=>{
    const [pid,y]=path[i];show(pid,y);
    const last=i===path.length-1;
    bthBeep(last?660:520+(i%3)*80,last?.25:.04,last?.05:.025);
    if(!last){i++;const t=i/path.length;bthWait(tick,reduce?160:30+Math.pow(t,3)*380)}
    else bthWait(landed,reduce?200:450);
  };
  bthWait(tick,reduce?100:400);
  function landed(){
    $('bnow').innerHTML=`${yr}年に生まれる${rand?` <span class="rare ${rc}">${rk}</span>`:''}<small>${S.era}・${P.label}</small>`;
    $('bpc').textContent=rand?`この境遇に生まれる確率 ${pct.toFixed(1)}%（0〜1900年の中で）`:`選んだ境遇（${P.yr[0]}〜${P.yr[1]-1}年のうち）`;
    $('bmk').classList.add('won');
    if(rand&&pct<3&&!reduce)bthConfetti();
    [784,988,1318].forEach((f,k)=>bthWait(()=>bthBeep(f,.18,.04,'triangle'),k*110));
    bthWait(reveal,reduce?600:1500);
  }
  /* 2. 生まれの開示（1枚ずつめくる） */
  function reveal(){
    const fam=S.npc.filter(n=>n.rel==='家族'&&n.known&&!n.dead);
    const cards=[['時代',`${yr}年（${eraName(yr)}）`],['生まれた所',P.place],['境遇',P.label],['家族',fam.length?`${fam.length}人`:'いない']];
    showStep(`<p style="font-size:20px">${S.era}に生まれた。</p>
      <div class="flips">${cards.map((x,k)=>`<div class="flip" id="bfl${k}"><small>${x[0]}</small><b>？</b></div>`).join('')}</div>
      <div class="fam" id="bfam" hidden>${fam.map(n=>`<span>${n.name}<small>${n.role||''}</small></span>`).join('')||'<span>まだ、ひとり</span>'}</div>
      <button class="big" id="bok" hidden>出生届を書く</button>`);
    cards.forEach((x,k)=>bthWait(()=>{
      const f=$('bfl'+k);if(!f)return;f.classList.add('open');f.querySelector('b').textContent=x[1];bthBeep(600,.08,.03);
      if(k===cards.length-1){$('bfam').hidden=false;$('bok').hidden=false;$('bok').focus()}
    },(reduce?150:550)*(k+1)));
    $('bok').onclick=cert;
  }
  /* 3. 出生届 */
  function cert(){
    const fam=S.npc.filter(n=>n.rel==='家族'&&n.known&&!n.dead);
    const older=S.npc.filter(n=>n.rel==='家族'&&n.known&&['兄','姉','次兄','次姉'].includes(n.role)).length;
    showStep(`<div class="cert"><div class="h2"><div><h1>出生届</h1><span class="no">${S.era}・第${100+hash(S.lid||S.pid)%9899}号</span></div><div class="stampc" aria-hidden="true">受理</div></div>
      <dl>
        <dt>子の名前</dt><dd><input id="bnm" value="${S.myName}" maxlength="12" aria-label="名前" autocomplete="off"><div style="font-size:13.33px;color:var(--muted);font-family:var(--font-sub)">名前は書きかえられる</div></dd>
        <dt>生まれた時</dt><dd>${yr}年（${eraName(yr)}）の春${older?`・第${older+1}子`:''}</dd>
        <dt>生まれた所</dt><dd>${P.place}</dd>
        <dt>境遇</dt><dd>${P.label}</dd>
        ${fam.map(n=>`<dt>${n.role||'家族'}</dt><dd>${n.name}（${npcAge(n)}歳）</dd>`).join('')}
      </dl>
      <div class="tiles">${STAT.map(([nm],k)=>`<div><small>${nm}</small><b>${Math.round(S.stats[k])} ${starStr(S.star[k])}</b></div>`).join('')}</div>
      <button class="big" id="bgo">この名前で人生を始める</button></div>`);
    bthBeep(300,.12,.05,'triangle');
    const inp=$('bnm');
    const apply=()=>{const v=inp.value.trim();if(v&&v.length<=12){S.myName=v;saveAutoSoon()}};
    inp.oninput=apply;
    $('bgo').onclick=()=>{apply();bthEnd();render();window.scrollTo(0,0)};
  }
}

