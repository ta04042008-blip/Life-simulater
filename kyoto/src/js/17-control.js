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
    slots=rollSlots();schedule(SPEEDS[speedIdx][0]);
  },ms);
}
function start(){
  if(timer||S.decision||S.dead)return;
  if(remaining==null)slots=rollSlots();
  schedule(remaining!=null?Math.max(50,remaining):SPEEDS[speedIdx][0]);
  animT=setInterval(()=>{frame++;drawScene()},600);
  render();
}
function step(n,untilDecision){
  stop();resume=false;remaining=null;setBar(0,0);
  const go1=()=>{if(S.decision||S.dead)return false;slots=rollSlots();flushSlots();return tick()};
  for(let i=0;i<n;i++){if(!go1())break;if(S.dead||(untilDecision&&S.decision))break}
  if(untilDecision&&!S.decision&&!S.dead){let g=0;while(!S.decision&&!S.dead&&g++<400)go1()}
  render();showFx();
}
function randomBirth(){                                    // 生まれ年を0〜1900年からランダムに引き、その年の時代の境遇を重みで選ぶ
  const y=rnd(1901),c=Object.keys(RANDW).filter(k=>y>=PERSONAS[k].yr[0]&&y<PERSONAS[k].yr[1]);
  const tot=c.reduce((a,k)=>a+RANDW[k],0);let r=Math.random()*tot;
  for(const k of c){r-=RANDW[k];if(r<0)return{pid:k,year:y}}
  return{pid:c[0]||'common',year:y};
}
const randomPersona=()=>randomBirth().pid;

