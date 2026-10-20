import {open} from '../lib.mjs';
const {browser,page,errs}=await open();
const r=await page.evaluate(()=>{
  render=()=>{};openResult=()=>{};showFx=()=>{};evClose=()=>{};syncEvent=()=>{};
  const res=[];
  for(let L=0;L<6;L++){
    newGame(['aristocrat','common','farm','artisan'][L%4]);S.policy='学び';
    const init=S.star.slice();const hist=[];let g=0;
    while(!S.dead&&g++<3000&&S.age<40){
      if(S.decision){choose(rnd(S.decision.opts.length));continue}
      const s0=S.star[3],x0=S.sx[3];
      slots=rollSlots();flushSlots();tick();
      if(S.star[3]!==s0)hist.push([S.age,S.q,s0+'->'+S.star[3],Math.round(x0),Math.round(S.sx[3])]);
    }
    res.push({pid:S.pid,init,final:S.star.slice(),charmChanges:hist.slice(0,6)});
  }
  return res;
});
console.log(JSON.stringify(r,null,0));await browser.close();
