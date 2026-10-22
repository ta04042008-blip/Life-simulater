import {open} from '../lib.mjs';
const {browser,page,errs}=await open();
const r=await page.evaluate(()=>({n:EV.length,bad:EV_BAD,by:{a:EV.filter(e=>e.k==='a').length,s:EV.filter(e=>e.k==='s').length,b:EV.filter(e=>e.k==='b').length}}));
console.log(JSON.stringify(r),errs);
await browser.close();
