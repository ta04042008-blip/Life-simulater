import {open} from './lib.mjs';
const {browser,page,errs}=await open();
page.setDefaultTimeout(600000);
const out=await page.evaluate(()=>{
  render=()=>{};openResult=()=>{};showFx=()=>{};evClose=()=>{};syncEvent=()=>{};
  const cntA={};const origA=evFireAuto;evFireAuto=function(p){cntA[p.evid]=(cntA[p.evid]||0)+1;return origA(p)};
  const R={cntA,lives:0,fail:[],ages:[],ev:{a:0,s:0,b:0},thEnd:{},stages:{},maxInf:0,maxLed:0,holdKinds:{},fundMax:0,foodMin:1e9,confYes:0,confNo:0,cnt:{ths:0,openEnd:0},reload:0,pathPend:0};
  const bad=m=>{if(R.fail.length<40)R.fail.push(m)};
  const pols=Object.keys(POLICIES);
  const t0=performance.now();
  for(let L=0;L<1200;L++){
    newGame(randomPersona());S.policy=pols[rnd(pols.length)];
    let g=0;
    while(!S.dead&&g++<3000){
      if(S.decision){
        const d=S.decision;const ok=d.opts.map((o,i)=>stPreWhy(o)?-1:i).filter(i=>i>=0);
        if(!ok.length){bad(`L${L}: 選べる選択肢が無い ${d.title}`);break}
        const sb=S.log.length;
        choose(ok[rnd(ok.length)]);
        if(d.ev){const e=EV_BY_ID[d.ev];if(e)R.ev[e.k]++}
        continue;
      }
      if(g%7===0)S.policy=pols[rnd(pols.length)];
      S.ths.filter(t=>t.st==='本人確認待ち').forEach(t=>{if(Math.random()<0.6){const w=stConfirm(t.id,Math.random()<0.7);if(!w)R.confYes++;else R.confNo++}});
      slots=rollSlots();flushSlots();tick();
      if(g%23===0){const a=JSON.stringify(S);S=migrate(JSON.parse(a));R.reload++;
        const b=JSON.stringify(S);if(a!==b){ // 移行は冪等であること（読み込みのたびに値が変わらない）
          const c=JSON.stringify(migrate(JSON.parse(b)));if(b!==c)bad(`L${L}: 再読込で状態が変わり続ける`)}}
      if(S.bad.length){bad(`L${L}: 不備 ${S.bad.map(b=>b.item+':'+b.why).join(' / ')}`);break}
      const h=S.hh;['fund','food','goods','home','cstock','invest','unpaid'].forEach(k=>{if(!Number.isFinite(h[k])||h[k]<0)bad(`L${L}: ${k}=${h[k]}`)});
      S.stats.forEach(v=>{if(!Number.isFinite(v)||v<0||v>1000)bad(`L${L}: 能力`)});
    }
    R.lives++;R.ages.push(S.age);
    R.cnt.ths+=S.ths.length;
    S.ths.forEach(t=>{R.stages[t.st]=(R.stages[t.st]||0)+1});
    S.hold.forEach(h=>{R.holdKinds[h.ev+':'+h.m]=(R.holdKinds[h.ev+':'+h.m]||0)+h.n});
    R.maxInf=Math.max(R.maxInf,S.inf.length);R.maxLed=Math.max(R.maxLed,S.led.length);
    R.fundMax=Math.max(R.fundMax,S.hh.fund/100);R.foodMin=Math.min(R.foodMin,S.hh.food/100);
    R.pathPend+=S.pending.length;
    if(JSON.stringify(S).length>200000)bad(`L${L}: セーブが大きすぎる ${JSON.stringify(S).length}`);
  }
  R.autoKinds=Object.keys(cntA).length;R.autoTotal=Object.values(cntA).reduce((a,b)=>a+b,0)/R.lives;R.cntA={E01:cntA['E01-01'],E0701:cntA['E07-01'],E0703:cntA['E07-03'],E0709:cntA['E07-09'],E1408:cntA['E14-08']};
  R.ms=Math.round(performance.now()-t0);
  R.meanAge=R.ages.reduce((a,b)=>a+b,0)/R.ages.length;delete R.ages;
  return R;
});
console.log(JSON.stringify(out,null,1));
console.log('errs',errs);
await browser.close();
