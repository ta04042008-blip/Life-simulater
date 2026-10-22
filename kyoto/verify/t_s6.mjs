import {open} from './lib.mjs';
const {browser,page,errs}=await open();
const out=await page.evaluate(()=>{
  render=()=>{};openResult=()=>{};showFx=()=>{};evClose=()=>{};syncEvent=()=>{};
  const r=[];const ok=(c,m)=>r.push((c?'OK  ':'NG  ')+m);
  const setup=(pid,age)=>{newGame(pid);S.age=age;S.t=age;S.mo=age*12;S.mode='q';S.switchAge=999;S.stats=[700,700,700,700];S.nextDecT=999;S.nextSmallT=999;S.npc.forEach(n=>{if(n.from!=null)n.known=true;n.aff=Math.max(n.aff,50)});stIds();S.hh.rv={fund:0,food:0,goods:0}};
  const addN=(rel,name)=>{S.npc.push({name,rel,aff:60,from:null,known:true,off:0,skill:300,skillName:'x',dead:false,deadAge:null,hist:[],extra:{},fromText:null,...mkPerson(PERSONAS[S.pid],S.age)});stIds();return S.npc[S.npc.length-1]};
  const pick=(id,j,pi)=>{const e=EV_BY_ID[id];const d=evBuild(e,pi);S.decision=JSON.parse(JSON.stringify(d));choose(j);return d};
  const mo=(n)=>{for(let i=0;i<n;i++){S.nextDecT=999;S.nextSmallT=999;stMonths(1)}};
  const ths=(s)=>S.ths.filter(t=>t.ttl&&t.ttl.includes(s));
  const th=(s)=>ths(s)[0];
  // (a) 同居の初期状態
  setup('common',30);
  ok(S.npc.filter(n=>n.rel==='家族').every(n=>n.co===true),'(a) 生まれの家族は同居 '+S.npc.filter(n=>n.rel==='家族').map(n=>n.co));
  const lv=addN('想い人','想い人（仮）');
  ok(!lv.co,'(a) 後から出会った人は同居ではない');
  // (b) 同居人が要るイベントの相手は同居の家族だけ
  ok(EV_BY_ID['E01-05'].gr==='cofam','(b) E01-05は同居人が相手');
  S.npc.forEach(n=>{if(n.rel==='家族')n.co=false});
  ok(!evCan(EV_BY_ID['E01-05'])&&!evCan(EV_BY_ID['E13-08']),'(b) 同居人がいなければ出ない');
  S.npc.forEach(n=>{if(n.rel==='家族')n.co=true});
  ok(evCan(EV_BY_ID['E01-05']),'(b) 同居人がいれば出る');
  // (c) 家事分担：相談中→合意で相談済み／断られれば既存方式
  setup('common',30);
  const fam=S.npc.findIndex(n=>n.rel==='家族'&&n.co);
  pick('E01-05',1,fam);
  ok(S.hd.chore==='相談中','(c) 相談中 '+S.hd.chore);
  let t=th('家事の分担についての相談');t.res='ok';mo(2);
  ok(S.hd.chore==='相談済み'&&t.st==='完了','(c) 合意で相談済み '+S.hd.chore+' '+t.st);
  setup('common',30);pick('E01-05',1,S.npc.findIndex(n=>n.rel==='家族'&&n.co));t=th('家事の分担についての相談');t.res='ng';mo(2);
  ok(S.hd.chore==='既存方式','(c2) 断られれば既存方式 '+S.hd.chore);
  setup('common',30);pick('E01-05',1,S.npc.findIndex(n=>n.rel==='家族'&&n.co));mo(8);
  ok(S.hd.chore!=='相談中'||ths('家事の分担').some(x=>['相談中'].includes(S.hd.chore)&&['相手返答待ち'].includes(x.st)),'(c3) 期限切れで相談中のまま残らない '+S.hd.chore);
  // (d) 同居：承諾→住居条件→本人確認で同居開始
  setup('common',30);let p=addN('想い人','想い人（仮）');let pi=S.npc.indexOf(p);
  pick('E04-07',0,pi);ok(!p.co,'(d) 申し出だけでは同居しない');
  t=th('共同生活の相談');t.res='ok';mo(2);
  let c=th('と同じ家で暮らし始める');ok(c&&c.st==='本人確認待ち'&&!p.co,'(d) 承諾後も本人確認待ち '+(c&&c.st));
  S.hs.dmg=3;let why=stConfirm(c.id,true);ok(!!why&&!p.co,'(d) 住まいが使用困難なら始められない '+why);
  S.hs.dmg=0;why=stConfirm(c.id,true);ok(!why&&p.co===true,'(d) 確認後に同居 '+why);
  ok(p.rel==='想い人'&&!S.hd.ppl[p.id]||S.hd.ppl[p.id].mar==='未成立','(d) 同居しても婚姻しない');
  // (e) 婚姻：協議と意思確認まで。成立しない
  setup('common',30);p=addN('想い人','想い人（仮）');pi=S.npc.indexOf(p);S.npc[pi].aff=95;
  pick('E04-08',0,pi);let rl=S.hd.ppl[p.id];
  ok(rl.mar==='協議中'&&rl.wp==='希望','(e) 協議中・本人の意思=希望 '+JSON.stringify(rl));
  t=th('結婚についての話し合い');t.res='ok';mo(3);rl=S.hd.ppl[p.id];
  ok(rl.op==='承諾'&&rl.mar==='協議中'&&rl.inst==='制度条件未確認','(e) 相手承諾でも成立しない '+JSON.stringify(rl));
  ok(S.hold.some(h=>h.m==='婚姻の成立'),'(e) 成立は保留として記録');
  setup('common',30);p=addN('想い人','想い人（仮）');pi=S.npc.indexOf(p);pick('E04-08',0,pi);t=th('結婚についての話し合い');t.res='ng';mo(3);
  rl=S.hd.ppl[p.id];ok(rl.mar==='未成立'&&rl.op==='辞退','(e2) 断られれば未成立・辞退 '+JSON.stringify(rl));
  // (f) 回答保留：再回答まで成立処理なし
  setup('common',30);p=addN('想い人','想い人（仮）');pi=S.npc.indexOf(p);pick('E04-08',1,pi);
  rl=S.hd.ppl[p.id];ok(rl.wp==='保留'&&rl.mar==='未成立','(f) 保留 '+JSON.stringify(rl));
  mo(8);ok(S.hd.ppl[p.id].wp==='保留'&&S.hd.ppl[p.id].mar==='未成立','(f) 放置しても保留のまま');
  c=th('結婚の返事を決める');ok(c&&c.st==='本人確認待ち','(f) 返事待ち '+(c&&c.st));
  stConfirm(c.id,true);ok(S.hd.ppl[p.id].wp==='希望'&&!!th('結婚についての話し合い'),'(f) 再回答で協議が始まる');
  // (g) 修復／別離
  setup('common',30);p=addN('想い人','想い人（仮）');pi=S.npc.indexOf(p);pick('E04-10',0,pi);
  ok(S.hd.ppl[p.id].adj==='修復協議中','(g) 修復協議中');
  t=th('関係を直す話し合い');t.res='ok';mo(2);ok(S.hd.ppl[p.id].adj==='修復合意','(g) 修復合意');
  setup('common',30);p=addN('想い人','想い人（仮）');p.co=true;pi=S.npc.indexOf(p);pick('E04-10',1,pi);
  ok(S.hd.ppl[p.id].love==='交際終了'&&S.hd.ppl[p.id].adj==='別離調整中','(g2) 別離の意思は先に記録（抽選なし）');
  t=th('別れ方の話し合い');t.res='ng';mo(2);
  ok(S.hd.ppl[p.id].love==='交際終了'&&p.co===true,'(g2) 合意なしでも意思は撤回されず、同居はそのまま '+JSON.stringify(S.hd.ppl[p.id]));
  setup('common',30);p=addN('想い人','想い人（仮）');p.co=true;pi=S.npc.indexOf(p);pick('E04-10',1,pi);t=th('別れ方の話し合い');t.res='ok';mo(2);
  ok(p.co===false&&S.hd.ppl[p.id].adj==='無し','(g3) 合意で同居を解消');
  // (h) 養育：承諾→本人確認→養育関係。実の子にはならない
  setup('common',30);pick('E02-05',0);
  const kid=S.npc[S.npc.length-1];
  t=th('身寄りのない子の養育の申し出');ok(!!t&&S.hd.care.length===0,'(h) 申し出だけでは養育者にならない');
  t.res='ok';mo(2);c=th('を迎え入れて養育する');ok(c&&c.st==='本人確認待ち','(h) 承諾後は本人確認待ち '+(c&&c.st));
  stConfirm(c.id,true);ok(S.hd.care.length===1&&kid.rel==='子ども'&&!kid.co,'(h) 養育関係だけ記録 '+JSON.stringify(S.hd.care)+' '+kid.rel);
  setup('common',30);pick('E02-05',1);mo(2);ok(S.hd.care.length===0,'(h2) 別の養育先探索では養育者にならない');
  // (i) 別居：準備→本人確認→居住世帯だけ分ける
  setup('common',30);const fi=S.npc.findIndex(n=>n.rel==='家族'&&n.co);const f=S.npc[fi];
  pick('E13-08',0,fi);const tp=th('家族と別に暮らす準備');const f2=npcById(tp.tid);ok(f2.co===true,'(i) 準備だけでは別居しない');
  mo(3);c=th('と別に暮らし始める');ok(c&&c.st==='本人確認待ち'&&f2.co===true,'(i) 本人確認待ち '+(c&&c.st));
  stConfirm(c.id,true);ok(f2.co===false&&f2.rel==='家族'&&S.hd.sep.length===1,'(i) 別居・家族のまま '+f.co+f.rel+JSON.stringify(S.hd.sep)+(c&&c.st)+(c&&c.tid)+' '+fi+' '+f.id);
  setup('common',30);pick('E13-08',1,S.npc.findIndex(n=>n.rel==='家族'&&n.co));mo(2);
  ok(S.npc.filter(n=>n.rel==='家族').every(n=>n.co),'(i2) 同居維持探索では別居しない');
  // (j) 食料の分け前：同居なら移転だけ、別居なら世帯の食料が減る
  setup('common',30);S.hh.food=stV(20);const f1=S.npc.findIndex(n=>n.rel==='家族'&&n.co);
  let d=stBuild(EV_BY_ID['E01-02'],0,f1);ok(d[0].fam===1,'(j) 同居には世帯の食料を減らさない');
  S.npc[f1].co=false;d=stBuild(EV_BY_ID['E01-02'],0,f1);ok(!d[0].fam,'(j) 別居なら食料が減る');
  // (k) 受入れ
  setup('common',30);pick('E11-10',0);t=th('外から来る世帯の受入れ支援');t.res='ok';mo(4);
  ok(S.hd.guests.length===1&&!S.npc.some(n=>String(n.name).includes('迎えた世帯')),'(k) 受入れ世帯を記録・家族枠に入れない');
  setup('common',30);pick('E11-10',1);ok(S.hd.guests.length===0,'(k2) 調査だけでは成立しない');
  // (l) 保存・再読込
  setup('common',30);p=addN('想い人','想い人（仮）');pi=S.npc.indexOf(p);pick('E04-08',0,pi);mo(1);
  const sv=JSON.stringify(S);S=JSON.parse(sv);stNew(S);ok(S.hd.ppl[p.id]&&S.hd.ppl[p.id].mar==='協議中','(l) 再読込しても関係が残る');
  const o=JSON.parse(JSON.stringify(S));delete o.hd;o.npc.forEach(n=>delete n.co);S=o;stNew(S);
  ok(S.hd&&S.npc.filter(n=>n.rel==='家族'&&n.from===0).every(n=>n.co),'(l2) 旧セーブの家族は同居として補う');
  // (m) 出さないイベント
  const bl=EV.filter(stBlocked).map(e=>e.id);ok(bl.length===0,'(m) 出さないイベントは0件 '+bl.join(','));
  stAudit();ok(!S.bad.length,'(n) 検査に異常なし '+JSON.stringify(S.bad));
  return r.join('\n');
});
console.log(out);console.log('errs',errs);await browser.close();
