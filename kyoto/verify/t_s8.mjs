import {open} from './lib.mjs';
const {browser,page,errs}=await open();
const out=await page.evaluate(()=>{
  render=()=>{};openResult=()=>{};showFx=()=>{};evClose=()=>{};syncEvent=()=>{};
  const r=[];const ok=(c,m)=>r.push((c?'OK  ':'NG  ')+m);
  const setup=(pid,age)=>{newGame(pid);S.age=age;S.t=age;S.mo=age*12;S.mode='q';S.switchAge=999;S.stats=[700,700,700,700];S.nextDecT=999;S.nextSmallT=999;S.ongoing=null;S.npc.forEach(n=>{if(n.from!=null)n.known=true;n.aff=Math.max(n.aff,50)});stIds();S.hh.rv={fund:0,food:0,goods:0};S.hh.fund=stV(60);S.hh.goods=stV(30);S.hh.food=stV(40)};
  const add=(rel,name)=>{S.npc.push({name,rel,aff:60,from:null,known:true,off:0,skill:300,skillName:'x',dead:false,deadAge:null,hist:[],extra:{},fromText:null,...mkPerson(PERSONAS[S.pid],S.age)});stIds();return S.npc.length-1};
  const pick=(id,j,pi)=>{const e=EV_BY_ID[id];const d=evBuild(e,pi);S.decision=JSON.parse(JSON.stringify(d));choose(j);return d};
  const mo=(n)=>{for(let i=0;i<n;i++){S.nextDecT=999;S.nextSmallT=999;stMonths(1)}};
  const th=(s)=>S.ths.find(t=>t.ttl&&t.ttl.includes(s));
  const logs=()=>S.log.map(l=>l.x).join(' / ');
  const sum=()=>S.stats.reduce((a,b)=>a+b,0);
  // (a) 断られた時：成功の報いは付けない／断りの文を出す
  setup('common',30);let fi=S.npc.findIndex(n=>n.rel==='家族'&&n.co);pick('E01-10',0,fi);
  let t=th('生活の分担の組み直し');t.res='ng';const s0=sum();mo(5);
  ok(sum()===s0,'(a) 断られたE01-10：能力は変わらない '+(sum()-s0));
  ok(/話がまとまらなかった/.test(logs()),'(a) 断りの文が出る');
  setup('common',30);fi=S.npc.findIndex(n=>n.rel==='家族'&&n.co);pick('E01-10',0,fi);t=th('生活の分担の組み直し');t.res='ok';const s1=sum();mo(5);
  ok(sum()>s1&&/定着/.test(logs()),'(a2) 合意されたE01-10：報いと文が出る '+(sum()-s1));
  // (b) C：効果は一度だけ（確定時と通知時の二重適用なし）
  setup('common',30);pick('E12-08',0);const s2=sum();mo(1);
  const a=th('に受け入れを頼む');if(a)a.res='ok';mo(5);
  const gain=sum()-s2;ok(gain<=3+1&&gain>=2,'(b) E12-08の効果は一度だけ '+gain);
  ok(/争いが収まったわけではない/.test(logs()),'(b) 現状の文に「争いが収まったわけではない」');
  setup('common',30);S.hl.work='通常';evFireAuto({evid:'E08-03'});pick('E08-07',0);const s3=sum();mo(5);
  ok(sum()-s3<=4&&sum()-s3>=2,'(b2) E08-07の効果は一度だけ '+(sum()-s3));
  // (c) 連鎖：別居は実際に始まるまで成功の文を出さない
  setup('common',30);fi=S.npc.findIndex(n=>n.rel==='家族'&&n.co);pick('E13-08',0,fi);
  const s4=sum();mo(8);
  ok(!/別々の暮らしにも慣れ/.test(logs())&&sum()===s4,'(c) 準備だけでは成功の文も報いも出ない');
  let c=th('と別に暮らし始める');ok(c&&c.st==='本人確認待ち','(c) 本人確認待ち '+(c&&c.st));
  stConfirm(c.id,true);mo(5);
  ok(/別々に暮らし始めた/.test(logs())&&sum()>s4,'(c) 実際に別居してから結果の文と報いが出る '+(sum()-s4));
  setup('common',30);fi=S.npc.findIndex(n=>n.rel==='家族'&&n.co);pick('E13-08',0,fi);mo(3);c=th('と別に暮らし始める');if(c)stConfirm(c.id,false);const s5=sum();mo(8);
  ok(!/別々の暮らしにも慣れ/.test(logs())&&sum()===s5,'(c2) 見送れば成功の文も報いも出ない');
  // E04-07 同じ連鎖
  setup('common',30);let pi=add('想い人','想い人（仮）');pick('E04-07',0,pi);t=th('共同生活の相談');t.res='ok';mo(3);
  const s6=sum();ok(!/新しい日々が始まった/.test(logs()),'(c3) 承諾だけでは「暮らしが始まった」と言わない');
  c=th('と同じ家で暮らし始める');stConfirm(c.id,true);mo(5);ok(/新しい日々が始まった/.test(logs()),'(c3) 同居開始後に文が出る');
  // (d) 担い手：実際に行われていなければ文も報いも出さない
  setup('common',30);S.hs.dmg=0;pick('E01-07',0);const s7=sum();mo(5);
  ok(sum()===s7&&/直すほどの傷みはなく/.test(logs())&&!/見違えるように/.test(logs()),'(d) 傷みが無ければ修理の成功文は出ない');
  setup('common',30);S.hs.dmg=2;pick('E01-07',0);mo(8);ok(/見違えるように/.test(logs())&&S.hs.dmg===1,'(d2) 修繕が済めば成功文が出る');
  setup('common',30);fi=S.npc.findIndex(n=>n.rel==='家族');pick('E08-10',0,fi);npcById(S.hl.care.tid).dead=true;mo(5);
  ok(/世話は、続けられなかった/.test(logs())&&!/絆も深まった/.test(logs()),'(d3) 世話が続かなければ成功文は出ない');
  setup('common',30);S.free.use=0;pick('E09-07',0);S.wk.acts.forEach(x=>{if(x.k==='芸の修業')x.tm=99});mo(5);
  ok(/思うように進められていない/.test(logs())&&!/腕が目に見えて/.test(logs()),'(d4) 修業が実施されていなければ「腕が上がった」と言わない');
  setup('common',30);pick('E09-07',0);mo(5);ok(/腕が目に見えて/.test(logs()),'(d5) 修業を実施すれば文が出る');
  setup('common',30);pick('E09-10',0);mo(5);ok(/張りが戻った/.test(logs()),'(d6) 趣味を続ければ文が出る');
  setup('common',30);pick('E09-10',0);S.wk.acts.find(x=>x.k==='趣味').st='休止';mo(5);ok(/まだ定まっていない/.test(logs())&&!/張りが戻った/.test(logs()),'(d7) 休止していれば成功文は出ない');
  // (e) C：病状の状態で文が変わる
  setup('common',30);evFireAuto({evid:'E08-03'});pick('E08-07',0);S.hl.conds[0].p2=0;S.hl.conds[0].need2=999;mo(4);
  ok(/まだ変わらない/.test(logs()),'(e) 変わらず '+logs().slice(-80));
  setup('common',30);evFireAuto({evid:'E08-03'});pick('E08-07',0);S.hl.work='休止';mo(4);
  ok(/すっかり落ち着いた|少しずつ落ち着いてきた/.test(logs()),'(e2) 回復・軽快');
  // (f) 全41件：断った時に報いが付かない（f.ngが無いもの）
  const bad=[];
  EV.filter(e=>e.k==='b'&&e.f).forEach(e=>{
    for(const pid of ['common']){
      setup(pid,30);S.hl.work='通常';evFireAuto({evid:'E08-03'});S.hs.dmg=2;
      let d;try{pick(e.id,0)}catch(x){bad.push(e.id+' 例外 '+x.message);continue}
      S.ths.forEach(x=>{if(x.sk==='ask'&&!x.fin)x.res='ng'});
      const base=sum();mo(8);
      const hasNg=!!e.f.ng;
      S.ths.filter(x=>x.ev===e.id&&x.res==='ng'&&x.sp&&!hasNg&&e.f.k!=='C'&&x.fin).forEach(x=>{if(sum()!==base)bad.push(e.id+' 断られたのに報い '+(sum()-base))});
      if(S.bad.length)bad.push(e.id+' 不備 '+JSON.stringify(S.bad.map(b=>b.why)));
    }});
  ok(bad.length===0,'(f) 41件の後日談の点検 '+bad.join(' | '));
  stAudit();ok(!S.bad.length,'(g) 検査に異常なし');
  return r.join('\n');
});
console.log(out);console.log('errs',errs);await browser.close();
