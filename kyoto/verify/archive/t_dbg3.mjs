import {open} from '../lib.mjs';
const {browser,page,errs}=await open();
const out=await page.evaluate(()=>{
  render=()=>{};openResult=()=>{};showFx=()=>{};evClose=()=>{};syncEvent=()=>{};
  newGame('common');S.age=30;S.t=30;S.mo=360;S.mode='q';S.stats=[700,700,700,700];S.npc.forEach(n=>{if(n.from!=null)n.known=true});stIds();
  const e=EV_BY_ID['E07-07'];const d=evBuild(e);S.decision=JSON.parse(JSON.stringify(d));choose(0);
  const log=[];
  for(let i=0;i<7;i++){S.nextDecT=999;S.nextSmallT=999;tick();
    if(i===0){const t=S.ths.find(x=>x.ttl==='借入の条件');stConfirm(t.id,true)}
    log.push(`mo=${S.mo} `+S.ths.map(t=>t.ttl+':'+t.st+(t.due!=null?'/due'+t.due:'')).join(' | ')+' loans:'+JSON.stringify(S.hh.loans))}
  return log;
});
console.log(out.join('\n'));await browser.close();
