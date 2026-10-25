// 17-control.js — 再生・速度・画面切り替え・保存などの制御
/* ---------- control ---------- */
function setBar(frac,ms){
  const el=$('tickp');if(!el)return;
  el.style.animation='none';void el.offsetWidth;el.style.width=(frac*100)+'%';
  if(ms>0){el.style.setProperty('--from',(frac*100)+'%');el.style.animation=`tickfill ${ms}ms linear forwards`}
}
function stop(){
  evT.forEach(clearTimeout);evT=[];
  if(timer){
    clearTimeout(timer);timer=null;
    remaining=Math.max(0,tickMs-(Date.now()-tickStart));
    setBar(1-remaining/SPEEDS[speedIdx][0],0);
  }
  if(animT){clearInterval(animT);animT=null}
  seasonTimers.forEach(clearTimeout);seasonTimers=[];seasonOv=null;
}
function schedule(ms){
  tickMs=ms;tickStart=Date.now();
  setBar(1-ms/SPEEDS[speedIdx][0],ms);
  armSlots(ms);
  timer=setTimeout(()=>{
    remaining=null;
    evT.forEach(clearTimeout);evT=[];flushSlots();
    frame++;tick();render();showFx();playSeasons();
    if(S.decision||S.dead){resume=!!S.decision;stop();remaining=null;setBar(0,0);render();return}
    slotsEnsure();schedule(SPEEDS[speedIdx][0]);
  },ms);
}
function start(){
  if(timer||S.decision||S.dead)return;
  slotsEnsure();
  schedule(remaining!=null?Math.max(50,remaining):SPEEDS[speedIdx][0]);
  animT=setInterval(()=>{frame++;drawScene()},600);
  render();
}
function step(n,untilDecision){
  stop();resume=false;remaining=null;setBar(0,0);
  const go1=()=>{if(S.decision||S.dead)return false;slotsEnsure();flushSlots();return tick()};
  for(let i=0;i<n;i++){if(!go1())break;if(S.dead||(untilDecision&&S.decision))break}
  if(untilDecision&&!S.decision&&!S.dead){let g=0;while(!S.decision&&!S.dead&&g++<400)go1()}
  render();showFx();
}
function birthCandidates(y){return Object.keys(RANDW).filter(k=>PERSONAS[k]&&!PERSONAS[k].testOnly&&RANDW[k]>0&&y>=PERSONAS[k].yr[0]&&y<PERSONAS[k].yr[1])}
function randomBirth(forcedYear){                                    // 生まれ年を西暦1〜2025年から完全に均等に引き、その年に生まれうる正式な境遇を重みで選ぶ（人生の乱数 S.rs には触れない）
  const run=typeof rngFree==='function'?rngFree:(f=>f());   // 引いた年は、データが無くても別の年へ引き直さない。境遇が無ければ gap=true を返す
  return run(()=>{
  const y=forcedYear||1+rnd(BIRTH_MAX),c=birthCandidates(y);   // forcedYear は検査専用（通常は渡さない）
  const tot=c.reduce((a,k)=>a+RANDW[k],0);if(!c.length)return{pid:null,year:y,gap:true};
  let r=Math.random()*tot;
  for(const k of c){r-=RANDW[k];if(r<0)return{pid:k,year:y}}
  return{pid:c[c.length-1],year:y};
  });
}
const randomPersona=()=>randomBirth().pid;

