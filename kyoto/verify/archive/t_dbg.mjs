import {open} from '../lib.mjs';
const {browser,page,errs}=await open();
const r=await page.evaluate(()=>{
  render=()=>{};openResult=()=>{};showFx=()=>{};evClose=()=>{};syncEvent=()=>{};
  newGame('common');S.policy='学び';
  const tot={ev:[0,0,0,0],tick:[0,0,0,0],choice:[0,0,0,0]};const trace=[];
  const snap=()=>S.sx.slice();
  let g=0;
  while(!S.dead&&g++<3000&&S.age<40){
    if(S.decision){const b=snap();choose(rnd(S.decision.opts.length));const a=snap();for(let i=0;i<4;i++)tot.choice[i]+=a[i]-b[i];continue}
    slots=rollSlots();let b=snap();flushSlots();let a=snap();for(let i=0;i<4;i++)tot.ev[i]+=a[i]-b[i];
    b=snap();tick();a=snap();for(let i=0;i<4;i++)tot.tick[i]+=a[i]-b[i];
    if(S.age%10===0&&S.q===0)trace.push([S.age,S.sx.map(Math.round),S.star.slice()]);
  }
  return {ev:tot.ev.map(Math.round),tick:tot.tick.map(Math.round),choice:tot.choice.map(Math.round),trace,age:S.age};
});
console.log(JSON.stringify(r));console.log(errs);await browser.close();
