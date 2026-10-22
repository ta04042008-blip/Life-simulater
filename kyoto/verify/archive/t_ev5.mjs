import {open} from '../lib.mjs';
import fs from 'fs';
const {browser,page,errs}=await open();
const info=await page.evaluate(()=>{
  const L=(e)=>e.b.length+Math.max(...e.o.map(o=>o.l.length));
  const bigs=EV.filter(e=>e.k==='b').sort((a,b)=>L(b)-L(a)),sm=EV.filter(e=>e.k==='s').sort((a,b)=>L(b)-L(a));
  return{big:bigs[0].id,small:sm[0].id,bigLen:L(bigs[0]),smallLen:L(sm[0]),maxLabel:Math.max(...EV.filter(e=>e.k!=='a').flatMap(e=>e.o.map(o=>o.l.length))),maxSay:Math.max(...EV.filter(e=>e.k==='b').map(e=>e.sy.length)),maxRep:Math.max(...EV.filter(e=>e.k==='b').flatMap(e=>e.o.map(o=>Math.max(o.y.length,o.rep.length))))};
});
console.log(JSON.stringify(info));
for(const [w,h] of [[375,667],[390,844]]){
  await page.setViewportSize({width:w,height:h});
  for(const id of [info.big,info.small]){
    await page.evaluate((id)=>{
      newGame('common');S.age=30;S.t=30;S.nextDecT=999;S.nextSmallT=999;
      S.npc.forEach(n=>{n.known=true});
      const e=EV_BY_ID[id];S.decision=evBuild(e);evHide();render();syncEvent();
    },id);
    await page.waitForTimeout(500);
    await page.mouse.click(w/2,h/2);await page.waitForTimeout(1500);
    const m=await page.evaluate(()=>{const c=document.getElementById('evcard');const r=c.getBoundingClientRect();return{top:Math.round(r.top),bottom:Math.round(r.bottom),h:innerHeight,w:Math.round(r.width),sw:document.documentElement.scrollWidth,iw:innerWidth,btns:[...document.querySelectorAll('.evopts button')].map(b=>Math.round(b.getBoundingClientRect().height))}});
    console.log(w,h,id,JSON.stringify(m));
    await page.screenshot({path:`shots/ev_${w}_${id}.png`});
    if(id===info.big){await page.click('[data-opt="0"]');await page.waitForTimeout(2500);await page.mouse.click(w/2,h/2);await page.waitForTimeout(800);await page.screenshot({path:`shots/evres_${w}_${id}.png`})}
  }
}
console.log(errs);await browser.close();
