// 08-state-life-areas.js — 状態システム 段階3・7・6・5：活動・作品・行事、病状・療養、世帯・関係、住居・移動
/* ---------- 段階3：活動・作品・行事 ---------- */
const stAct=k=>S.wk.acts.find(a=>a.k===k)||null;
function stActEnsure(k,pre){
  let a=stAct(k);
  if(!a){a={id:'A'+(++S.wk.actN),k,st:'休止',tm:1,mo:0,since:S.mo,len:null};S.wk.acts.push(a);if(pre)stPob(`活動「${k}」（イベントの前提として仮に用意）`)}
  return a;
}
function stObjEnsure(ob){
  const w=S.wk;
  if(ob==='作品'){if(!w.works.length){w.works.push({id:'W'+(++w.wkN),nm:'手がけた作品',st:'制作中'});stPob('作品（イベントの前提として仮に用意）')}return w.works[w.works.length-1]}
  if(ob==='行事'){if(!w.events.length){w.events.push({id:'V1',nm:'地域の行事',mo:S.mo+3});stPob('行事（イベントの前提として仮に用意）')}return w.events[0]}
  if(ob==='職種'){if(!w.cand){w.cand={nm:'別の生業'};stPob('応募先の職種（イベントの前提として仮に用意）')}return w.cand}
  if(ob==='趣味'){return stActEnsure('趣味',true)}
  return null;
}
function stActOp(c){
  const w=S.wk;
  if(c.ob)stObjEnsure(c.ob);
  if(c.op==='once'){const a=stActEnsure(c.k);a.mo++;a.last=S.mo}
  else if(c.op==='half'){w.half=S.mo}
  else if(c.op==='start'){const a=stActEnsure(c.k);a.st='継続';a.tm=c.tm||1;a.len=c.len||null;a.since=S.mo}
  else if(c.op==='stop'){const a=stAct(c.k);if(a){a.st='休止'}}
  else stBad(`活動「${c.k}」`,c.op,'不明な活動の操作');
}
function stActsMonth(){
  const w=S.wk;
  const wl=S.hl.work;
  if(S.age>=13&&S.policy==='仕事'&&wl!=='休止')w.worked++;                              // 仕事の実施月数（仮の根拠：生活方針が「仕事」の月）
  w.acts.forEach(a=>{
    if(a.st!=='継続')return;
    if(a.k==='仕事'&&wl==='休止')return;                                   // 休止：仕事の進捗は0
    const need=((w.half===S.mo||wl==='軽作業')&&a.k==='仕事')?a.tm/2:(a.tm||1);   // 軽作業：通常の半分
    if(frLeft()<need)return;                                              // 時間が足りない月は進まない（持越し無し）
    frTake(need);a.mo++;a.last=S.mo;
    if(a.len&&a.mo>=a.len){a.st='一区切り';if(a.k==='修業')w.train='一区切り';addLog('n',`${a.k}は、ひとまず一区切りとなった。`,true)}
    else if(a.mo===3)addLog('n',`${a.k}を続けて三か月になった。`,false);
  });
}

/* ---------- 段階7：病状・療養・介助 ---------- */
const ST_HK=['軽い不調','作業中のけが','長引く不調'], ST_HS=['発症中','療養中','軽快','回復','経過不明'], ST_WL=['通常','軽作業','休止'];
const ST_HNEED2={'軽い不調':2,'作業中のけが':6,'長引く不調':12};            // 必要回復経過（月）×2：1か月・3か月・6か月（仮）
const stHOpen=c=>c.pid==='ME'&&(c.st==='発症中'||c.st==='療養中'||c.st==='軽快');
const stHlOpen=()=>S.hl.conds.filter(stHOpen);
function stHlTarget(){const o=stHlOpen();return o.sort((a,b)=>ST_HK.indexOf(b.kind)-ST_HK.indexOf(a.kind))[0]||null}
function stHlGate(e){
  if(!S||!S.hl)return false;
  const o=stHlOpen().length>0;
  if(e.id==='E08-01'||e.id==='E08-03')return o;                           // すでに不調・けががある間は、新しく作らない
  if(e.id==='E08-07'||e.id==='E08-08'||e.id==='E08-09')return !o;          // 病状が無い時は候補から外す
  return false;
}
function stHlNew(s,kind,src){
  const c={id:'C'+(++s.hl.cn),pid:'ME',kind,st:'発症中',mo0:s.mo,need2:ST_HNEED2[kind],p2:0,src,end:null,watch:0};
  s.hl.conds.push(c);return c;
}
/* 既存の病気（風邪・重い病）を、対応する病状として記録する。新しく病気を抽選しない。死亡判定は既存のものだけを使う */
function stHlMirror(s){
  const has=s.hl.conds.some(c=>c.src==='on'&&(c.st==='発症中'||c.st==='療養中'||c.st==='軽快'));
  if(s.ongoing&&!has)stHlNew(s,s.ongoing.name==='重い病'?'長引く不調':'軽い不調','on');
  if(!s.ongoing)s.hl.conds.forEach(c=>{if(c.src==='on'&&(c.st==='発症中'||c.st==='療養中'||c.st==='軽快')){c.st='回復';c.end=s.mo}});
}
function stHlSync(){stHlMirror(S)}
function stHlOp(c,ctx){
  const h=S.hl,key=`${ctx.ev}|${c.m}`;
  if(c.k==='new'){
    if(stHlOpen().length){stHold(ctx.ev,c.m,'健康','すでに不調やけががあるため、新しい病状は作らなかった');return}
    stHlNew(S,c.kind,'ev');
    applyFx([c.d,0,0,0],null,'rec',1);                                   // 既存の体力変化は、病状の作成と同じ処理で一度だけ
    return;
  }
  if(c.k==='care'){
    if(h.care){addLog('n','すでに家族の世話を続けている。',true);return}
    const n=npcById(ctx.pid);if(!n){stHold(ctx.ev,c.m,'健康','介助する対象の家族がいないため、適用しなかった');return}
    h.care={tid:n.id,n:c.n||1,from:S.mo,end:S.mo+6,ask:0,ext:0};
    addLog('n',`${n.name}の世話を、続けていくことにした。`,true);
    return;
  }
  const t=stHlTarget();
  if(!t){stHold(ctx.ev,c.m,'健康','対象となる病状が見つからないため、適用しなかった');return}
  if(c.k==='rest'){if(t.st==='発症中')t.st='療養中';h.work='休止';addLog('n','しばらく仕事を休み、体を休めることにした。',true)}
  else if(c.k==='watch')t.watch=S.mo;
  else if(c.k==='rec'){
    if(t.src==='ev'){t.p2+=2;stHlStage(t)}
    else if(t.st==='発症中'||t.st==='療養中')t.st='軽快';                 // 既存の病気は、終わりを既存の処理が決める
    applyFx([c.d,0,0,0],null,'rec',1);                                   // 既存の体力回復は一度だけ
  }
  else stBad(key,c.k,'不明な健康の操作');
}
function stHlStage(c){
  if(c.src!=='ev')return;
  if(c.p2>=c.need2){c.st='回復';c.end=S.mo;addLog('n',c.kind==='作業中のけが'?'けがは、ほぼ癒えた。':'不調は、すっかり収まった。',true)}
  else if(c.p2>=c.need2/2&&(c.st==='発症中'||c.st==='療養中'))c.st='軽快';
}
function stHlMonth(){
  const h=S.hl;
  let sup=0;
  if(h.helper){const n=npcById(h.helper.id);if(!n||n.dead||S.mo-h.helper.mo>12){h.helper=null}else sup=1}   // 支援者の記録は、亡くなるか12か月で終える（仮）
  h.conds.forEach(c=>{
    if(c.src!=='ev'||!stHOpen(c))return;
    let r=c.kind==='軽い不調'?2:(h.work!=='通常'?2:1);                    // 経過×2：1か月に1、または0.5（軽作業・休止なら1）
    if(sup&&c.kind!=='軽い不調')r=Math.min(2,r+sup);                      // 支援者あり：＋0.5、月の合計は1まで
    c.p2+=r;stHlStage(c);
  });
  if(!stHlOpen().length){
    if(h.work!=='通常'){h.work='通常';addLog('n','仕事の量は、元に戻した。',true)}
  }
  const k=h.care;
  if(k){
    const n=npcById(k.tid);
    if(!n||n.dead){addLog('n','世話をしていた家族が亡くなり、介助はなくなった。',true);h.care=null}
    else{
      const u=Math.min(k.n,Math.max(0,frLeft()));frTake(u);                // 毎月、小さな自由時間を予約する
      if(S.mo>=k.end&&k.ask&&!S.ths.some(x=>x.ev==='CARE'&&(ST_OPEN.includes(x.st)||x.queued)))k.ask=0;
      if(S.mo>=k.end&&!k.ask){
        k.ask=1;
        stNewTh({t:'th',sk:'conf',ck:'介助',m:'介助の延長',ttl:'家族の世話を続けるか',w:0,du:3,jd:'c',ef:[['carex']],ok:'世話を、もう少し続けることにした。',ng:'世話は、ここで区切りにした。',ex:'返事をしないまま、期限が過ぎた。'},
          {ev:'CARE',seq:0,j:0,k:'c'+k.from+'_'+k.ext,title:'介助',pid:k.tid});
      }
    }
  }
}
function stCareEnd(){
  const k=S.hl.care;if(!k)return;
  const n=npcById(k.tid);
  addLog('n',`${n?n.name:'家族'}の世話は、ここで区切りとなった。`,true);
  S.hl.care=null;
}

/* ---------- 段階6：世帯・関係 ---------- */
const ST_LOVE=['未設定','交際中','交際終了'], ST_MAR=['不明','未成立','協議中','成立','解消'], ST_WILL=['未確認','希望','保留','辞退','承諾'],
      ST_ADJ=['無し','修復協議中','修復合意','別離調整中'], ST_CHORE=['既存方式','相談中','相談済み'];
function stRel(id){
  if(!id||!npcById(id))return null;
  const P=S.hd.ppl;
  if(!P[id])P[id]={love:'未設定',mar:'未成立',wp:'未確認',op:'未確認',adj:'無し'};
  return P[id];
}
/* 件が進行中・成立・不成立になった時の、世帯・関係の値の更新（一度だけ） */
function stHdApply(th,w){
  const h=th.hd;if(!h)return;
  if(w!=='go'){if(th.hdEnd)return;th.hdEnd=1}
  const m=h[w];if(!m)return;
  const tg=h.s==='rel'?stRel(th.tid||th.pid):S.hd;
  if(tg)Object.assign(tg,m);
}

/* ---------- 段階5：住居・移動 ---------- */
function stFacEnsure(){
  const q=S.hs;
  if(!q.fac.length){q.fac.push({id:'F1',nm:'共用の施設',pr:0,part:0});stPob('共用施設（イベントの前提として仮に用意）')}
  return q.fac[0];
}
function stRepairOp(c,ctx){
  const lv=S.hs.dmg;
  const noth=why=>{addLog('n',why,true);if(ctx.sp)stNewTh({t:'th',sk:'note',ck:'後日談',ttl:ctx.title,w:0,jd:'c',ok:'',m:'後日談'},ctx)};   // 件を作らない時も、後日談は失わない
  if(lv<=0){noth('いまの住まいには、直すほどの傷みはない。');return}
  if(S.ths.some(t=>t.ck==='修繕'&&(ST_OPEN.includes(t.st)||t.queued))){noth('住まいの修繕は、すでに進めている。');return}
  const r=ST_RP[lv];
  stNewTh({t:'th',sk:'work',ck:'修繕',m:c.m,ttl:lv>=3?'住まいの再建':'住まいの修繕',w:0,du:r.len+6,jd:'c',len:r.len,tm:r.t,
    co:{a:'fund',n:stV(r.f)},cox:[{a:'goods',n:stV(r.g)}],ef:[['pay'],['dmg-']],
    ok:lv>=3?'再建の作業が済み、住まいの傷みが一段階よくなった。':'修繕が済み、住まいの傷みが一段階よくなった。',
    ex:'材料や時間が整わないまま、修繕は進まずに期限が過ぎた。'},ctx);
}
function stCompOp(ctx){
  const q=S.hs;
  if(q.comp){addLog('n','すでに旅の同行者がいる。',true);return}
  const pn=npcById(ctx.pid);
  q.comp={tid:pn?pn.id:null,nm:pn?pn.name:'旅の連れ',from:S.mo,end:S.mo+3,ask:0,ext:0};
  if(!pn)stPob('旅の同行者（イベントの前提として仮に用意）');
  addLog('n',`${q.comp.nm}と、しばらく同行することになった。`,true);
}
function stCompEnd(){
  const k=S.hs.comp;if(!k)return;
  addLog('n',`${k.nm}との同行は、ここで区切りとなった。`,true);
  S.hs.comp=null;
}
function stHsMonth(){
  const q=S.hs;
  if(q.stayEnd&&S.mo>=q.stayEnd){q.stay=q.home;q.stayEnd=0;addLog('n','元の住まいへ戻った。',true)}   // 退避は滞在先だけ。主な住まいは失っていない
  const k=q.comp;if(!k)return;
  if(k.tid){const n=npcById(k.tid);if(!n||n.dead){addLog('n','同行していた人が亡くなり、旅は一人になった。',true);q.comp=null;return}}
  if(frLeft()>=1)frTake(1);                                              // 同行は自由時間1
  if(S.mo>=k.end&&k.ask&&!S.ths.some(t=>t.ev==='COMP'&&(ST_OPEN.includes(t.st)||t.queued)))k.ask=0;   // 確認の件が失われていたら、もう一度尋ねる
  if(S.mo>=k.end&&!k.ask){
    k.ask=1;
    stNewTh({t:'th',sk:'conf',ck:'同行',m:'同行の延長',ttl:'同行を続けるか',w:0,du:3,jd:'c',ef:[['cpx']],ok:'同行を、もう少し続けることにした。',ng:'同行は、ここで区切りにした。',ex:'返事をしないまま、期限が過ぎた。'},
      {ev:'COMP',seq:0,j:0,k:'c'+k.from+'_'+k.ext,title:'同行',pid:k.tid});
  }
}

