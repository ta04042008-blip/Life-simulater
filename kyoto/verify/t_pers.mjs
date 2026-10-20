import {open} from './lib.mjs';
const {browser,page,errs}=await open();
const r=await page.evaluate(()=>{
  const out=[],bad=[];
  for(const k of Object.keys(PERSONAS)){
    for(let i=0;i<30;i++){
      newGame(k);
      const P=PERSONAS[k];
      if(S.year<P.yr[0]||S.year>=P.yr[1])bad.push(k+' year '+S.year);
      if(!BG[k]||!BG[k].spring)bad.push(k+' bg');
      const names=[S.myName,...S.npc.map(n=>n.name)];
      if(new Set(names).size!==names.length||names.some(n=>!n||/[一-龥]/.test(n)))bad.push(k+' names '+names.join());
      try{for(let j=0;j<12;j++)tick()}catch(e){bad.push(k+' tick '+e.message);break}
    }
    newGame(k);out.push(k+' '+PERSONAS[k].label+' '+S.era+' '+S.myName+' '+S.npc.map(n=>n.name+'('+n.role+')').join(' '));
  }
  // random
  const cnt={},yrs=[];for(let i=0;i<4000;i++){const b=randomBirth();cnt[b.pid]=(cnt[b.pid]||0)+1;yrs.push(b.year);const P=PERSONAS[b.pid];if(b.year<P.yr[0]||b.year>=P.yr[1])bad.push('rand '+b.pid+b.year)}
  return {out,bad:bad.slice(0,8),nbad:bad.length,cnt,min:Math.min(...yrs),max:Math.max(...yrs)};
});
console.log(r.out.join('\n'));console.log(JSON.stringify(r.cnt),r.min,r.max,'bad',r.nbad,r.bad,errs);
await browser.close();
