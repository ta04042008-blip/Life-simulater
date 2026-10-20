import {open} from './lib.mjs';
const {browser,page,errs}=await open();
const out=await page.evaluate(()=>{
  render=()=>{};openResult=()=>{};showFx=()=>{};evClose=()=>{};syncEvent=()=>{};
  const r=[];const ok=(c,m)=>r.push((c?'OK  ':'NG  ')+m);
  const setup=(pid,age)=>{newGame(pid);S.age=age;S.t=age;S.mo=age*12;S.mode='q';S.switchAge=999;S.stats=[700,700,700,700];S.nextDecT=999;S.nextSmallT=999;S.npc.forEach(n=>{if(n.from!=null)n.known=true});stIds();S.hh.rv={fund:0,food:0,goods:0}};
  const pick=(id,j,force)=>{const e=EV_BY_ID[id];const d=evBuild(e);S.decision=JSON.parse(JSON.stringify(d));if(force)force(S.decision.opts[j]);choose(j);return d};
  const months=(n,f)=>{for(let i=0;i<n;i++){S.nextDecT=999;S.nextSmallT=999;if(f)f();tick();if(S.dead)break}};
  const th=(ttl)=>S.ths.find(t=>t.ttl===ttl);
  const paid=(ttl,a)=>S.led.filter(x=>x.why===ttl&&x.a===a).reduce((s,x)=>s+x.d,0);
  const mo=(n)=>{for(let i=0;i<n;i++){S.nextDecT=999;S.nextSmallT=999;stMonths(1)}};
  const total=()=>S.hh.fund+S.hh.food+S.hh.goods;

  // (a) 住宅の傷み：自動イベントで1ずつ増え、3で止まる
  setup('common',30);
  for(let i=0;i<5;i++)evFireAuto({evid:'E01-03'});
  ok(S.hs.dmg===3,'(a) 傷みは3で止まる '+S.hs.dmg);
  ok(!S.bad.length,'(a) 不備なし '+JSON.stringify(S.bad));
  // (b) 修繕：傷み2→費用 資金5・物資3、3か月、傷み1段階改善
  setup('common',30);S.hs.dmg=2;S.hh.fund=stV(30);S.hh.goods=stV(10);
  pick('E01-07',0);
  let t=th('住まいの修繕');ok(!!t&&t.sk==='work','(b) 修繕の件ができた '+(t&&t.st));
  ok(S.hs.dmg===2,'(b) 開始だけでは傷みは変わらない');
  mo(1);t=th('住まいの修繕');
  ok(S.hh.rv.fund===stV(5)&&S.hh.rv.goods===stV(3),'(b) 費用を予約 '+JSON.stringify(S.hh.rv));
  ok(S.hs.dmg===2&&t.st==='作業中','(b) 作業中 '+t.st+' '+t.prog+'/'+t.len);
  mo(2);t=th('住まいの修繕');
  ok(S.hs.dmg===1&&t.st==='完了','(b) 完了で1段階改善 dmg='+S.hs.dmg+' '+t.st);
  ok(paid('住まいの修繕','fund')===-stV(5)&&paid('住まいの修繕','goods')===-stV(3),'(b) 費用は完了時に一度だけ払った '+paid('住まいの修繕','fund')+' '+paid('住まいの修繕','goods'));
  ok(S.hh.rv.fund===0&&S.hh.rv.goods===0,'(b) 予約は解除');
  const snap=JSON.stringify(S.hs)+S.hh.fund+'/'+S.hh.goods;
  // (b2) 再読込しても二度払わない
  const sv=JSON.stringify(S);S=JSON.parse(sv);stNew(S);months(1);
  ok(paid('住まいの修繕','fund')===-stV(5),'(b2) 再読込後も費用は一度だけ');
  // (c) 傷みが無い時は修繕の件を作らない
  setup('common',30);S.hs.dmg=0;pick('E01-07',0);
  ok(!th('住まいの修繕')&&!th('住まいの再建'),'(c) 傷み0では件を作らない');
  // (d) 材料が足りない間は待つ（勝手に借金にしない）
  setup('common',30);S.hs.dmg=3;S.hh.fund=stV(2);S.hh.goods=0;
  pick('E01-07',0);months(2);t=th('住まいの再建');
  ok(t.st==='条件不足'&&/足りない/.test(t.why)&&S.hh.rv.fund===0,'(d) 材料不足で待機 '+t.st+' '+t.why);
  ok(S.hs.dmg===3,'(d) 材料が無いまま完了しない');
  S.hh.fund=stV(40);S.hh.goods=stV(10);months(3);
  t=th('住まいの再建');ok(t.prog>=1,'(d) 材料が揃うと作業が進む '+t.st+' '+t.prog+'/'+t.len);
  months(2);ok(S.hs.dmg===2&&t.st==='完了','(d) 再建は4か月・1段階だけ '+S.hs.dmg+' '+t.st);
  // (e) 転居探索：候補データが無いので候補調査中のまま、住まいは変わらない
  setup('common',30);pick('E01-07',1);months(1);
  t=th('転居先を探す');ok(t.st==='候補探し'&&t.why==='候補調査中','(e) 候補調査中 '+t.st+' '+t.why);
  ok(S.hs.home===S.hs.stay&&S.hs.home==='京都内・詳細不明','(e) 住まいは変わらない');
  ok(S.hold.some(h=>h.ev==='E01-07'),'(e) 保留として記録');
  months(4);ok(th('転居先を探す').st==='期限到来','(e) 期限で区切り '+th('転居先を探す').st);
  // (f) 退避：探索→受入れ→本人確認→滞在先だけ変わる→1か月で戻る
  setup('common',30);S.hh.fund=stV(30);
  pick('E12-08',0);mo(1);
  t=th('安全な退避先を探す');ok(t&&(t.st==='完了'||t.st==='候補提示'),'(f) 探索 '+(t&&t.st+t.cand));
  let a=S.ths.find(x=>x.ttl&&x.ttl.includes('に受け入れを頼む'));
  ok(!!a,'(f) 受入れ確認の件 '+(a&&a.st));
  if(a){a.res='ok';mo(1);}
  let c=S.ths.find(x=>x.ttl&&x.ttl.includes('のところへ身を寄せる'));
  ok(!!c&&c.st==='本人確認待ち','(f) 実行確認待ち '+(c&&c.st));
  ok(S.hs.stay===S.hs.home,'(f) 確認前は滞在先が変わらない');
  if(c){const f=S.hh.fund;const why=stConfirm(c.id,true);
    ok(!why&&S.hs.stay!==S.hs.home&&S.hs.home==='京都内・詳細不明','(f) 確認後に滞在先だけ変わる '+S.hs.stay+' '+why);
    ok(paid('{c}のところへ身を寄せる','fund')!==0||paid(c.ttl,'fund')===-stV(1),'(f) 資金1');
    months(1);ok(S.hs.stay===S.hs.home,'(f) 1か月後に戻る '+S.hs.stay);}
  // (g) 備え：+1〜2、上限10、物資3
  setup('common',30);S.hh.goods=stV(10);S.hs.prep=9;
  pick('E14-09',1);months(2);
  ok(S.hs.prep===10,'(g) 備えは上限10 '+S.hs.prep);
  ok(paid('住まいの災害への備え','goods')===-stV(3),'(g) 物資3 '+paid('住まいの災害への備え','goods'));
  setup('common',30);S.hh.goods=stV(10);pick('E12-08',1);months(2);
  ok(S.hs.prep>=1&&S.hs.prep<=2,'(g2) 備え+1〜2 '+S.hs.prep);
  // (h) 同行：3か月・自由時間1、延長は本人確認、見送れば終わる
  setup('common',30);pick('E13-06',0);
  ok(!!S.hs.comp,'(h) 同行が始まる '+JSON.stringify(S.hs.comp));
  const end0=S.hs.comp.end;months(1);
  ok(S.hs.comp&&S.hs.comp.end===end0,'(h) 3か月は同行中');
  months(1);c=S.ths.find(x=>x.ev==='COMP'&&x.st==='本人確認待ち');
  ok(!!c,'(h) 区切りで延長の確認 '+(c&&c.st));
  if(c){stConfirm(c.id,true);ok(S.hs.comp&&S.hs.comp.end>end0&&S.hs.comp.ext===1,'(h) 延長 '+JSON.stringify(S.hs.comp));
    months(2);c=S.ths.find(x=>x.ev==='COMP'&&x.st==='本人確認待ち');
    if(c){stConfirm(c.id,false);ok(!S.hs.comp,'(h) 見送ると同行は終わる');}else ok(false,'(h) 2回目の確認が出ない');}
  // (i) 共用施設：補修は物資を使い修理案だけ、住宅の傷みは変えない
  setup('common',30);S.hs.dmg=2;S.hh.goods=stV(10);const g0=S.hh.goods;pick('E14-02',0);
  ok(S.hs.fac.length===1&&S.hs.fac[0].pr===1&&S.hs.dmg===2&&S.hh.goods<g0,'(i) 修理案・傷み不変・物資減 '+g0+'→'+S.hh.goods);
  setup('common',30);S.hh.cstock=stV(6);const tt=total()+S.hh.cstock;pick('E14-02',1);
  ok(total()+S.hh.cstock===tt&&S.hh.cstock<stV(6),'(i2) 共同物資の配分で総量保存');
  setup('common',30);const tt2=total()+S.hh.cstock;pick('E14-02',1);
  ok(total()+S.hh.cstock===tt2,'(i3) 共同物資が無いときも総量不変');
  // (j) 復旧参加／物資支援
  setup('common',30);pick('E14-10',0);months(2);
  ok(S.hs.fac.length===1&&S.hs.fac[0].part===1,'(j) 参加を記録 '+JSON.stringify(S.hs.fac));
  setup('common',30);S.hh.goods=stV(10);const tt3=total()+S.hh.cstock;pick('E14-10',1);months(2);
  ok(S.hh.cstock>0&&S.hh.goods+S.hh.cstock===stV(10),'(j2) 物資を支援先へ移す 総量保存 '+S.hh.goods+'+'+S.hh.cstock);
  // (k) 友人訪問：資金2・主な住まいは変わらない
  setup('common',30);S.hh.fund=stV(30);pick('E03-10',0);months(3);
  t=th('遠方の友人を訪ねる');ok(t&&t.st==='完了'&&S.hs.trips===1&&paid('遠方の友人を訪ねる','fund')===-stV(2),'(k) 訪問 '+(t&&t.st)+' trips='+S.hs.trips+' 資金'+paid('遠方の友人を訪ねる','fund'));
  ok(S.hs.home==='京都内・詳細不明','(k) 主な住まいは変わらない');
  setup('common',30);pick('E03-10',1);months(1);
  ok(th('遠方の友人へ便りを送る').st==='完了'&&S.hs.trips===0,'(k2) 便りは訪問にならない');
  // (l) 旧セーブ（hsが無い）でも読める
  setup('common',30);const o=JSON.parse(JSON.stringify(S));delete o.hs;S=o;stNew(S);
  ok(S.hs&&S.hs.dmg===0&&S.hs.fac.length===0,'(l) 旧セーブにも住居の状態が補われる');
  // (m) 全イベントの出し分け：住居のイベントが出る／世帯・健康は出ない
  const blocked=EV.filter(stBlocked).map(e=>e.id);
  ok(blocked.length===0,'(m) 出さないイベントは0件 '+blocked.length);
  ok(['E01-07','E12-08','E13-06','E14-10','E01-03'].every(id=>!blocked.includes(id)),'(m) 住居のイベントは出る');
  setup('common',30);S.ths.forEach(x=>{});stAudit();ok(!S.bad.length,'(n) 検査に異常なし');
  return r.join('\n');
});
console.log(out);console.log('errs',errs);await browser.close();
