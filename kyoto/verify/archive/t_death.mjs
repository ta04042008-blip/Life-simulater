import {BUILD,FIXDIR} from '../lib.mjs';
import {open} from '../lib.mjs';
const run=async(file)=>{
  const {browser,page}=await open(file);
  const r=await page.evaluate(()=>{
    render=()=>{};openResult=()=>{};showFx=()=>{};evClose=()=>{};syncEvent=()=>{};
    const ages=[],byPol={};const POL=['学び','仕事','交流','家族','休養'];
    for(let L=0;L<2500;L++){
      newGame(['aristocrat','common','farm','artisan'][L%4]);const pol=POL[L%5];S.policy='交流';let g=0;
      while(!S.dead&&g++<3000){
        if(S.decision){choose(rnd(S.decision.opts.length));continue}
        S.policy=S.age<6?'交流':pol;
        slots=rollSlots();flushSlots();tick();
      }
      ages.push(S.deathAge);(byPol[pol]=byPol[pol]||[]).push(S.deathAge);
    }
    const q=(xs,p)=>{xs=xs.slice().sort((a,b)=>a-b);return xs[Math.floor(xs.length*p)]};
    const sum=xs=>({mean:+(xs.reduce((a,b)=>a+b,0)/xs.length).toFixed(1),p10:q(xs,.1),p50:q(xs,.5),p90:q(xs,.9)});
    const bands={};ages.forEach(a=>{const b=Math.floor(a/10)*10;bands[b]=(bands[b]||0)+1});
    const infant=ages.filter(a=>a<=5).length/ages.length;
    return {all:sum(ages),pol:Object.fromEntries(Object.entries(byPol).map(([k,v])=>[k,sum(v)])),bandPct:Object.fromEntries(Object.entries(bands).map(([k,v])=>[k,+(v/ages.length*100).toFixed(1)])),infantPct:+(infant*100).toFixed(1)};
  });
  await browser.close();return r;
};
const before=await run('/home/claude/work/original.html'),after=await run(BUILD);
console.log('変更前',JSON.stringify(before));console.log('変更後',JSON.stringify(after));
