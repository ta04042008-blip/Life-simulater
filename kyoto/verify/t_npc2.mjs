import {open} from './lib.mjs';
const {browser,page,errs}=await open();
const r=await page.evaluate(()=>{
  const P=PERSONAS.common;let up=0,dn=0,N=2000;
  for(let k=0;k<N;k++){
    const n=mkPerson(P,0);
    for(let a=1;a<=80;a++){
      const s0=n.star.slice();npcLife(n,a,1,false);
      for(let i=0;i<4;i++){if(n.star[i]>s0[i])up++;if(n.star[i]<s0[i])dn++}
    }
  }
  return {upPerLife:+(up/N).toFixed(2),downPerLife:+(dn/N).toFixed(2)};
});
console.log(r);await browser.close();
