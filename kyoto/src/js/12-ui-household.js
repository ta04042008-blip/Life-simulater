// 12-ui-household.js — 画面：家計
/* ---------- 画面：家計 ---------- */
function stBadge(){
  const n=S?S.ths.filter(t=>t.st==='本人確認待ち'&&!t.queued).length:0;
  const b=document.querySelector('.nav button[data-go="home"]');
  if(b)b.textContent='家計'+(n?`（${n}）`:'');
}
function stRender(){
  stBadge();
  const el=$('home-body');if(!el||$('scr-home').hidden)return;
  const h=S.hh,w=S.wk,E=stEsc,f=stFmt;
  const open=S.ths.filter(t=>ST_OPEN.includes(t.st)||t.queued),closed=S.ths.filter(t=>!ST_OPEN.includes(t.st)&&!t.queued).slice(-8).reverse();
  const when=t=>{const r=[];if(t.sk==='work'&&t.st==='作業中')r.push(`作業${t.prog}/${t.len}か月`);if(t.queued)r.push('順番待ち');else if(t.st==='条件不足'&&t.why)r.push(t.why);else if(t.st==='候補探し'&&t.why)r.push(t.why);if(t.due!=null&&ST_OPEN.includes(t.st))r.push(`${Math.max(0,t.due-S.mo)}か月以内`);return r.join('・')};
  const who=t=>{const n=npcById(t.tid);return n?`（${E(n.name)}）`:''};
  const li=t=>`<li class="stth"><b>${E(t.ttl)}</b>${who(t)}<span class="tag">${E(t.st)}</span>${when(t)?`<small>${E(when(t))}</small>`:''}${t.st==='本人確認待ち'&&!t.queued?`<span class="stbtn"><button class="pbtn" data-stc="${t.id}" data-yes="1">進める</button><button class="pbtn" data-stc="${t.id}" data-yes="0">見送る</button></span>`:''}</li>`;
  const loans=h.loans.filter(l=>l.st!=='精算').map(l=>{const n=npcById(l.tid);return `<li>${l.dir==='貸'?'貸し':'借り'}：${E(n?n.name:'相手不明')} ${f(l.left)}（${E(l.st)}）</li>`}).join('');
  const acts=w.acts.map(a=>`<li>${E(a.k)}：${E(a.st)}・実施${a.mo}か月</li>`).join('');
  const works=w.works.map(k=>`<li>作品「${E(k.nm)}」：${E(k.st)}</li>`).join('');
  el.innerHTML=
   `<div class="card msec"><h2>家計<span class="note">成人相当1人分の抽象的な数値</span></h2>
     <div class="kv"><span>資金</span><b>${f(h.fund)}</b><span>食料</span><b>${f(h.food)}</b><span>物資</span><b>${f(h.goods)}</b></div>
     <p class="note">使える量：資金 ${f(stAvail('fund'))}・食料 ${f(stAvail('food'))}・物資 ${f(stAvail('goods'))}（予約を除く）。毎月の収入 ${ST_INC+(S.mo>=h.bonusFrom?h.bonus:0)}・生活費 ${ST_LIV}。</p>
     <p class="note">家庭の備え ${f(h.home)}・共同の備え ${f(h.cstock)}・出資 ${f(h.invest)}・未払 ${f(h.unpaid)}</p>
     ${loans?`<ul class="log">${loans}</ul>`:''}</div>
    <div class="card msec"><h2>住まい・移動</h2>
     <div class="kv"><span>住まいの傷み</span><b>${ST_DMG[S.hs.dmg]}</b><span>備え</span><b>${S.hs.prep} / 10</b><span>滞在先</span><b>${E(S.hs.stay===S.hs.home?'いつもの住まい':S.hs.stay)}</b></div>
     <p class="note">${S.hs.comp?`同行：${E(S.hs.comp.nm)}（${Math.max(0,S.hs.comp.end-S.mo)}か月ほど）`:'同行者：なし'}${S.hs.fac.length?`・共用の施設：修理案${S.hs.fac[0].pr}件・参加${S.hs.fac[0].part}回`:''}</p></div>
    <div class="card msec"><h2>世帯・関係</h2>
     <p class="note">同居：${(()=>{const l=S.npc.filter(n=>n.co&&!n.dead).map(n=>E(n.name));return l.length?l.join('、'):'いない'})()}・家事の分担：${E(S.hd.chore)}</p>
     ${(()=>{const l=Object.keys(S.hd.ppl).map(id=>{const r=S.hd.ppl[id],n=npcById(id);if(!n)return '';const a=[];if(r.love!=='未設定')a.push(r.love);if(r.mar!=='未成立')a.push('婚姻：'+r.mar+(r.inst?`（${r.inst}）`:''));if(r.wp!=='未確認')a.push('本人の意思：'+r.wp);if(r.op!=='未確認')a.push('相手の意思：'+r.op);if(r.adj!=='無し')a.push(r.adj);return a.length?`<li>${E(n.name)}：${E(a.join('・'))}</li>`:''}).join('');return l?`<ul class="log">${l}</ul>`:''})()}
     <p class="note">${S.hd.care.length?'養育：'+S.hd.care.map(x=>{const n=npcById(x.id);return E(n?n.name:'?')}).join('、'):'養育している子：なし'}${S.hd.guests.length?`・地域で受け入れた世帯 ${S.hd.guests.length}`:''}${S.hd.sep.length?`・別に暮らしている家族 ${S.hd.sep.length}人`:''}</p></div>
    <div class="card msec"><h2>健康・介助</h2>
     ${(()=>{const o=stHlOpen();return o.length?`<ul class="log">${o.map(c=>`<li>${E(c.kind)}：${E(c.st)}${c.src==='ev'?`（経過 ${c.p2/2}/${c.need2/2}か月）`:''}</li>`).join('')}</ul>`:'<p class="note">いまのところ、不調やけがはない。</p>'})()}
     <p class="note">仕事の量：${E(S.hl.work)}${S.hl.helper?(()=>{const n=npcById(S.hl.helper.id);return n?'・支援者：'+E(n.name):''})():''}${S.hl.care?(()=>{const n=npcById(S.hl.care.tid);return n?`・介助：${E(n.name)}（毎月 自由時間 ${S.hl.care.n}）`:''})():''}</p></div>
    <div class="card msec"><h2>今月の自由時間</h2>
     <div class="kv"><span>残り</span><b>${Math.max(0,frLeft())} / ${ST_FREE}</b><span>使用</span><b>${S.free.use}</b><span>予約</span><b>${S.free.resv}</b></div></div>
    <div class="card msec"><h2>進行中のこと</h2>
     ${open.length?`<ul class="log">${open.map(li).join('')}</ul>`:'<p class="note">いまのところ、ありません。</p>'}
     ${closed.length?`<h2>最近終わったこと</h2><ul class="log">${closed.map(li).join('')}</ul>`:''}</div>
    <div class="card msec"><h2>仕事・学び・活動</h2>
     <div class="kv"><span>就業の形</span><b>${E(w.form)}</b><span>職種</span><b>${E(w.trade||PERSONAS[S.pid].skillName)}</b><span>修業</span><b>${E(w.train)}</b></div>
     <p class="note">仕事の実施月数 ${w.worked}か月・活動方式「${E(w.meth)}」${w.roles.length?'・役割：'+w.roles.map(E).join('、'):''}</p>
     ${(acts||works)?`<ul class="log">${acts}${works}</ul>`:''}</div>
    <div class="card msec"><h2>聞いたこと・約束</h2>
     ${S.inf.length?`<ul class="log">${S.inf.slice(0,12).map(x=>`<li><span class="tag">${E(x.k)}</span><span class="x">${E(x.x)}</span><small>${E(x.cf)}</small></li>`).join('')}</ul>`:'<p class="note">まだありません。</p>'}</div>`;
}
function stDevRender(){
  const el=$('stdev');if(!el)return;
  const E=stEsc;
  const ex=ST_EXCL?EV.filter(stBlocked):[];
  const hold=S.hold.map(x=>`<li>${E(x.ev)}「${E(x.m)}」：${E(x.why)}（${x.n}回）</li>`).join('');
  const bad=S.bad.map(x=>`<li>${E(x.item)}：${E(x.why)}</li>`).join('');
  el.innerHTML=`<h2>状態システムの確認（開発者向け）</h2>
    <p class="note">導入済み：件・情報・仕事・資源・住居・世帯・健康。</p>
    <p class="note">いま出さないイベント（${ex.length}件）：${ex.length?E(ex.map(e=>`${e.id} ${e.t}`).join('、')):'なし'}</p>
    <p class="note">保留中の処理（${S.hold.length}種）：</p>${hold?`<ul class="log">${hold}</ul>`:''}
    <p class="note">仮に用意した対象：${S.pob.length?E(S.pob.join('、')):'なし'}</p>
    <p class="note">不備（${S.bad.length}件）：</p>${bad?`<ul class="log">${bad}</ul>`:''}`;
}


function eventPool(){
  const P=PERSONAS[S.pid],a=S.age;
  let pool=P.ev.filter(e=>a>=e.minAge);
  if(a<6)pool=GEN.infant.concat(FAMEV.infant,FAMEV.infant,TMEV_KID);
  else if(a<13)pool=pool.concat(GEN.child,GEN.child,FAMEV.child,FAMEV.child,TMEV_KID);
  else if(a<60)pool=pool.concat(FAMEV.adult,FAMEV.adult,TMEV);
  else pool=pool.concat(GEN.elder,GEN.elder,FAMEV.elder,FAMEV.adult,TMEV);
  return pool.concat(evAutoPool());
}
function causeOf(h){
  if(S.age>=MAXAGE)return '老衰';
  const base=h.old*h.mb+h.kid,ill=S.ongoing?h.old*h.mb*(h.mi-1)+h.kid*(h.mi-1)*0.4:0;
  const r=rand()*(h.acc+base+ill);
  if(r<h.acc)return '事故';
  if(r<h.acc+ill)return S.ongoing.name==='風邪'?'風邪をこじらせて':'重い病';
  return S.age<6?'幼くして病':S.age>=65?'老衰':'体力の衰え・病';
}
function die(h){
  S.dead=true;S.deathAge=S.age;S.cause=causeOf(h);S.decision=null;
  addLog('k',`${S.age}歳で亡くなった。（死因：${S.cause}）`,true);
  lastBubble='…';
}
