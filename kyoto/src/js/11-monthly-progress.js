// 11-monthly-progress.js — 月の進行（外側は四半期・年、内部は月順）とイベントの出し分け
/* ---------- 月の進行（外側は四半期・年のまま、内部だけ月順に進める） ---------- */
function stMonths(nm){
  for(let i=0;i<nm&&!S.dead;i++){
    S.mo++;
    S.free.use=0;S.free.resv=0;                                           // ① 月の始め：自由時間は月ごとに更新、持越し無し
    stIncomeMonth();                                                      // ② 固定収支・食料消費
    stActsMonth();                                                        // ③ 本人の活動（予約した時間の実施）
    stHsMonth();
    stHlMonth();                                                          // ④ 病状の経過・介助                                                          // ③' 退避の終わり・同行
    stLoansMonth();
    stThreads();                                                          // ⑤⑥ 相手の返答・完了条件・後日談の通知・期限
    S.moDone=S.mo;
  }
  stAudit();
}
function stAudit(){
  const ids=new Set();
  S.ths.forEach(t=>{
    if(ids.has(t.id))stBad(`件${t.id}`,t.id,'件のIDが重複している',t);ids.add(t.id);
    if(!ST_STAGE.includes(t.st))stBad(`件「${t.ttl}」`,t.st,'不明な段階',t);
    if(t.due!=null&&t.due<t.mo0)stBad(`件「${t.ttl}」`,t.due,'期限が開始より前になっている',t);
    if(!evStr(t.ttl))stBad(`件${t.id}`,'','題名がない',t);
  });
  const ii=new Set();S.inf.forEach(x=>{if(ii.has(x.id))stBad(`情報${x.id}`,x.id,'情報のIDが重複している');ii.add(x.id)});
  const h=S.hh;
  ['fund','food','goods','home','cstock','invest','unpaid'].forEach(k=>{if(!Number.isFinite(h[k])||h[k]<0)stBad(`世帯の${k}`,h[k],'在庫が負または数でない')});
  ['fund','food','goods'].forEach(k=>{if(!Number.isFinite(h.rv[k])||h.rv[k]<0||h.rv[k]>h[k]+1)stBad(`世帯の予約(${k})`,h.rv[k],'予約が範囲外')});
  if(!(S.free.use>=0&&S.free.resv>=0&&S.free.use+S.free.resv<=ST_FREE+0.001))stBad('自由時間',S.free.use,'使用量が範囲外');
  if(!ST_FORMS.includes(S.wk.form))stBad('就業の形',S.wk.form,'不明な就業の形');
  const ai=new Set();S.wk.acts.forEach(a=>{if(ai.has(a.k))stBad(`活動${a.k}`,a.k,'活動が重複している');ai.add(a.k)});
  {const h=S.hl,ci=new Set();
    if(!ST_WL.includes(h.work))stBad('仕事量',h.work,'不明な仕事量');
    h.conds.forEach(c=>{
      if(ci.has(c.id))stBad(`病状${c.id}`,c.id,'病状のIDが重複している');ci.add(c.id);
      if(!ST_HK.includes(c.kind)||!ST_HS.includes(c.st))stBad(`病状${c.id}`,c.kind+'/'+c.st,'不明な病状の区分・経過');
      if(c.pid!=='ME'&&!npcById(c.pid))stBad(`病状${c.id}`,c.pid,'存在しない人物を参照している');
      if(!(c.p2>=0)||!Number.isFinite(c.p2))stBad(`病状${c.id}`,c.p2,'回復経過が範囲外');
    });
    if(stHlOpen().length>3)stBad('病状',stHlOpen().length,'同時に開いている病状が多すぎる');
    if(h.helper&&!npcById(h.helper.id)&&!S.npc.some(n=>n.id===h.helper.id))stBad('支援者',h.helper.id,'存在しない人物を参照している');
    if(h.care&&!npcById(h.care.tid))stBad('介助',h.care.tid,'存在しない人物を参照している')}
  {const h=S.hd;
    if(!ST_CHORE.includes(h.chore))stBad('家事の分担',h.chore,'不明な分担の状態');
    Object.keys(h.ppl).forEach(id=>{const r=h.ppl[id];
      if(!npcById(id))stBad(`関係(${id})`,id,'存在しない人物を参照している');
      if(!ST_LOVE.includes(r.love)||!ST_MAR.includes(r.mar)||!ST_WILL.includes(r.wp)||!ST_WILL.includes(r.op)||!ST_ADJ.includes(r.adj))stBad(`関係(${id})`,JSON.stringify(r),'不明な関係の状態');
      if(r.mar==='成立')stBad(`関係(${id})`,r.mar,'婚姻が成立している（成立は保留のはず）')})}
  {const q=S.hs;
    if(!Number.isInteger(q.dmg)||q.dmg<0||q.dmg>3)stBad('住宅の傷み',q.dmg,'傷みが0〜3の範囲外');
    if(!Number.isInteger(q.prep)||q.prep<0||q.prep>10)stBad('備え',q.prep,'備えが0〜10の範囲外');
    if(q.comp&&!Number.isFinite(q.comp.end))stBad('同行',q.comp.end,'同行の終了月が不正');
    S.ths.forEach(x=>{if(x.sk==='work'&&ST_OPEN.includes(x.st)&&(!(x.prog>=0)||x.prog>x.len))stBad(`件「${x.ttl}」`,x.prog,'作業の進みが範囲外',x)})}
  S.hh.loans.forEach(l=>{if(!(l.left>=0))stBad(`貸借${l.id}`,l.left,'未返済額が負')});
}

/* ---------- イベントの出し分け ---------- */
function stBlocked(e){
  if(!ST_EXCL)return false;
  const n=ST_NEED[e.id];
  return !!(n&&n.some(x=>!ST_READY[x]));
}

