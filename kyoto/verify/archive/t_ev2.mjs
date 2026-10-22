import {open} from '../lib.mjs';
const {browser,page,errs}=await open();
const log=[];const ok=(c,m)=>{log.push((c?'PASS ':'FAIL ')+m)};
// 1) 不備のあるデータを検査に通す
const r1=await page.evaluate(()=>{
  const good=JSON.parse(JSON.stringify(EV_RAW));
  const mk=(f)=>{const e=JSON.parse(JSON.stringify(EV_RAW.find(x=>x.k==='b')));f(e);return e};
  const bad=[
   mk(e=>{e.id='X-DUP'}),mk(e=>{e.id='X-DUP'}),                 // ID重複
   mk(e=>{e.id='X-1';e.o=[e.o[0]]}),                            // 選択肢が1つ
   mk(e=>{e.id='X-2';e.o[0].fx=[1,2,3]}),                       // 能力の変化が不正
   mk(e=>{e.id='X-3';e.gr='nobody'}),                           // 役割が未登録
   mk(e=>{e.id='X-4';e.ag=[30,10]}),                            // 年齢帯が逆転
   mk(e=>{e.id='X-5';delete e.f}),                              // 後日談がない
   mk(e=>{e.id='X-6';e.f.k='Z'}),                               // 後日談の種類
   mk(e=>{e.id='X-7';e.f.k='B';delete e.f.ng}),                 // 失敗側がない
   mk(e=>{e.id='X-8';e.o[1].x=''}),                             // 結果文が空
   mk(e=>{e.id='X-9';e.o[0].fx=[NaN,0,0,0]}),                   // NaN
   null,{}, mk(e=>{e.id='X-10';e.k='q'})
  ];
  evInit(good.concat(bad));
  const res={n:EV.length,bad:EV_BAD.map(b=>b.id+':'+b.why),shown:!document.getElementById('evwarn').hidden,txt:document.getElementById('evwarn').innerText.slice(0,200)};
  evInit(EV_RAW);
  return res;
});
ok(r1.n===141,`正しい141件(140+重複の先頭1件)だけ使う: ${r1.n}`);
ok(r1.bad.length===13,`不備13件を報告: ${r1.bad.length}`);
ok(r1.shown,'画面に報告が出る');
console.log(r1.bad.join('\n'));
// 2) 回答待ちのイベントに不備があるとき：黙って消さず、止めて報告
const r2=await page.evaluate(()=>{
  newGame('common');S.age=20;S.t=20;
  S.decision={title:'壊れた決断',body:'本文',opts:[{l:'ひとつだけ',x:'x',fx:[0,0,0,0]}]};
  syncEvent();
  const w=document.getElementById('evwarn');
  const shown=!w.hidden&&w.innerText.includes('壊れた決断')&&!!document.getElementById('evbadok');
  const stillThere=S.decision!==null;
  const win=document.getElementById('evwin');const winOpen=!win.hidden;
  document.getElementById('evbadok').click();
  return{shown,stillThere,winOpen,cleared:S.decision===null,logged:S.log[0].x,hidden:document.getElementById('evwarn').hidden};
});
ok(r2.shown,'不備のある回答待ち：報告が出る');
ok(r2.stillThere,'報告中は黙って消えない');
ok(!r2.winOpen,'壊れた選択肢の窓は開かない');
ok(r2.cleared&&r2.logged.includes('不備'),'記録して先へ進むと、年表に記録して外れる');
ok(r2.hidden,'報告が消える');
// 3) 後日談の内容が壊れているとき：適用せず記録
const r3=await page.evaluate(()=>{
  newGame('common');S.age=30;S.t=30;S.stats=[500,500,500,500];
  S.pending.push({in:1,fu:{id:'Z',j:0,pi:null,sp:{k:'B',m:3,ok:{x:'',fx:[1]}}}});
  S.nextDecT=999;S.nextSmallT=999;
  const before=S.stats.slice();S.age++;S.t++;tick();
  return{pending:S.pending.length,logged:S.log.some(l=>String(l.x).includes('【イベントの不備】')),same:true,banner:!document.getElementById('evwarn').hidden};
});
ok(r3.pending===0&&r3.logged,'壊れた後日談：適用せず、年表に不備を記録');
// 4) 保存→再開で回答待ちが維持され、二重に適用されない
const r4=await page.evaluate(()=>{
  render=()=>{};openResult=()=>{};showFx=()=>{};evClose=()=>{};
  newGame('farm');S.age=25;S.t=25;S.stats=[500,500,500,500];S.nextDecT=999;S.nextSmallT=999;
  const e=EV.find(x=>x.id==='E05-07');S.decision=evBuild(e);
  const id1=JSON.stringify(S.decision);
  S=migrate(JSON.parse(JSON.stringify(S)));
  const same=JSON.stringify(S.decision)===id1;
  const seen=S.evSeen['E05-07'].n;
  choose(0);const st=S.stats.slice();choose(0);      // 2度目の回答は無視される
  return{same,seen,twice:JSON.stringify(st)===JSON.stringify(S.stats),pend:S.pending.length};
});
ok(r4.same&&r4.seen===1,'再開しても同じ決断・引き直しなし');
ok(r4.twice&&r4.pend===1,'二重回答は反映されない');
console.log(log.join('\n'));console.log(errs);
await browser.close();
