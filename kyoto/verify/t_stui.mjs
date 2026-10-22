import {open} from './lib.mjs';
const {browser,page,errs}=await open();
for(const vp of [{width:375,height:667},{width:390,height:844}]){
  await page.setViewportSize(vp);
  await page.evaluate(()=>{newGame('common');S.nextSmallT=1e9;S.nextDecT=1e9;
    const keep=[render,openResult,showFx,evClose,syncEvent];render=()=>{};openResult=()=>{};showFx=()=>{};evClose=()=>{};syncEvent=()=>{};
    let g=0;while(!S.dead&&S.age<30&&g++<400){if(S.decision){choose(0);continue}slots=rollSlots();flushSlots();tick()}
    location.reload===0});
  await page.reload();await page.waitForTimeout(300);
  await page.evaluate(()=>{newGame('common');S.age=25;S.mode='q';S.nextSmallT=1e9;S.nextDecT=1e9;
    stNewTh&&0;render();go('home')});
  await page.waitForTimeout(300);
  const tag=vp.width;
  await page.screenshot({path:`shots/home_${tag}.png`,fullPage:true});
  const r=await page.evaluate(()=>({sw:document.documentElement.scrollWidth,iw:innerWidth,nav:[...document.querySelectorAll('nav button')].map(b=>b.getBoundingClientRect().right<=innerWidth+1),txt:$('home-body').innerText.slice(0,200).replace(/\n/g,' / ')}));
  console.log(tag,JSON.stringify(r));
  await page.evaluate(()=>go('menu'));await page.waitForTimeout(200);
  await page.screenshot({path:`shots/menu_${tag}.png`,fullPage:true});
  console.log(tag,'menu overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
}
console.log('errs',errs);await browser.close();
