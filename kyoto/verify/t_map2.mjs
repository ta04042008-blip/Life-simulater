import {BUILD,FIXDIR} from './lib.mjs';
import {chromium} from './lib.mjs';
const b=await chromium.launch();const p=await b.newPage({viewport:{width:375,height:760},deviceScaleFactor:2});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+BUILD);await p.waitForTimeout(800);
const setup=N=>p.evaluate((N)=>{newGame('common',1000);const gs=['friend','acq','neigh','mentor','love','junior','local','work','child'];
  S.npc.forEach(n=>{n.known=true;n.aff=Math.max(n.aff,20)});
  let i=0;while(S.npc.filter(visible).length<N){try{evSpawn(gs[i%gs.length])}catch(e){break}i++;if(i>60)break}
  S.npc.forEach(n=>{n.known=true;n.aff=Math.max(n.aff,20+Math.random()*50)});go('map');renderMap()},N);
for(const N of [6,12,25]){await setup(N);await p.waitForTimeout(500);await p.screenshot({path:`shots/mp_${N}.png`});console.log(N,await p.evaluate(()=>[S.npc.filter(visible).length,document.querySelectorAll('#mapsvg .node').length,document.documentElement.scrollWidth<=innerWidth+1,document.getElementById('mapsvg').getAttribute('viewBox')]))}
// interactions at 25
await p.click('#mfit');await p.waitForTimeout(200);await p.screenshot({path:'shots/mp_fit.png'});
const vb0=await p.evaluate(()=>document.getElementById('mapsvg').getAttribute('viewBox'));
await p.click('#mzin');const vb1=await p.evaluate(()=>document.getElementById('mapsvg').getAttribute('viewBox'));
console.log('zoom changed',vb0!==vb1);
// drag
const box=await p.locator('#mapsvg').boundingBox();
await p.mouse.move(box.x+100,box.y+200);await p.mouse.down();await p.mouse.move(box.x+180,box.y+260,{steps:5});await p.mouse.up();
const vb2=await p.evaluate(()=>document.getElementById('mapsvg').getAttribute('viewBox'));console.log('drag changed',vb1!==vb2);
// drag shouldn't open profile
console.log('sheet open after drag',await p.evaluate(()=>!document.getElementById('sheet').hidden));
await p.click('#mme');
await p.locator('#mapsvg [data-prof="self"]').click();await p.waitForTimeout(200);
console.log('tap opens',await p.evaluate(()=>!document.getElementById('sheet').hidden));
console.log(errs);await b.close();
