import {open} from './lib.mjs';
const {browser,page,errs}=await open();
const r=await page.evaluate(()=>{
  const out=[];let bad=[];
  for(const pid of ['aristocrat','common','farm','artisan']){
    for(let k=0;k<60;k++){
      newGame(pid);
      for(let j=0;j<8;j++){try{evSpawn(['friend','acq','neigh','mentor','love','junior','child'][j%7])}catch(e){}}
      const names=[S.myName,...S.npc.map(n=>n.name)];
      if(new Set(names).size!==names.length)bad.push(pid+' dup '+names.join());
      if(names.some(n=>!n||/[一-龥]/.test(n)))bad.push(pid+' kanji/empty '+names.join());
      const m=S.npc.find(n=>n.role==='母');if(m&&!NAMEP[pid==='aristocrat'?'noble':PERSONAS[pid].year>=1400?'muro':'heian'].f.includes(m.name))bad.push('mother '+m.name);
      const f=S.npc.find(n=>n.role==='父');if(f&&!NAMEP[pid==='aristocrat'?'noble':PERSONAS[pid].year>=1400?'muro':'heian'].m.includes(f.name))bad.push('father '+f.name);
    }
    newGame(pid);out.push(pid+': '+S.myName+' / '+S.npc.map(n=>n.name+'('+n.role+')').join(' '));
  }
  return {out,bad:bad.slice(0,5),nbad:bad.length};
});
console.log(r.out.join('\n'));console.log('bad',r.nbad,r.bad,errs);
await browser.close();
