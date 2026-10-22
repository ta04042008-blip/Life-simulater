import {open} from '../lib.mjs';
const {browser,page,errs}=await open();
const out=await page.evaluate(()=>{
  render=()=>{};openResult=()=>{};showFx=()=>{};evClose=()=>{};syncEvent=()=>{};
  const res={fail:[],checked:0,spawned:0,follow:{A:0,B:0,C:0,D:0,E:0,fu:0},bands:{}};
  const bad=(m)=>{if(res.fail.length<40)res.fail.push(m)};
  const inBand=(k,v)=>{if(!v)return true;const a=Math.abs(v),[lo,hi]=EV_BAND[k];return a>=lo&&a<=hi};
  const pids=['aristocrat','common','farm','artisan'];
  for(const e of EV){
    for(const pid of pids){
      newGame(pid);
      S.age=Math.max(e.ag[0],Math.min(e.ag[1],e.ag[0]<13&&e.ag[1]>=13?e.ag[0]:Math.max(e.ag[0],18)));
      if(e.ag[0]>=13)S.age=Math.max(e.ag[0],20);
      if(S.age>e.ag[1])S.age=e.ag[1];
      S.t=S.age;S.mode='y';S.stats=[500,500,500,500];S.sx=[0,0,0,0];S.nextDecT=999;S.nextSmallT=999;
      S.npc.forEach(n=>{if(n.from!=null)n.known=true});
      const n0=S.npc.length;
      if(!evElig(e)){ if(e.gr==='fam'&&!S.npc.some(n=>n.rel==='家族'&&n.known&&!n.dead)) continue; bad(`${e.id}/${pid}: 出せない (age ${S.age})`);continue}
      const snap=JSON.stringify(S);
      if(e.k==='a'){
        const before=S.stats.slice(),b0=S.npc.map(n=>n.aff);
        evFireAuto({evid:e.id});
        res.checked++;
        S.stats.forEach((v,i)=>{ if(!Number.isFinite(v)||v<0||v>1000)bad(`${e.id}: stat NaN/範囲外`)});
        if(!e.act)S.stats.forEach((v,i)=>{const d=v-before[i];if(!inBand('a',d))bad(`${e.id}/${pid}: 自動の変化量が範囲外 ${i}:${d}`)});
        if(S.npc.length>n0)res.spawned++;
        if(!S.evSeen[e.id]||S.evSeen[e.id].n!==1)bad(`${e.id}: 記録が不正`);
        continue;
      }
      for(let j=0;j<2;j++){
        S=JSON.parse(snap);
        const d=evBuild(e);
        if(!d){bad(`${e.id}/${pid}: build null`);continue}
        if(!evDecOk(d))bad(`${e.id}: 決断が不正 ${evDecWhy(d)}`);
        if(S.npc.length>n0)res.spawned++;
        S.decision=JSON.parse(JSON.stringify(d));       // 保存→再開と同じ形
        const o=d.opts[j];
        o.fx.forEach(v=>{if(!inBand(e.k,v))bad(`${e.id}/${pid}: 選択肢の変化量が範囲外 ${v}`)});
        if(o.np)for(const k in o.np){if(!S.npc[k])bad(`${e.id}: np先が無い`);if(!inBand(e.k,o.np[k]))bad(`${e.id}: 好感度の変化量が範囲外 ${o.np[k]}`)}
        const before=S.stats.slice();
        choose(j);
        res.checked++;
        if(S.decision!==null)bad(`${e.id}: 回答後も決断が残る`);
        S.stats.forEach((v,i)=>{ if(!Number.isFinite(v)||v<0||v>1000)bad(`${e.id}: stat NaN/範囲外`);const dd=v-before[i];if(!inBand(e.k,dd)&&!(v===0||v===1000))bad(`${e.id}/${pid}: 実際の変化量が範囲外 ${dd}`)});
        S.npc.forEach(n=>{if(!(n.aff>=0&&n.aff<=100))bad(`${e.id}: 好感度が範囲外`)});
        const fl=S.pending.length;
        if(e.k==='b'){
          const want=(j===0&&!!e.f)||(e.o[j].fw===2);
          if(want&&fl!==1)bad(`${e.id}/${j}: 後日談が積まれない (${fl})`);
          if(!want&&fl!==0)bad(`${e.id}/${j}: 不要な後日談 (${fl})`);
          if(fl===1){
            res.follow.fu++;
            const kind=S.pending[0].fu.sp.k;res.follow[kind]++;
            const txts=[S.pending[0].fu.sp.ok.x,S.pending[0].fu.sp.ng&&S.pending[0].fu.sp.ng.x,'返事はまだ出ていない。（保留のまま）'].filter(Boolean);
            // 保存→再読込しても一つだけ
            S=migrate(JSON.parse(JSON.stringify(S)));
            if(S.pending.length!==1)bad(`${e.id}: 再読込で後日談が変わった`);
            S.nextDecT=999;S.nextSmallT=999;
            let got=0;const L0=S.log.length;
            for(let t=0;t<6&&!S.dead;t++){S.age++;S.t++;tick()}
            if(!S.dead){
              const hits=S.log.filter(l=>txts.includes(l.x)).length;
              if(hits!==1)bad(`${e.id}/${j}: 後日談の配信が${hits}回`);
              if(S.pending.length!==0)bad(`${e.id}: 後日談が残る`);
            }
          }
        }
      }
    }
  }
  return res;
});
console.log(JSON.stringify(out,null,1),errs);
await browser.close();
