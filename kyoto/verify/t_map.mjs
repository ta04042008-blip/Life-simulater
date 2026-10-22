import {chromium} from './lib.mjs';
import {open} from './lib.mjs';
for(const [w,h] of [[375,667],[390,844]]){
  const {browser,page,errs}=await open();
  await page.setViewportSize({width:w,height:h});
  for(const N of [9,12,17]){
    await page.evaluate((N)=>{
      newGame('common');S.age=30;S.t=30;
      const P=PERSONAS[S.pid];
      const gs=Object.keys(EV_GROUPS).filter(k=>k!=='self'&&k!=='fam'&&k!=='newfam');
      S.npc.forEach(n=>{n.known=true;n.aff=Math.max(n.aff,20)});
      let i=0;while(S.npc.filter(visible).length<N){S.npc.push({name:'人物'+(i+1)+'（仮）',rel:EV_GROUPS[gs[i%gs.length]].rel,aff:30+i,from:null,known:true,off:rnd(10),skill:300,skillName:'x',dead:false,deadAge:null,hist:[],extra:{},fromText:null,...mkPerson(P,30)});i++}
      render();go('map');renderMap();
    },N);
    await page.waitForTimeout(400);
    await page.screenshot({path:`shots/map_${w}_${N}.png`});
    const info=await page.evaluate(()=>({vis:S.npc.filter(visible).length,sw:document.documentElement.scrollWidth,iw:innerWidth}));
    console.log(w,N,JSON.stringify(info),errs.length);
  }
  await browser.close();
}
