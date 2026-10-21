import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {open} from './lib.mjs';
const {browser,page,errs}=await open();
try{
 const checks=await page.evaluate(()=>{
  newLife('common',1700,false);stop();
  S.age=35;S.year=1735;S.t=35;S.mode='y';S=migrate(JSON.parse(JSON.stringify(S)));
  const t=S.t;tick();const quarter=S.mode==='q'&&S.t===t+.25;
  S.decision={title:'食卓',body:'今日の食卓',small:true,opts:[{l:'休む',x:'休息した。',fx:[1,0,0,0]}]};
  render();const v=S.stats[0];choose(0);const result=!!S.pendingResult&&evMode==='result';
  const now=S.t;tick();step(4);start();const frozen=S.t===now&&!timer;
  const after=S.stats[0];choose(0);const once=S.stats[0]===after;
  const raw=JSON.parse(saveSnapshot());saveRestore(raw,'検証',false);
  const restored=!!S.pendingResult&&evMode==='result'&&S.stats[0]===after;
  evClose();const cleared=!S.pendingResult;
  S.quarterSlots=null;slots=rollSlots();const autos=slots.filter(x=>x.k==='o').length;const count=autos>=3&&autos<=5;
  const queue=JSON.stringify(slots);saveRestore(JSON.parse(saveSnapshot()),'検証',false);slots=rollSlots();const kept=queue===JSON.stringify(slots);
  return {quarter,result,frozen,once,restored,cleared,count,kept};
 });
 for(const [k,v] of Object.entries(checks))assert.equal(v,true,k);
 assert.deepEqual(errs,[]);
 mkdirSync(new URL('./shots/',import.meta.url),{recursive:true});
 await page.screenshot({path:new URL('./shots/quarter-flow.png',import.meta.url).pathname});
 console.log('PASS',checks);
}finally{await browser.close()}
