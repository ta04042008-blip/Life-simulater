import {open} from './lib.mjs';
const {browser,page,errs}=await open();
const out=await page.evaluate(()=>{
  render=()=>{};openResult=()=>{};showFx=()=>{};evClose=()=>{};syncEvent=()=>{};
  const res={fail:[],checked:0,sum:{},logs:{}};
  const bad=m=>{if(res.fail.length<60)res.fail.push(m)};
  const pids=['aristocrat','common','farm','artisan'];
  const inv=(tag)=>{
    const h=S.hh;
    ['fund','food','goods','home','cstock','invest','unpaid'].forEach(k=>{if(!Number.isFinite(h[k])||h[k]<0)bad(`${tag}: 在庫 ${k}=${h[k]}`)});
    if(S.bad.length)bad(`${tag}: 不備 ${S.bad.map(b=>b.item+':'+b.why).join(' / ')}`);
    S.stats.forEach(v=>{if(!Number.isFinite(v)||v<0||v>1000)bad(`${tag}: 能力が範囲外`)});
    if(S.free.use<0||S.free.use>10)bad(`${tag}: 自由時間`);
    const ids=S.ths.map(t=>t.id);if(new Set(ids).size!==ids.length)bad(`${tag}: 件ID重複`);
  };
  for(const e of EV){
    if(e.k==='a')continue;
    if(stBlocked(e))continue;
    for(const pid of pids){
      newGame(pid);
      S.age=Math.max(e.ag[0],Math.min(e.ag[1],e.ag[0]>=13?Math.max(e.ag[0],20):Math.max(e.ag[0],8)));
      S.t=S.age;S.mo=S.age*12;S.mode='q';S.stats=[600,600,600,600];S.sx=[0,0,0,0];S.nextDecT=999;S.nextSmallT=999;
      S.npc.forEach(n=>{if(n.from!=null)n.known=true});
      stIds();S.ongoing=null;
      if(['E08-07','E08-08','E08-09'].includes(e.id))evFireAuto({evid:'E08-03'});     // 病状が要る出来事は、病状を用意してから
      if(!evElig(e)){ if(e.gr==='fam'&&!S.npc.some(n=>n.rel==='家族'&&n.known&&!n.dead))continue; bad(`${e.id}/${pid}: 出せない`);continue}
      const snap=JSON.stringify(S);
      for(let j=0;j<2;j++){
        S=JSON.parse(snap);
        const d=evBuild(e);
        if(!d){bad(`${e.id}/${pid}: build null`);continue}
        S.decision=JSON.parse(JSON.stringify(d));
        const o=S.decision.opts[j];
        if(stPreWhy(o)){ // 資源が足りない選択肢
          continue}
        const seq0=S.seq;
        choose(j);
        res.checked++;
        inv(`${e.id}/${pid}/${j} 直後`);
        // 同じ選択を二度適用しても増えない（二重処理防止）
        const nth=S.ths.length,ninf=S.inf.length,fund=S.hh.fund;
        stRun(o,{ev:e.id,seq:d.seq,title:d.title},j);
        if(S.ths.length!==nth||S.inf.length!==ninf||S.hh.fund!==fund)bad(`${e.id}/${j}: 二重処理`);
        // 途中で保存→読み込み
        const L0=S.log.length;
        for(let t=0;t<14&&!S.dead;t++){
          S.nextDecT=999;S.nextSmallT=999;
          tick();
          if(t===3){S=migrate(JSON.parse(JSON.stringify(S)));}
        }
        if(S.dead)continue;
        inv(`${e.id}/${pid}/${j} 最後`);
        const key=`${e.id}|${j}`;
        const sm=res.sum[key]=res.sum[key]||{};
        S.ths.filter(t=>t.seq===d.seq).forEach(t=>{const kk=`${t.ttl}→${t.st}`;sm[kk]=(sm[kk]||0)+1});
        // 後日談の通知は一度だけ
        S.ths.filter(t=>t.seq===d.seq&&t.sp).forEach(t=>{if(!t.notified&&t.nmo<=S.mo)bad(`${e.id}/${j}: 通知されていない`)});
        const rl=S.log.slice(0,S.log.length-L0>0?S.log.length-L0:S.log.length).filter(l=>l.t==='r').map(l=>l.x);
        const dup=rl.filter((x,i)=>rl.indexOf(x)!==i);
        if(dup.length&&!/返済は確認できなかった/.test(dup[0]))bad(`${e.id}/${pid}/${j}: 同じ結果文が重複 ${dup[0]}`);   // 返済の再確認は文が同じになるのが正しい
        (res.logs[key]=res.logs[key]||new Set()).add(rl.join(' / '));
      }
    }
  }
  res.logs=Object.fromEntries(Object.entries(res.logs).map(([k,v])=>[k,[...v].slice(0,2)]));
  return res;
});
console.log('checked',out.checked,'fail',out.fail.length);
out.fail.forEach(f=>console.log(' -',f));
console.log(JSON.stringify(out.sum,null,0).slice(0,6000));
console.log('errs',errs);
import fs from 'fs';fs.writeFileSync('/tmp/st1_logs.json',JSON.stringify(out.logs,null,1));
await browser.close();
