import {open} from './lib.mjs';
const {browser,page,errs}=await open();
const out=await page.evaluate(()=>{
  render=()=>{};openResult=()=>{};showFx=()=>{};evClose=()=>{};syncEvent=()=>{};
  const r=[];const ok=(c,m)=>r.push((c?'OK  ':'NG  ')+m);
  const setup=(pid,age)=>{newGame(pid);S.age=age;S.t=age;S.mo=age*12;S.mode='q';S.switchAge=999;S.stats=[700,700,700,700];S.nextDecT=999;S.nextSmallT=999;S.ongoing=null;S.npc.forEach(n=>{if(n.from!=null)n.known=true;n.aff=Math.max(n.aff,50)});stIds();S.hh.rv={fund:0,food:0,goods:0}};
  const pick=(id,j,pi)=>{const e=EV_BY_ID[id];const d=evBuild(e,pi);S.decision=JSON.parse(JSON.stringify(d));choose(j);return d};
  const mo=(n)=>{for(let i=0;i<n;i++){S.nextDecT=999;S.nextSmallT=999;stMonths(1)}};
  const th=(s)=>S.ths.find(t=>t.ttl&&t.ttl.includes(s));
  const open1=()=>stHlOpen();
  // (a) E08-01：軽い不調を作り、体力は一度だけ-1。1か月で回復
  setup('common',30);S.stats[0]=700;
  evFireAuto({evid:'E08-01'});
  ok(open1().length===1&&open1()[0].kind==='軽い不調','(a) 軽い不調ができた');
  ok(Math.round(S.stats[0])===699,'(a) 体力は-1だけ '+S.stats[0]);
  mo(1);ok(open1().length===0&&S.hl.conds[0].st==='回復','(a) 1か月で回復 '+S.hl.conds[0].st);
  ok(Math.round(S.stats[0])===699,'(a) 月次処理で体力は引かれない '+S.stats[0]);
  // (b) 同時には新しく作らない（二重の体力低下なし）
  setup('common',30);evFireAuto({evid:'E08-01'});const s0=S.stats[0];
  ok(!evElig(EV_BY_ID['E08-03'])&&!evElig(EV_BY_ID['E08-01']),'(b) 不調中は新しい不調・けがの候補から外れる');
  ok(S.stats[0]===s0,'(b) 体力変化なし');
  // 保存済みの回答待ちなどで直接呼ばれても二重にしない
  const n0=S.hl.conds.length;stHlOp({t:'hl',m:'x',k:'new',kind:'作業中のけが',d:-2},{ev:'E08-03'});
  ok(S.hl.conds.length===n0&&S.stats[0]===s0,'(b2) 直接呼んでも病状も体力も増えない');
  // (c) けが：体力-2を一度だけ、3か月・通常0.5/月で回復
  setup('common',30);S.stats[0]=700;evFireAuto({evid:'E08-03'});
  ok(Math.round(S.stats[0])===698&&open1()[0].kind==='作業中のけが','(c) けが・体力-2 '+S.stats[0]);
  mo(4);ok(open1().length===1&&open1()[0].st!=='回復','(c) 4か月後はまだ（0.5/月→2/3） '+open1().map(x=>x.p2));
  mo(2);ok(open1().length===0,'(c) 6か月で回復');
  // (c2) 休止なら月1：3か月で回復
  setup('common',30);evFireAuto({evid:'E08-03'});S.hl.work='休止';mo(3);
  ok(open1().length===0,'(c2) 休止なら3か月で回復 '+S.hl.conds[0].st);
  ok(S.hl.work==='休止'?false:true,'(c2) 回復すると仕事量は通常に戻る '+S.hl.work);
  // (d) 支援者あり：+0.5（上限1）
  setup('common',30);evFireAuto({evid:'E08-03'});S.hl.helper={id:S.npc.find(n=>n.rel==='家族').id,mo:S.mo};mo(3);
  ok(S.hl.conds[0].p2===6||S.hl.conds[0].st==='回復','(d) 支援者ありで3か月 '+S.hl.conds[0].p2+S.hl.conds[0].st);
  // (e) E08-08：病状が無ければ出ない／ある時は経過+1・体力+1一度だけ
  setup('common',30);ok(!evElig(EV_BY_ID['E08-08'])&&!evElig(EV_BY_ID['E08-07'])&&!evElig(EV_BY_ID['E08-09']),'(e) 病状が無ければ候補から外れる');
  evFireAuto({evid:'E08-03'});ok(evElig(EV_BY_ID['E08-08']),'(e) 病状があれば出る');
  const st1=S.stats[0];evFireAuto({evid:'E08-08'});
  ok(Math.round(S.stats[0]-st1)===1&&S.hl.conds[0].p2===2,'(e) 経過+1・体力+1 '+(S.stats[0]-st1)+' p2='+S.hl.conds[0].p2);
  // (f) 療養：休止になり、仕事の進捗が0・実施月数が増えない
  setup('common',30);evFireAuto({evid:'E08-03'});S.policy='仕事';S.wk.acts.push({id:'A9',k:'仕事',st:'継続',tm:2,mo:0,since:S.mo,len:null});
  const w0=S.wk.worked;pick('E08-07',0);
  ok(S.hl.work==='休止'&&S.hl.conds[0].st==='療養中','(f) 療養に専念→休止・療養中');
  mo(1);ok(S.wk.acts[0].mo===0&&S.wk.worked===w0,'(f) 仕事の進捗0・実施月数は増えない '+S.wk.acts[0].mo+' '+(S.wk.worked-w0));
  // (g) 軽作業：合意後に適用。進捗は半分
  setup('common',30);evFireAuto({evid:'E08-03'});S.policy='仕事';S.wk.acts.push({id:'A9',k:'仕事',st:'継続',tm:2,mo:0,since:S.mo,len:null});
  pick('E08-07',1);ok(S.hl.work==='通常','(g) 合意前は通常');
  let t=th('仕事の量を軽くする相談');t.res='ok';mo(1);
  ok(S.hl.work==='軽作業','(g) 合意後に軽作業 '+S.hl.work);
  const before=S.free.use;mo(1);ok(S.free.use===1,'(g) 仕事の時間は半分（2→1） '+S.free.use);
  setup('common',30);evFireAuto({evid:'E08-03'});pick('E08-07',1);t=th('仕事の量を軽くする相談');t.res='ng';mo(2);
  ok(S.hl.work==='通常','(g2) 断られれば通常のまま');
  // (h) 支援依頼：承諾後に支援者を記録
  setup('common',30);pick('E08-02',0);t=th('家族に看病を頼む');ok(!S.hl.helper,'(h) 依頼だけでは支援者にならない');
  t.res='ok';mo(2);ok(S.hl.helper&&S.hl.helper.id===t.tid,'(h) 承諾後に支援者を記録');
  setup('common',30);pick('E08-02',0);t=th('家族に看病を頼む');t.res='ng';mo(2);ok(!S.hl.helper,'(h2) 断られれば記録しない');
  // (i) 治療相談：治癒にしない、保留として記録
  setup('common',30);evFireAuto({evid:'E08-03'});pick('E08-09',0);mo(2);
  ok(open1().length===1&&S.hold.some(h=>h.ev==='E08-09'),'(i) 治療相談で治癒しない・保留記録');
  pick('E08-09',1);ok(open1()[0].watch>0,'(i2) 観察予定を記録');
  // (j) 介助：毎月自由時間を予約・6か月で延長確認・対象死亡で終了
  setup('common',30);const fi=S.npc.findIndex(n=>n.rel==='家族');pick('E08-10',0,fi);
  ok(!!S.hl.care,'(j) 介助が始まる');const cn=S.hl.care.n;
  mo(1);ok(S.free.use>=cn,'(j) 毎月の自由時間を使う '+S.free.use+'/'+cn);
  mo(6);let c=S.ths.find(x=>x.ev==='CARE'&&x.st==='本人確認待ち');ok(!!c,'(j) 6か月で延長の確認 '+(c&&c.st));
  if(c){stConfirm(c.id,true);ok(S.hl.care&&S.hl.care.ext===1,'(j) 延長');mo(6);c=S.ths.find(x=>x.ev==='CARE'&&x.st==='本人確認待ち');if(c){stConfirm(c.id,false);ok(!S.hl.care,'(j) 見送ると終了')}}
  setup('common',30);pick('E08-10',0,S.npc.findIndex(n=>n.rel==='家族'));npcById(S.hl.care.tid).dead=true;mo(1);ok(!S.hl.care,'(j2) 対象が亡くなれば終了');
  setup('common',30);pick('E08-10',1);mo(1);ok(!S.hl.care,'(j3) 支援者探索は介助の開始にならない');
  // (k) 既存の病気を病状として記録する。死亡判定は既存のまま
  setup('common',30);S.ongoing={name:'風邪',mult:HZ.illMult,left:2};stHlSync();
  ok(open1().length===1&&open1()[0].kind==='軽い不調'&&open1()[0].src==='on','(k) 風邪→軽い不調');
  S.ongoing=null;stHlSync();ok(open1().length===0,'(k) 既存の病気が終われば回復');
  setup('common',30);S.ongoing={name:'重い病',mult:HZ.sevMult,left:2};stHlSync();ok(open1()[0].kind==='長引く不調','(k2) 重い病→長引く不調');
  const hz1=annualHazard(30,700,S.ongoing).tot;S.hl.conds.push({id:'Cx',pid:'ME',kind:'作業中のけが',st:'発症中',mo0:S.mo,need2:6,p2:0,src:'ev',end:null,watch:0});
  ok(annualHazard(30,700,S.ongoing).tot===hz1,'(k3) 新しい病状は死亡の確率に影響しない');
  S.hl.conds.pop();
  // E08-08 を既存の病気に使っても、病気を勝手に終わらせない
  evFireAuto({evid:'E08-08'});ok(S.ongoing&&open1()[0].st==='軽快'&&open1()[0].src==='on','(k4) 既存の病気は軽快までで、終わりは既存が決める');
  // (l) 再読込・旧セーブ
  setup('common',30);evFireAuto({evid:'E08-03'});mo(1);const sv=JSON.stringify(S);S=JSON.parse(sv);stNew(S);
  ok(S.hl.conds.length===1,'(l) 再読込しても病状が増えない');
  const o=JSON.parse(JSON.stringify(S));delete o.hl;o.ongoing={name:'風邪',mult:1.5,left:1};S=o;stNew(S);
  ok(S.hl&&S.hl.conds.length===1&&S.hl.conds[0].src==='on','(l2) 旧セーブの病気は病状として引き継ぐ');
  // (m) 出さないイベントは0件
  ok(EV.filter(stBlocked).length===0,'(m) 状態の仕組みが足りないイベントは0件');
  stAudit();ok(!S.bad.length,'(n) 検査に異常なし '+JSON.stringify(S.bad));
  return r.join('\n');
});
console.log(out);console.log('errs',errs);await browser.close();
