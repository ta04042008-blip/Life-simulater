import {BUILD,FIXDIR} from './lib.mjs';
import {chromium} from './lib.mjs';
const b=await chromium.launch();const p=await b.newPage({viewport:{width:375,height:760}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+BUILD);await p.waitForTimeout(500);
await p.evaluate(()=>{newGame('common',1000);go('life')});
await p.evaluate(()=>{speedIdx=3;start()});
const r=await p.evaluate(async()=>{const t0=S.mo;await new Promise(r=>setTimeout(r,2500));const a=S.mo;go('map');await new Promise(r=>setTimeout(r,2500));const b=S.mo;const run=!!timer;go('home');go('life');await new Promise(r=>setTimeout(r,1500));return {t0,a,b,run,c:S.mo,runAfter:!!timer,dec:!!S.decision,dead:S.dead}});
console.log(JSON.stringify(r),errs);await b.close();
