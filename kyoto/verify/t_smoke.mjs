import { BUILD, FIXDIR, chromium } from './lib.mjs';
const browser = await chromium.launch();
const page = await browser.newPage({viewport:{width:390,height:844}});
const errs=[];
page.on('pageerror',e=>errs.push('PAGEERROR '+e.message));
page.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE '+m.text())});
await page.goto('file://'+BUILD);
await page.waitForTimeout(500);
const r = await page.evaluate(()=>{
  const out={};
  out.stats=S.stats.slice();out.star=S.star.slice();out.tm=JSON.stringify(S.tm);
  out.npc=S.npc.map(n=>({name:n.name,off:n.off,stats:n.stats.map(Math.round),star:n.star,tm:n.tm.v.map(Math.round),on:n.tm.on}));
  // 1つの人生を最後まで
  let guard=0,smalls=0,decs=0;
  while(!S.dead&&guard++<2000){
    if(S.decision){S.decision.small?smalls++:decs++;choose(Math.floor(Math.random()*S.decision.opts.length));if(evMode)evClose();continue}
    step(1);
  }
  out.dead=S.dead;out.deathAge=S.deathAge;out.smalls=smalls;out.decs=decs;
  out.finalStats=S.stats.map(Math.round);out.finalStar=S.star;out.tmType=S.tm.on?tmType(S.tm):'形成中';out.tmv=S.tm.v.map(Math.round);
  out.logTail=S.chron.filter(e=>/気質|★|伸び/.test(e.x)).map(e=>e.age+'歳 '+e.x);
  return out;
});
console.log(JSON.stringify(r,null,1));
console.log('ERRORS',errs);
await browser.close();
