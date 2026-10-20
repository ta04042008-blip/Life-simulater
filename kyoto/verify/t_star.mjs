import {open} from './lib.mjs';
const {browser,page,errs}=await open();
const r=await page.evaluate(()=>{
  const out={};
  const setup=(stars,policy,age,stats)=>{
    newGame('common');S.age=age;S.mode='y';S.policy=policy;S.star=stars.slice();S.stats=stats.slice();S.sx=[0,0,0,0];S.ongoing=null;
    S.t=age;S.nextDecT=1e9;S.nextSmallT=1e9;S.npc.forEach(n=>{n.aff=50});
  };
  // A: 出来事（活動）の成長：★ごと・能力値の高さごとの平均増分（知識 fx=+4）
  out.A={};
  for(const v of [200,500,800]){
    out.A['v'+v]=[1,2,3,4,5].map(st=>{
      let tot=0;const N=4000;
      for(let k=0;k<N;k++){setup([1,st,1,1],'交流',30,[500,v,500,500]);applyFx([0,4,0,0],null,'act');tot+=S.stats[1]-v}
      return +(tot/N).toFixed(2)});
  }
  // B: 回復・自然な成長・マイナスには★を掛けない
  const same=(kind,fx)=>{const res=[1,5].map(st=>{let tot=0;for(let k=0;k<4000;k++){setup([st,st,st,st],'交流',30,[500,500,500,500]);applyFx(fx,null,kind);tot+=S.stats[0]+S.stats[1]+S.stats[2]+S.stats[3]}return tot/4000});return res};
  out.B_rec=same('rec',[4,4,4,4]);out.B_nat=same('nat',[4,4,4,4]);out.B_neg=same('act',[-4,-4,-4,-4]);
  // C: tick 全体（同じ乱数）：★1と★5で、活動方針の知識だけ差が出て、ほかは同じか
  const tk=(policy,age,star)=>{
    return seeded(777,()=>{setup([star,star,star,star],policy,age,[450,300,450,450]);S.t=age;tick();return S.stats.map(x=>+x.toFixed(2))})};
  out.C_study={s1:tk('学び',30,1),s5:tk('学び',30,5)};
  out.C_rest={s1:tk('休養',30,1),s5:tk('休養',30,5)};
  out.C_child={s1:tk('学び',9,1),s5:tk('学び',9,5)};
  // D: 自然な成長・衰え（natStep）は★に無関係
  const nat=(star)=>seeded(5,()=>{const p={stats:[500,500,500,500],tgt:[600,600,600,600],star:[star,star,star,star]};for(let a=1;a<=70;a++)natStep(p,a,1,false);return p.stats.map(Math.round)});
  out.D={s1:nat(1),s5:nat(5)};
  // E: 病気の回復（+10）にも掛からない
  const ill=(star)=>seeded(9,()=>{setup([star,star,star,star],'休養',30,[300,300,300,300]);S.ongoing={name:'風邪',mult:3,left:3};tick();return S.stats.map(x=>+x.toFixed(2))});
  out.E={s1:ill(1),s5:ill(5)};
  return out;
});
console.log(JSON.stringify(r,null,1));console.log(errs);await browser.close();
