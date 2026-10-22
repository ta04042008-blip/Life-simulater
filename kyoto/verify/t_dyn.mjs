import {open} from './lib.mjs';
const {browser,page,errs}=await open();
const r=await page.evaluate(()=>{
  render=()=>{};openResult=()=>{};showFx=()=>{};evClose=()=>{};syncEvent=()=>{};
  const PIDS=['aristocrat','common','farm','artisan'],POL=['学び','仕事','交流','家族','休養'];
  const live=(pid,polMode)=>{
    newGame(pid);let g=0;const rec={snap:{},up:[0,0,0,0],down:[0,0,0,0],tmStart:null,flips:0,typeChanges:0,deathAge:null};
    let lastType=null,polI=rnd(5);
    S.policy=polMode==='mix'?POL[polI]:polMode;
    const upd=S.age;
    while(!S.dead&&g++<3000){
      if(S.decision){choose(rnd(S.decision.opts.length));if(evMode)evClose();continue}
      if(polMode==='mix'&&S.age>=6&&Math.random()<0.1)S.policy=POL[rnd(5)];else if(polMode!=='mix')S.policy=S.age<6?'交流':polMode;else if(S.age<6)S.policy='交流';
      const a0=S.age,star0=S.star.slice(),on0=S.tm.on,ty0=S.tm.on?tmType(S.tm):null;
      slots=rollSlots();flushSlots();tick();
      for(let i=0;i<4;i++){if(S.star[i]>star0[i])rec.up[i]++;if(S.star[i]<star0[i])rec.down[i]++}
      
      if(on0){const ty=tmType(S.tm);if(ty!==ty0)rec.typeChanges++}
      for(const A of [10,13,20,40,60])if(S.age>=A&&!rec.snap[A])rec.snap[A]={star:S.star.slice(),tm:S.tm.v.map(Math.round),ty:S.tm.on?tmType(S.tm):'形成中'};
    }
    const st=S.chron.find(e=>/気質のタイプが見えてきた/.test(e.x));rec.tmStart=st?st.age:null;rec.drift=S.tm.v.map((x,i)=>Math.abs(x-(rec.snap[13]?rec.snap[13].tm[i]:x)));rec.deathAge=S.deathAge;rec.endStar=S.star.slice();rec.tmv=S.tm.v.map(Math.round);
    return rec;
  };
  const out={};
  for(const pm of ['学び','仕事','交流','休養','mix']){
    const N=120,rs=[];for(let k=0;k<N;k++)rs.push(live(PIDS[k%4],pm));
    const avg=(f)=>+(rs.reduce((a,r)=>a+f(r),0)/rs.length).toFixed(2);
    const dist=(A,i)=>{const c=[0,0,0,0,0],n=rs.filter(r=>r.snap[A]);n.forEach(r=>c[r.snap[A].star[i]-1]++);return c.map(x=>+(x/Math.max(1,n.length)*100).toFixed(0))};
    out[pm]={
      lives:N,deathAge:avg(r=>r.deathAge),
      upPerLife:[0,1,2,3].map(i=>avg(r=>r.up[i])),downPerLife:[0,1,2,3].map(i=>avg(r=>r.down[i])),
      star40:[0,1,2,3].map(i=>dist(40,i)),star60:[0,1,2,3].map(i=>dist(60,i)),
      tmStartAge:avg(r=>r.tmStart==null?13:r.tmStart),tmStartNull:rs.filter(r=>r.tmStart==null).length,tmStartDist:[0,0,0,0,0,0,0].map((_,k)=>rs.filter(r=>r.tmStart!=null&&r.tmStart>=8+k&&r.tmStart<9+k).length),driftAfter13:avg(r=>r.drift.reduce((a,b)=>a+b,0)/5),
      typeChangesPerLife:avg(r=>r.typeChanges)
    };
  }
  return out;
});
for(const k in r){console.log('==',k);console.log(JSON.stringify(r[k]))}
console.log(errs);await browser.close();
