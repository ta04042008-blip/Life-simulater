import {open} from '../lib.mjs';
const {browser,page,errs}=await open();
const r=await page.evaluate(()=>{
  render=()=>{};openResult=()=>{};showFx=()=>{};evClose=()=>{};syncEvent=()=>{};
  const cnt={a:0,s:0,b:0},oldS=0;const origA=evFireAuto,origB=evBuild;
  let nan=0,lives=0,npcMax=0,npcSum=0,pendLeft=0,exceptions=[],bigLife=[],smallLife=[],autoLife=[];
  const ages=[];let spawnTot=0;
  evFireAuto=function(p){cnt.a++;return origA(p)};
  evBuild=function(e){const d=origB(e);if(d)cnt[e.k]++;return d};
  const POL=['学び','仕事','交流','家族','休養'];
  for(let L=0;L<1200;L++){
    try{
      newGame(['aristocrat','common','farm','artisan'][L%4]);const pol=POL[L%5];
      const c0={...cnt};const n0=S.npc.length;
      let g=0;
      while(!S.dead&&g++<3000){
        if(S.decision){choose(rnd(S.decision.opts.length));continue}
        S.policy=S.age<6?'交流':pol;
        slots=rollSlots();flushSlots();tick();
        if(S.stats.some(v=>!Number.isFinite(v)||v<0||v>1000))nan++;
        if(S.npc.some(n=>!Number.isFinite(n.aff)||n.aff<0||n.aff>100))nan++;
      }
      lives++;ages.push(S.deathAge);npcMax=Math.max(npcMax,S.npc.length);npcSum+=S.npc.length;spawnTot+=S.npc.length-n0;pendLeft+=S.pending.length;
      bigLife.push(cnt.b-c0.b);smallLife.push(cnt.s-c0.s);autoLife.push(cnt.a-c0.a);
    }catch(e){exceptions.push(String(e.stack||e).slice(0,300));if(exceptions.length>3)break}
  }
  const avg=a=>+(a.reduce((x,y)=>x+y,0)/a.length).toFixed(2);
  const q=(xs,p)=>{xs=xs.slice().sort((a,b)=>a-b);return xs[Math.floor(xs.length*p)]};
  return{lives,nan,exceptions,npcMax,npcAvg:+(npcSum/lives).toFixed(1),spawnAvg:+(spawnTot/lives).toFixed(1),pendLeft,
    perLife:{auto:avg(autoLife),small:avg(smallLife),big:avg(bigLife),bigMax:Math.max(...bigLife)},
    death:{mean:avg(ages),p10:q(ages,.1),p50:q(ages,.5),p90:q(ages,.9)},bad:EV_BAD.length,rt:EV_RT.length};
});
console.log(JSON.stringify(r),errs);
await browser.close();
