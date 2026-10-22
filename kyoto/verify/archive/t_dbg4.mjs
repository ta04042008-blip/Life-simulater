import {open} from '../lib.mjs';
const {browser,page,errs}=await open();
const out=await page.evaluate(()=>{
  render=()=>{};
  newGame('common');S.age=30;S.t=30;S.mo=360;S.npc.forEach(n=>{if(n.from!=null)n.known=true});stIds();
  const r={};
  for(const id of ['E01-01','E07-01','E07-03','E07-09','E14-08']){
    const e=EV_BY_ID[id];r[id]={elig:evElig(e),rows:JSON.stringify(ST_ROWS[id+'|0']||null).slice(0,100)};
    const f0=S.hh.fund;evFireAuto({evid:id});r[id].fund=f0+'→'+S.hh.fund;
  }
  r.hold=S.hold;r.bad=S.bad;
  // auto events fired across 200 lives
  let cnt={};
  const orig=evFireAuto;evFireAuto=function(p){cnt[p.evid]=(cnt[p.evid]||0)+1;return orig(p)};
  for(let L=0;L<100;L++){newGame('common');let g=0;while(!S.dead&&g++<3000){if(S.decision){choose(0);continue}tick()}}
  r.autoCount=Object.keys(cnt).length;r.sample=Object.entries(cnt).sort((a,b)=>b[1]-a[1]).slice(0,5);r.e0701=cnt['E07-01']||0;r.e0703=cnt['E07-03']||0;
  return r;
});
console.log(JSON.stringify(out,null,1));await browser.close();
