import {open} from '../lib.mjs';
const {browser,page,errs}=await open();
const r=await page.evaluate(()=>{
  render=()=>{};openResult=()=>{};showFx=()=>{};evClose=()=>{};syncEvent=()=>{};
  const vis=[];let over8=0,lives=0;const POL=['学び','仕事','交流','家族','休養'];
  for(let L=0;L<400;L++){
    newGame(['aristocrat','common','farm','artisan'][L%4]);let mx=0,g=0;
    while(!S.dead&&g++<3000){
      if(S.decision){choose(rnd(S.decision.opts.length));continue}
      S.policy=S.age<6?'交流':POL[L%5];slots=rollSlots();flushSlots();tick();
      mx=Math.max(mx,S.npc.filter(visible).length);
    }
    vis.push(mx);lives++;if(mx>8)over8++;
  }
  vis.sort((a,b)=>a-b);
  return{max:vis[vis.length-1],p50:vis[200],p90:vis[360],over8Pct:+(over8/lives*100).toFixed(1)};
});
console.log(JSON.stringify(r),errs);await browser.close();
