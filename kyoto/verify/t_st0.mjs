import {open} from './lib.mjs';
const {browser,page,errs}=await open();
const out=await page.evaluate(()=>{
  const r={};
  r.rows=Object.keys(ST_ROWS).length; r.need=Object.keys(ST_NEED).length;
  r.excluded=EV.filter(stBlocked).length; r.evTotal=EV.length;
  render=()=>{};openResult=()=>{};showFx=()=>{};evClose=()=>{};syncEvent=()=>{};
  // 1 life, answer all decisions randomly
  newGame('common');
  let g=0;
  while(!S.dead&&g++<2000){
    if(S.decision){choose(Math.random()<0.5?0:1);continue}
    tick();
  }
  r.age=S.age; r.mo=S.mo; r.ths=S.ths.length; r.inf=S.inf.length; r.hold=S.hold.length; r.bad=S.bad.map(b=>b.item+':'+b.why);
  r.hh={fund:S.hh.fund,food:S.hh.food,goods:S.hh.goods,unpaid:S.hh.unpaid,short:S.hh.short};
  r.wk=JSON.stringify(S.wk).slice(0,300);
  r.stages={}; S.ths.forEach(t=>r.stages[t.st]=(r.stages[t.st]||0)+1);
  r.holdList=S.hold.map(h=>h.ev+':'+h.m+'×'+h.n);
  return r;
});
console.log(JSON.stringify(out,null,1));
console.log('errs',errs);
await browser.close();
