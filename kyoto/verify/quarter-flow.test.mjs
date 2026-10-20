import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const dir=new URL('../src/js/',import.meta.url);
function game(){
 const el=()=>({hidden:false,remove(){},addEventListener(){},style:{setProperty(){}},getContext:()=>({}),innerHTML:'',querySelector:()=>null});
 const elements=new Map();const db=new Map();
 const ctx=vm.createContext({document:{querySelectorAll:()=>[],createElement:el,getElementById:k=>{if(!elements.has(k))elements.set(k,el());return elements.get(k)},addEventListener(){}},window:{addEventListener(){}},setTimeout:()=>1,clearTimeout(){},setInterval:()=>1,clearInterval(){},performance:{now:()=>0},console,localStorage:{getItem:k=>db.get(k)||null,setItem:(k,v)=>db.set(k,v)}});
 const files=JSON.parse(readFileSync(new URL('order.json',dir),'utf8'));
 for(const f of files){if(f==='19-title-screen.js')continue;vm.runInContext(readFileSync(new URL(f,dir),'utf8'),ctx,{filename:f})}
 const run=s=>vm.runInContext(s,ctx);
 run("render=()=>{};showFx=()=>{};drawScene=()=>{};openResult=()=>{evMode='result'};go=()=>{};centerScene=()=>{};toast=()=>{};newGame('common',1700)");
 return run;
}
test('adult legacy saves advance three months without replaying past months',()=>{
 const run=game();assert.equal(run("S.age=35;S.t=35;S.year=1735;S.mode='y';S=migrate(JSON.parse(JSON.stringify(S)));const m=S.mo;tick();S.mode==='q'&&S.t===35.25&&S.mo===m+3"),true);
});
test('small results freeze time, charge once, survive restore and require acknowledgement',()=>{
 const run=game();assert.equal(run("S.decision={title:'休息',small:true,opts:[{l:'休む',x:'休んだ',fx:[1,0,0,0]}]};choose(0);const v=S.stats[0],t=S.t;choose(0);tick();step(4);start();S.stats[0]===v&&S.t===t&&!timer&&!!S.pendingResult"),true);
 assert.equal(run("const raw=JSON.parse(saveSnapshot());saveRestore(raw,'test',false);!!S.pendingResult&&S.stats[0]===v"),true);
 assert.equal(run('evClose();!S.pendingResult'),true);
});
test('quarter draws retain unconsumed slots across saves and do not consume them when blocked',()=>{
 const run=game();assert.equal(run("S.age=20;slots=rollSlots();const a=slots.filter(x=>x.k==='o').length;const json=JSON.stringify(slots);S.decision={opts:[{}]};runSlot(slots[0]);a>=3&&a<=5&&JSON.stringify(slots)===json"),true);
 assert.equal(run("S.decision=null;S=migrate(JSON.parse(JSON.stringify(S)));JSON.stringify(rollSlots())===json"),true);
});
test('unavailable actions create no decision, case or cost',()=>{
 const run=game();assert.equal(run("const b=JSON.stringify(S);lifeAction('仕事');lifeAction('invalid');JSON.stringify(S)===b"),true);
});

test('focus does not grant stats, affinity, skill or work months by itself',()=>{
 const run=game();assert.equal(run("S.age=20;S.t=20;const initial=JSON.stringify(S);seeded(123,()=>tick());const a=JSON.stringify([S.stats,S.npc.map(n=>n.aff),S.skill,S.wk.worked]);S=JSON.parse(initial);S.policy='仕事';seeded(123,()=>tick());a===JSON.stringify([S.stats,S.npc.map(n=>n.aff),S.skill,S.wk.worked])"),true);
});
test('important notices wait behind a choice and are acknowledged one at a time',()=>{
 const run=game();assert.equal(run("S.decision={title:'選択',opts:[{l:'見る',x:'見た',fx:[0,0,0,0]}]};S.stopQueue=['知らせ一','知らせ二'];lifeShowNotice();!S.pendingResult"),true);
 assert.equal(run("choose(0);evClose();S.pendingResult.o.x==='知らせ一'&&S.stopQueue.length===1"),true);
 assert.equal(run("evClose();S.pendingResult.o.x==='知らせ二';"),true);
 assert.equal(run('evClose();!lifeBlocked()'),true);
});
test('lives continue through decisions and notices with finite bounded state',()=>{
 const run=game();assert.equal(run(`seeded(456,()=>{
  for(let life=0;life<40;life++){
   newGame(['common','farm','artisan','aristocrat'][life%4]);
   let n=0;
   while(!S.dead&&n++<3000){
    if(S.pendingResult){evClose();continue}
    if(S.decision){const j=S.decision.opts.findIndex(o=>!stPreWhy(o));if(j<0)throw Error('No affordable option: '+S.decision.title);choose(j);continue}
    slots=rollSlots();flushSlots();tick();
    if(S.stats.some(v=>!Number.isFinite(v)||v<0||v>1000))return false;
   }
   if(!S.dead)return false;
  }
  return true;
 })`),true);
});
