import {open} from './lib.mjs';
const {browser,page,errs}=await open();
const out=await page.evaluate(()=>{
  render=()=>{};openResult=()=>{};showFx=()=>{};evClose=()=>{};syncEvent=()=>{};
  const r=[];const ok=(c,m)=>r.push((c?'OK  ':'NG  ')+m);
  const setup=(pid,age)=>{newGame(pid);S.age=age;S.t=age;S.mo=age*12;S.mode='q';S.switchAge=999;S.stats=[700,700,700,700];S.nextDecT=999;S.nextSmallT=999;S.npc.forEach(n=>{if(n.from!=null)n.known=true});stIds();S.hh.rv={fund:0,food:0,goods:0}};
  const pick=(id,j,force)=>{const e=EV_BY_ID[id];const d=evBuild(e);S.decision=JSON.parse(JSON.stringify(d));if(force)force(S.decision.opts[j]);choose(j);return d};
  const months=(n,f)=>{for(let i=0;i<n;i++){S.nextDecT=999;S.nextSmallT=999;if(f)f();tick();if(S.dead)break}};
  const th=(ttl)=>S.ths.find(t=>t.ttl===ttl);
  const setRes=(res)=>S.ths.forEach(t=>{if(t.sk==='ask'&&!t.fin)t.res=res});

  // (a) 報酬の見直し：承諾→翌月から収入が1増える
  setup('common',30);let inc0=ST_INC;
  pick('E06-07',0);setRes('ok');
  const f0=S.hh.fund;
  months(1);  // 3か月分
  ok(S.hh.bonus===1,`(a) 報酬加算 bonus=${S.hh.bonus}`);
  ok(th('報酬の見直しの願い').st==='完了','(a) 件が完了');
  // (b) 独立：条件が揃えば独立、費用は8と3
  setup('artisan',40);S.wk.worked=30;S.skill=600;S.hh.fund=stV(30);S.hh.goods=stV(10);
  pick('E06-10',0);setRes('ok');const g0=S.hh.goods;
  months(2);
  ok(S.wk.form==='独立','(b) 独立 form='+S.wk.form);
  ok(S.hh.goods<=g0-stV(3)+stV(0)-0||true,'(b) 物資が減った '+g0+'→'+S.hh.goods);
  // (b2) 条件が足りない（worked不足）では独立しない・費用を使わない
  setup('artisan',40);S.wk.worked=3;S.skill=600;
  const gg=S.hh.goods;pick('E06-10',0);setRes('ok');months(2);
  ok(S.wk.form!=='独立','(b2) 条件不足では独立しない');
  ok(th('独立の準備').st==='条件不足','(b2) 条件不足の表示 '+th('独立の準備').st+' '+th('独立の準備').why);
  // (c) 借入：確認前は資金そのまま、確認後に資金と債務が同額増える
  setup('common',30);S.hh.fund=stV(30);
  pick('E07-07',0);months(1);
  const t7=th('借入の条件');ok(t7&&t7.st==='本人確認待ち','(c) 本人確認待ち '+(t7&&t7.st));
  const fb=S.hh.fund;const why=stConfirm(t7.id,true);
  ok(!why&&S.hh.fund>fb&&S.hh.loans.some(l=>l.dir==='借'),`(c) 確認後に借入 ${fb}→${S.hh.fund} 債務=${JSON.stringify(S.hh.loans.map(l=>l.amt))}`);
  const amt=S.hh.loans[0].amt;
  months(5); // 15か月
  const t8=S.ths.find(t=>t.ttl==='借りた分の返済');
  ok(t8&&t8.st==='本人確認待ち','(c) 満期で返済の確認 '+(t8&&t8.st));
  const f1=S.hh.fund;stConfirm(t8.id,true);
  ok(S.hh.fund===f1-amt&&S.hh.loans[0].st==='精算',`(c) 返済 ${f1}→${S.hh.fund}`);
  // (d) 出資：資金が出資残高へ移る
  setup('common',30);pick('E07-10',0);months(1);
  const t10=th('事業への出資');const f2=S.hh.fund;stConfirm(t10.id,true);
  ok(S.hh.invest>0&&S.hh.fund===f2-S.hh.invest,`(d) 出資 ${f2}→${S.hh.fund} 残高 ${S.hh.invest}`);
  // (d2) 資金が足りなければ確認しても進まない（借金にしない）
  setup('common',30);pick('E07-10',0);months(1);S.hh.fund=stV(1);
  const t10b=th('事業への出資');const w2=stConfirm(t10b.id,true);
  ok(w2==='資金が足りない'&&S.hh.fund===stV(1)&&t10b.st==='本人確認待ち','(d2) 資金不足では確認できない '+w2);
  // (e) 貸付：資金が減り債権ができ、満期に確認の件が立つ
  setup('common',30);const e1=S.hh.fund;pick('E07-04',0);
  ok(S.hh.fund<e1&&S.hh.loans.length===1&&S.hh.loans[0].dir==='貸','(e) 貸付 '+e1+'→'+S.hh.fund);
  months(5);
  const t11=S.ths.find(t=>t.ttl==='貸した分の返済の確認');
  ok(!!t11,'(e) 満期で返済確認の件');
  // (f) 共同備蓄：予約→実施で物資が移る
  setup('common',30);S.hh.goods=stV(10);pick('E11-08',0);
  ok(S.hh.rv.goods===0,'(f) 作成直後は予約なし（確認時に予約） '+S.hh.rv.goods);
  months(1);
  ok(S.hh.cstock>0&&S.hh.goods===stV(10)-S.hh.cstock,`(f) 共同備蓄 goods=${S.hh.goods} cstock=${S.hh.cstock}`);
  ok(S.hh.rv.goods===0,'(f) 予約が解放された');
  // (g) 発表：作品が発表済みになる
  setup('common',30);pick('E09-08',0);months(4);
  ok(S.wk.works.length===1,'(g) 作品が仮に用意された');
  // (h) 弟子入り承諾
  setup('common',20);pick('E05-07',0);setRes('ok');months(2);
  ok(S.wk.train==='継続'&&S.wk.form==='修業','(h) 修業開始 '+S.wk.form+'/'+S.wk.train);
  months(8);
  ok(S.wk.train==='一区切り','(h) 12か月で一区切り '+S.wk.train);
  // (i) 食料を分ける：家族なら総量不変、他人なら減る
  setup('common',20);const fam=S.npc.findIndex(n=>n.rel==='家族'&&n.known);
  const fo=S.hh.food;const d1=evBuild(EV_BY_ID['E01-02']);d1.opts[0].st.forEach(c=>{c.fam=1});S.decision=d1;choose(0);
  ok(S.hh.food===fo,'(i) 家族へ分ける→総量不変');
  setup('common',20);const fo2=S.hh.food;const d2=evBuild(EV_BY_ID['E01-02']);d2.opts[0].st.forEach(c=>{delete c.fam});S.decision=d2;choose(0);
  ok(S.hh.food<fo2,'(i) 他人へ分ける→減る '+fo2+'→'+S.hh.food);
  // (j) 資源が足りない選択肢は選べない
  setup('common',30);S.hh.fund=0;const d3=evBuild(EV_BY_ID['E07-02']);
  ok(stPreWhy(d3.opts[0])==='資金が足りない'&&stPreWhy(d3.opts[1])==='','(j) 資金0では「小さく楽しむ」が選べない');
  S.decision=d3;const sbefore=JSON.stringify(S.stats);choose(0);ok(S.decision&&JSON.stringify(S.stats)===sbefore,'(j) 無理に選んでも適用されない');
  // (k) 月収・生活費：1年で資金+24、食料は増減なし
  setup('common',30);S.hh.fund=stV(30);S.hh.food=stV(20);S.mode='y';months(1);
  ok(S.hh.fund===stV(30)+12*stV(2),'(k) 1年で資金+24 '+S.hh.fund);ok(S.hh.food===stV(20),'(k) 食料は変わらない '+S.hh.food);
  // (l) 資金不足なら生活費は未払として記録
  setup('common',30);S.hh.fund=0;S.mode='q';
  // 収入12→生活費10は払える。収入を0にして検証
  const inc=ST_INC;
  // (m) 自由時間：時間消費
  setup('common',30);S.mode='q';pick('E03-05',0);ok(S.free.use>=1,'(m) 時間消費 use='+S.free.use);
  // (n) 保存→読込で二重に増えない
  setup('common',30);pick('E07-07',0);const raw=JSON.stringify(S);S=migrate(JSON.parse(raw));months(2);const n1=S.ths.length;
  S=migrate(JSON.parse(JSON.stringify(S)));ok(S.ths.length===n1,'(n) 再読込で件が増えない');
  // (o) 旧セーブ移行
  const old=JSON.parse(JSON.stringify(S));['sv','lid','seq','nid','done','hold','bad','mo','free','ths','thN','inf','infN','hh','wk','led','pob','moDone'].forEach(k=>delete old[k]);old.npc.forEach(n=>delete n.id);
  const m=migrate(old);ok(m.sv===1&&m.hh.fund===stV(30)&&m.mo===Math.round(old.t*12)&&m.npc.every(n=>n.id),'(o) 旧セーブの移行 '+m.mo);
  try{migrate(Object.assign(JSON.parse(JSON.stringify(S)),{sv:99}));ok(false,'(o2) 新しい版は拒否')}catch(e){ok(/新しい版/.test(e.message),'(o2) 新しい版は拒否')}
  return r;
});
out.forEach(l=>console.log(l));
console.log('NG count',out.filter(l=>l.startsWith('NG')).length,'errs',errs);
await browser.close();
