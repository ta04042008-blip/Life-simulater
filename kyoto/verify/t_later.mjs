import {open} from './lib.mjs';
const {browser,page,errs}=await open();
const r=await page.evaluate(()=>{
  render=()=>{};openResult=()=>{};showFx=()=>{};evClose=()=>{};syncEvent=()=>{};
  newGame('common');
  const out={};
  S.age=20;S.mode='y';S.t=20;S.stats=[500,500,500,500];
  const k0=S.stats.slice();
  // 決断を直接作って最初の「later」付き選択肢を選ぶ
  const d=PERSONAS.common.dec.find(x=>x.opts.some(o=>o.later));
  const idx=d.opts.findIndex(o=>o.later);
  S.decision=JSON.parse(JSON.stringify(d));S.decision.idx=0;
  choose(idx);
  out.pendingAfterChoose=S.pending.length;
  const afterChoose=S.stats.slice();
  // 保存→再読込
  const saved=JSON.stringify(S);S=migrate(JSON.parse(saved));
  out.pendingAfterReload=S.pending.length;
  S.nextDecT=999;S.nextSmallT=999;
  const logs0=S.log.length;
  const log=[];
  for(let i=0;i<4&&!S.dead;i++){S.age++;S.t++;tick()}
  out.deliveredLogs=S.log.filter(l=>l.x&&d.opts[idx].later.x===l.x).length;
  out.pendingAfter=S.pending.length;
  return out;
});
console.log(JSON.stringify(r),errs);
await browser.close();
