import {open} from './lib.mjs';
const {browser,page,errs}=await open();
const r=await page.evaluate(()=>{
  render=()=>{};
  const out={};
  const P=PERSONAS.common;
  // 寿命：体力を死亡判定に使う（今回）／元の仮の体力曲線を使う（変更前）
  const life=(startAge,link)=>{
    const n=mkPerson(P,startAge);let a=startAge;
    while(a<MAXAGE){
      a++;npcLife(n,a,1,false);
      const v=link?n.stats[0]:clamp(560-Math.max(0,a-35)*5,150,600);
      const hz=annualHazard(a,v,null);
      if(Math.random()<1-Math.exp(-hz.tot))return {age:a,n};
    }
    return {age:MAXAGE,n};
  };
  const q=(xs,p)=>{xs=xs.slice().sort((a,b)=>a-b);return xs[Math.floor(xs.length*p)]};
  const sum=(xs)=>({mean:+(xs.reduce((a,b)=>a+b,0)/xs.length).toFixed(1),p10:q(xs,.1),p50:q(xs,.5),p90:q(xs,.9)});
  for(const sa of [26,35,50]){
    const A=[],B=[];for(let k=0;k<3000;k++){A.push(life(sa,true).age);B.push(life(sa,false).age)}
    out['death_from'+sa]={link:sum(A),old:sum(B)};
  }
  // 能力値の範囲・★の分布（年齢別）
  let bad=0;const starAge={};
  for(const age of [0,10,26,40,60,80]){
    const c=[[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0]];let N=1500,mn=1e9,mx=-1;const means=[0,0,0,0];
    for(let k=0;k<N;k++){
      const n=mkPerson(P,age);
      // 年齢までの、周りの人としての暮らし
      for(let a=age+1;a<=Math.min(age+30,100);a++)npcLife(n,a,1,false);
      n.stats.forEach((v,i)=>{if(v<0||v>1000||!isFinite(v))bad++;mn=Math.min(mn,v);mx=Math.max(mx,v);means[i]+=v/N});
      n.star.forEach((s,i)=>{if(s<1||s>5)bad++;c[i][s-1]++});
    }
    starAge['start'+age+'(+30y)']={starPct:c.map(x=>x.map(y=>Math.round(y/N*100))),meanStats:means.map(Math.round),min:Math.round(mn),max:Math.round(mx)};
  }
  out.starAge=starAge;out.bad=bad;
  // 子どもNPCの気質：表示開始の年齢
  const st=[];for(let k=0;k<3000;k++){const n=mkPerson(P,0);let a=0;while(!n.tm.on&&a<20){a++;npcLife(n,a,1,false)}st.push(a)}
  out.npcTmStartAge=sum(st);
  return out;
});
console.log(JSON.stringify(r,null,1));console.log(errs);await browser.close();
