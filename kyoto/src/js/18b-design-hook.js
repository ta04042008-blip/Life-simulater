// 18b-design-hook.js — 設計ツールの受け口。window.__KYOTO_DESIGN__（設計データ）があるときだけ値を差し替える。無いとき（公開版）は既定値を記録するだけで、動作は変わらない
/* 設計データの形：{v:1, vars:{名前:値}, personas:{境遇キー:{項目:値}}}。変えた所だけ入っていればよい。
   形の合わない値は使わず、KYOTO_DESIGN.errors に理由を残す（ゲームは既定値のまま動く）。値の範囲の細かい確認は設計ツール側で行う。 */
const DESIGN_VER=1;
const dzNum=v=>typeof v==='number'&&isFinite(v);
const dzArr=(v,n,f=dzNum)=>Array.isArray(v)&&v.length===n&&v.every(f);
const dzStr=v=>typeof v==='string'&&v.length>0&&v.length<=40;
const dzObj=(v,ref,f)=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(ref).every(k=>f(v[k]))&&Object.keys(v).every(k=>k in ref);
const dzSet=(a,v)=>{a.splice(0,a.length,...v)};                       // 配列は同じ入れ物のまま中身を入れ替える
const dzCopy=v=>JSON.parse(JSON.stringify(v));
const dzP01=v=>dzNum(v)&&v>=0&&v<=1;
const dzPair=v=>dzArr(v,2)&&v[0]<=v[1];
/* 調整できる値：名前 → [読み出し, 書き込み, 形の検査] */
const DESIGN_VARS={
  MAXAGE:[()=>MAXAGE,v=>{MAXAGE=v},v=>dzNum(v)&&v>=1&&v<=150],
  HZ:[()=>HZ,v=>Object.assign(HZ,v),v=>dzObj(v,HZ,x=>dzNum(x)&&x>=0)],
  FAM_MISS:[()=>FAM_MISS,v=>{FAM_MISS=v},dzP01],
  FAM_SIB:[()=>FAM_SIB,v=>{FAM_SIB=v.slice()},v=>dzArr(v,3)&&v.every(x=>x>=0)&&Math.abs(v[0]+v[1]+v[2]-100)<1e-9],
  FAM_ELDER:[()=>FAM_ELDER,v=>{FAM_ELDER=v},dzP01],
  SWITCH_AGE:[()=>SWITCH_AGE,v=>{SWITCH_AGE=v.map(Math.round)},v=>dzPair(v)&&v[0]>=1&&v[1]<=110],
  SPEEDS:[()=>SPEEDS.map(s=>s[0]),v=>v.forEach((ms,i)=>{SPEEDS[i][0]=ms}),v=>dzArr(v,SPEEDS.length)&&v.every(x=>x>=200&&x<=600000)],
  AB_RANGE:[()=>AB_RANGE,v=>dzSet(AB_RANGE,v.map(r=>r.slice())),v=>dzArr(v,4,r=>dzPair(r)&&r[0]>=0&&r[1]<=1000)],
  STAR_W_BIRTH:[()=>STAR_W_BIRTH,v=>dzSet(STAR_W_BIRTH,v),v=>dzArr(v,5)&&v.every(x=>x>=0)&&v.reduce((a,b)=>a+b,0)>0],
  STAR_W_ADULT:[()=>STAR_W_ADULT,v=>dzSet(STAR_W_ADULT,v),v=>dzArr(v,5)&&v.every(x=>x>=0)&&v.reduce((a,b)=>a+b,0)>0],
  STAR_MULT:[()=>STAR_MULT,v=>dzSet(STAR_MULT,v),v=>dzArr(v,5)&&v.every(x=>x>=0)],
  XP_POL:[()=>XP_POL,v=>{XP_POL=v},v=>dzNum(v)&&v>=0],
  XP_EV:[()=>XP_EV,v=>{XP_EV=v},v=>dzNum(v)&&v>=0],
  XP_NPC:[()=>XP_NPC,v=>{XP_NPC=v},v=>dzNum(v)&&v>=0],
  XP_UP:[()=>XP_UP,v=>dzSet(XP_UP,v),v=>dzArr(v,4)&&v.every(x=>x>0)],
  XP_DOWN:[()=>XP_DOWN,v=>dzSet(XP_DOWN,v),v=>dzArr(v,5)&&v.every(x=>x>=0)],
  XP_DECAY_ME:[()=>XP_DECAY_ME,v=>{XP_DECAY_ME=v},v=>dzNum(v)&&v>=0],
  XP_DECAY_NPC:[()=>XP_DECAY_NPC,v=>{XP_DECAY_NPC=v},v=>dzNum(v)&&v>=0],
  POLICIES:[()=>POLICIES,v=>{for(const k in v)POLICIES[k]=v[k].slice()},v=>dzObj(v,POLICIES,x=>dzArr(x,4))],
  EV_BAND:[()=>EV_BAND,v=>{for(const k in v)EV_BAND[k]=v[k].slice()},v=>dzObj(v,EV_BAND,x=>dzPair(x)&&x[0]>=0)],
  EV_MAP:[()=>EV_MAP,v=>{for(const k in v)Object.assign(EV_MAP[k],v[k])},v=>dzObj(v,EV_MAP,x=>dzObj(x,EV_MAP.a,y=>dzNum(y)&&y>=0))],
  EV_FOL:[()=>EV_FOL,v=>dzSet(EV_FOL,v),v=>dzPair(v)&&v[0]>=1],
  EV_NPC_MAX:[()=>EV_NPC_MAX,v=>{EV_NPC_MAX=Math.round(v)},v=>dzNum(v)&&v>=8&&v<=40],
  EV_CD:[()=>EV_CD,v=>{EV_CD=v},v=>dzNum(v)&&v>=0],
  EV_D_AFF:[()=>EV_D_AFF,v=>{EV_D_AFF=v},v=>dzNum(v)&&v>=0&&v<=100],
  EV_P0:[()=>EV_P0,v=>{EV_P0=v},dzP01],
  ST_FREE:[()=>ST_FREE,v=>{ST_FREE=v},v=>dzNum(v)&&v>=1],
  ST_INIT:[()=>ST_INIT,v=>Object.assign(ST_INIT,v),v=>dzObj(v,ST_INIT,x=>dzNum(x)&&x>=0)],
  ST_INC:[()=>ST_INC,v=>{ST_INC=v},v=>dzNum(v)&&v>=0],
  ST_LIV:[()=>ST_LIV,v=>{ST_LIV=v},v=>dzNum(v)&&v>=0],
  ST_FIN:[()=>ST_FIN,v=>{ST_FIN=v},v=>dzNum(v)&&v>=0],
  ST_FOUT:[()=>ST_FOUT,v=>{ST_FOUT=v},v=>dzNum(v)&&v>=0],
  ST_BMAX:[()=>ST_BMAX,v=>{ST_BMAX=v},v=>dzNum(v)&&v>=0],
  ST_HNEED2:[()=>ST_HNEED2,v=>Object.assign(ST_HNEED2,v),v=>dzObj(v,ST_HNEED2,x=>dzNum(x)&&x>=1)],
  RANDW:[()=>RANDW,v=>Object.assign(RANDW,v),v=>dzObj(v,RANDW,x=>dzNum(x)&&x>=0)],
  NAMEP:[()=>NAMEP,v=>{for(const k in v){if(k==='n')NAMEP.n=v.n.slice();else NAMEP[k]={m:v[k].m.slice(),f:v[k].f.slice()}}},
    v=>!!v&&typeof v==='object'&&Object.keys(v).every(k=>k==='n'?dzArr(v.n,v.n.length,dzStr)&&v.n.length>0:(k in NAMEP)&&v[k]&&dzArr(v[k].m,v[k].m.length,dzStr)&&dzArr(v[k].f,v[k].f.length,dzStr)&&v[k].m.length>0&&v[k].f.length>0)]
};
/* 境遇ごとの項目：名前 → [読み出し, 書き込み, 形の検査]。周りの人は4人のまま（出来事が人物の番号で参照するため、増減はしない） */
const DESIGN_PF={
  label:[k=>PERSONAS[k].label,(k,v)=>{PERSONAS[k].label=v},dzStr],
  name:[k=>PERSONAS[k].name,(k,v)=>{PERSONAS[k].name=v},dzStr],
  kid:[k=>PERSONAS[k].kid||'',(k,v)=>{PERSONAS[k].kid=v||undefined},v=>v===''||dzStr(v)],
  place:[k=>PERSONAS[k].place,(k,v)=>{PERSONAS[k].place=v},dzStr],
  yr:[k=>PERSONAS[k].yr,(k,v)=>{PERSONAS[k].yr=v.map(Math.round)},v=>dzArr(v,2)&&v[0]>=1&&v[0]<v[1]&&v[1]<=2001],
  ns:[k=>PERSONAS[k].ns,(k,v)=>{PERSONAS[k].ns=v},v=>typeof v==='string'&&v!=='n'&&v in NAMEP],
  stats:[k=>PERSONAS[k].stats,(k,v)=>{PERSONAS[k].stats=v.slice()},v=>dzArr(v,4)&&v.every(x=>x>=0&&x<=1000)],
  skillName:[k=>PERSONAS[k].skillName,(k,v)=>{PERSONAS[k].skillName=v},dzStr],
  randw:[k=>RANDW[k]||0,(k,v)=>{RANDW[k]=v},v=>dzNum(v)&&v>=0],
  npc:[k=>PERSONAS[k].npc,(k,v)=>{PERSONAS[k].npc=v.map(r=>r.slice())},
    v=>dzArr(v,4,r=>Array.isArray(r)&&r.length===4&&dzStr(r[0])&&dzStr(r[1])&&dzNum(r[2])&&r[2]>=0&&r[2]<=100&&(r[3]===null||dzNum(r[3])&&r[3]>=0))],
  famneed:[k=>FAMNEED[k],(k,v)=>{FAMNEED[k]=v.slice()},v=>Array.isArray(v)&&v.length>=1&&v.length<=2&&v.every(x=>x==='母'||x==='父')&&new Set(v).size===v.length],
  npcoff:[k=>NPCOFF[k],(k,v)=>{NPCOFF[k]=v.slice()},v=>dzArr(v,4)&&v.every(x=>x>=-20&&x<=80)],   // 境遇ごとに別の配列にする（共有を切る）
  npcsk:[k=>NPCSK[k],(k,v)=>{NPCSK[k]=v.slice()},v=>dzArr(v,4)&&v.every(x=>x>=0&&x<=1000)],
  npcskn:[k=>NPCSKN[k],(k,v)=>{NPCSKN[k]=v.slice()},v=>dzArr(v,4,dzStr)]
};
function designSnapshot(){
  const vars={},personas={};
  for(const n in DESIGN_VARS)vars[n]=dzCopy(DESIGN_VARS[n][0]());
  for(const k in PERSONAS){const o={};for(const f in DESIGN_PF)o[f]=dzCopy(DESIGN_PF[f][0](k));personas[k]=o}
  return {v:DESIGN_VER,vars,personas};
}
function designApply(d){
  const err=[];let n=0;
  if(!d||typeof d!=='object'){err.push('設計データの形が違います');return {n,err}}
  if(d.v!==DESIGN_VER)err.push(`設計データの版が違います（${d.v}）。読める項目だけ使います`);
  const vars=d.vars&&typeof d.vars==='object'?d.vars:{};
  for(const name in vars){
    const h=DESIGN_VARS[name];
    if(!h){err.push(`知らない項目：${name}`);continue}
    if(!h[2](vars[name])){err.push(`形が合わないので使いません：${name}`);continue}
    try{h[1](dzCopy(vars[name]));n++}catch(e){err.push(`${name}：${e.message}`)}
  }
  const ps=d.personas&&typeof d.personas==='object'?d.personas:{};
  for(const k in ps){
    if(!Object.prototype.hasOwnProperty.call(PERSONAS,k)){err.push(`知らない境遇：${k}`);continue}
    for(const f in ps[k]){
      const h=DESIGN_PF[f];
      if(!h){err.push(`知らない項目：${k}.${f}`);continue}
      if(!h[2](ps[k][f])){err.push(`形が合わないので使いません：${k}.${f}`);continue}
      try{h[1](k,dzCopy(ps[k][f]));n++}catch(e){err.push(`${k}.${f}：${e.message}`)}
    }
  }
  return {n,err};
}
/* 設計ツールの「まとめて試す」：人生を何回も流して結果をまとめる（設計ツールの見えない試遊画面の中だけで使う。画面の描画は止める） */
const dzSim={
  start(n){
    render=()=>{};openResult=()=>{};showFx=()=>{};evClose=()=>{};syncEvent=()=>{};saveArmed=false;
    this.n=n;this.i=0;this.r={lives:0,ages:[],causes:{},at30:[0,0,0,0],n30:0,sib:0,miss:0,dec:0,small:0,sw:{},errors:[],ms:0};
  },
  step(k){                                    // k 人ぶん進めて、進み具合（0〜1）を返す
    const t0=performance.now(),r=this.r,pols=Object.keys(POLICIES);
    for(let c=0;c<k&&this.i<this.n;c++,this.i++){
      try{
        const b=randomBirth();newGame(b.pid,b.year);S.policy=pols[rnd(pols.length)];
        r.sib+=S.npc.filter(x=>/兄|姉|弟|妹/.test(x.role||'')).length;
        if(S.npc.some(x=>x.role==='祖母'))r.miss++;
        r.sw[S.switchAge]=(r.sw[S.switchAge]||0)+1;
        let g=0,got30=false;
        while(!S.dead&&g++<4000){
          if(S.decision){const d=S.decision,ok=d.opts.map((o,i)=>stPreWhy(o)?-1:i).filter(i=>i>=0);if(!ok.length)break;
            if(d.ev&&EV_BY_ID[d.ev]&&EV_BY_ID[d.ev].k==='s')r.small++;else r.dec++;
            choose(ok[rnd(ok.length)]);continue}
          if(g%7===0)S.policy=pols[rnd(pols.length)];
          (S.ths||[]).filter(t=>t.st==='本人確認待ち').forEach(t=>{if(Math.random()<0.6)stConfirm(t.id,Math.random()<0.7)});
          slots=rollSlots();flushSlots();tick();
          if(!got30&&S.age>=30&&!S.dead){got30=true;r.n30++;S.stats.forEach((v,i)=>{r.at30[i]+=v})}
        }
        r.lives++;r.ages.push(S.age);const cs=String(S.cause||'不明');r.causes[cs]=(r.causes[cs]||0)+1;
      }catch(e){if(r.errors.length<10)r.errors.push(String(e&&e.message||e))}
    }
    r.ms+=performance.now()-t0;
    return this.i/this.n;
  },
  result(){
    const r=this.r,births={};
    for(let i=0;i<3000;i++){const b=randomBirth();births[b.pid]=(births[b.pid]||0)+1}
    return {...r,at30:r.at30.map(v=>r.n30?Math.round(v/r.n30):0),births};
  }
};
window.KYOTO_DESIGN={version:DESIGN_VER,defaults:designSnapshot(),applied:0,errors:[],snapshot:designSnapshot,sim:dzSim,
  meta:{rels:Object.keys(REL),nameSets:Object.keys(NAMEP).filter(k=>k!=='n'),policies:Object.keys(POLICIES),
    base:Object.fromEntries(NEWP.map(r=>[r[0],r[1]])),stats:STAT.map(s=>s[0])}};
if(window.__KYOTO_DESIGN__){
  const r=designApply(window.__KYOTO_DESIGN__);
  window.KYOTO_DESIGN.applied=r.n;window.KYOTO_DESIGN.errors=r.err;
  if(r.err.length)console.warn('設計データ：',r.err);
}
