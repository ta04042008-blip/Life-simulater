// 01b-mortality.js — 年齢別の年間死亡確率 q(x,年) と、3か月ごとの死亡判定の確率（単位4）
/* 区分の見方
   【史実統計】1947〜2024年：JMD 期間生命表の各歳 qx をそのまま使う（01a-mortality-data.js）。2025年以降は2024年の表のまま（ゲーム内推定）。
   【暫定推定】1946年以前：各歳の資料が未取得のため、1947年の年齢の形を倍率で伸縮し、下の MORT_ANCHORS の「平均寿命」と「0歳の死亡確率」に合わせて作る。
       1891〜1946年のアンカーは公式生命表(男女平均)・乳児死亡率の値。1603〜1890年・1602年以前のアンカーは学術推定の幅に基づく【ゲーム仮定】で、利用者の承認待ち。
   【暫定推定】乳児期(0歳)の年内の配分：形はゲーム仮定、全体の平均死亡時点(ax0)は JMD の実データ(1947〜)。
   死亡は「全死因の年間死亡確率」を基準にする（A案）。体力・病気の個人差は、母集団で平均1になるよう正規化した相対リスクで掛け、事故は別枠で足さない。 */
const MORT_ANCHORS=[ // [年, 平均寿命e0, 0歳の死亡確率q0, 区分]
  [1,    27,   0.24, 'ゲーム仮定(古代〜中世・暫定)'],
  [1602, 28,   0.23, 'ゲーム仮定(古代〜中世・暫定)'],
  [1603, 32,   0.20, 'ゲーム仮定(江戸前期・暫定／学術推定30台前半〜後半の幅)'],
  [1800, 35,   0.18, 'ゲーム仮定(江戸後期・暫定／宗門人別帳の村落研究 36前後)'],
  [1890, 40,   0.16, 'ゲーム仮定(明治前半・暫定)'],
  [1894.5,43.55,0.145,'公式生命表1891-98 e0 男42.8/女44.3 平均, q0=男0.149'],
  [1901, 44.4, 0.154, '公式生命表1899-1903 e0 男43.97/女44.85 平均, 乳児死亡率1899=153.8‰'],
  [1911, 44.49,0.160, '公式生命表1909-13 e0 男44.25/女44.73 平均, q0は1899と1920の間を補間(暫定)'],
  [1920, 42.6, 0.1657,'公式生命表1921-25 e0 男42.06/女43.20 平均, 乳児死亡率1920=165.7‰'],
  [1928, 45.68,0.130, '公式生命表1926-30 e0 男44.82/女46.54 平均, 乳児死亡率1930=124.1‰付近(補間)'],
  [1935.5,48.28,0.124,'公式生命表1935-36 e0 男46.92/女49.63 平均, 乳児死亡率1930=124.1‰'],
];
const MORT_AX0_PROV=0.30;       // 1946年以前の0歳 ax（暫定。1947年の実データは0.29）
const MORT_CACHE={};
function mortAnchorAt(y){
  const A=MORT_ANCHORS;
  if(y<=A[0][0])return {e0:A[0][1],q0:A[0][2]};
  for(let i=1;i<A.length;i++)if(y<=A[i][0]){const a=A[i-1],b=A[i],t=(y-a[0])/(b[0]-a[0]);return {e0:a[1]+(b[1]-a[1])*t,q0:a[2]+(b[2]-a[2])*t}}
  // 1935.5年〜1947年：最後のアンカーから1947年の実データへ直線で結ぶ（戦時の悪化は表さない＝既知の限界）
  const l=A[A.length-1],t=(y-l[0])/(JMD_Y0-l[0]);
  return {e0:l[1]+(JMD_E0[0]-l[1])*t,q0:l[2]+(JMD_Q[0][0]-l[2])*t};
}
function mortE0(q,ax0,mx110){           // q: 0..109歳の qx。1〜109歳の ax=0.5、110歳以上は一定の死亡率 mx110
  let l=1,T=0;
  for(let x=0;x<110;x++){const a=x===0?ax0:0.5,d=l*q[x];T+=l-d*(1-a);l-=d}
  return T+l/mx110;
}
function mortSynth(year){               // 1946年以前の暫定表
  const A=mortAnchorAt(year),base=JMD_Q[0],mx=JMD_MX110[0];
  const mk=k=>{const q=new Array(110);q[0]=A.q0;for(let x=1;x<110;x++)q[x]=Math.min(0.999,base[x]*k);return q};
  let lo=0.05,hi=200;
  for(let i=0;i<60;i++){const m=Math.sqrt(lo*hi);if(mortE0(mk(m),MORT_AX0_PROV,mx)>A.e0)lo=m;else hi=m}
  return {q:mk(Math.sqrt(lo*hi)),ax0:MORT_AX0_PROV,mx110:mx,src:'暫定推定',e0:A.e0};
}
function mortTable(year){
  const y=Math.max(1,Math.min(JMD_Y1,Math.round(year)));   // 2025年以降は2024年の表のまま
  if(MORT_CACHE[y])return MORT_CACHE[y];
  const t=y>=JMD_Y0?{q:JMD_Q[y-JMD_Y0],ax0:JMD_AX0[y-JMD_Y0],mx110:JMD_MX110[y-JMD_Y0],src:'JMD実データ',e0:JMD_E0[y-JMD_Y0]}:mortSynth(y);
  return MORT_CACHE[y]=t;
}
function mortQ(age,year){               // 年齢 age の年間死亡確率（全死因）。110歳以上は110+の死亡率を一定とした延長（推定・強制死亡ではない）
  const t=mortTable(year);
  return age<110?t.q[age]:1-Math.exp(-t.mx110);
}
/* 0歳の3か月ごとの配分（暫定推定）：第1四半期の死亡の平均時点＝0.06年、第2〜4四半期は 5:3:2 の割合。
   0歳の ax0（実データ）に平均死亡時点が合うように第1四半期の割合 s1 を決める。4回の判定を通した生存は必ず 1−q0 になる。 */
function mortInfantShares(ax0){
  const s1=clamp((0.55-ax0)/0.49,0.3,0.95);   // 0.55＝第2〜4四半期の死亡の平均時点
  return [s1,(1-s1)*0.5,(1-s1)*0.3,(1-s1)*0.2];
}
function mortQuarterP(q,shares,k){      // 年間確率 q と配分から、第k四半期(0〜3)の条件付き死亡確率
  let used=0;for(let i=0;i<k;i++)used+=q*shares[i];
  return q*shares[k]/(1-used);
}
/* 病気の平均的な影響の正規化（二重計上の防止）：ゲームの病気は確率 pill で起き、平均 dur 四半期続く。
   基準の死亡確率は病気の人も含めた平均なので、病気でない人は少し低く、病気の人は倍率ぶん高くなるように割り戻す。 */
function mortIllW(age){return age<13?0.4:1}   // 子どもは病気の倍率が効きにくい（従来の設計を引き継いだ仮の数値）
function mortIllMean(age,ad){
  const pill=(0.05+age/1500)*(ad?0.75:1)*(age<6?1.6:1),s=0.05+age/1200,dur=ad?4:1.5;
  const f=pill*dur/(1+pill*dur),mbar=(1-s)*HZ.illMult+s*HZ.sevMult;
  return 1+f*(mbar-1)*mortIllW(age);
}
const MORT_ACC_SHARE=a=>a<1?0.02:a<40?0.25:a<65?0.05:0.02;   // 死因の表示用の事故の割合（ゲーム仮定。死亡の合計には影響しない）
/* 1回(3か月)の判定に使う「年あたりの等価ハザード」を返す。確率は 1−exp(−tot×0.25)。
   age: その3か月を生きた年齢, year: その暦年, v: 体力, ill: 病気の最中なら S.ongoing, qi: 0歳のとき何番目の四半期か */
/* 体力の補正の割り戻し（二重計上の防止）：体力が低めの人ほど死亡確率が上がる式 mb をそのまま掛けると、ゲーム内の人々の体力が平均的に低めのため
   全体の死亡が基準より増えてしまう。年齢ごとの「標準的な遊び方での mb の平均」で割って、平均が1になるようにする。
   この平均は、人生を常に最初の選択肢で進めたシミュレーション(各80人)の実測値の【暫定校正】。校正式・係数は検証後に利用者が決める。 */
const MORT_STAM_REF={
  player:[[13,1.25],[20,1.40],[30,1.62],[40,1.79],[50,1.95],[60,2.07],[70,2.17],[80,2.23],[90,2.24]],
  npc:[[13,1.08],[20,1.05],[30,1.03],[40,1.03],[50,1.06],[60,1.13],[70,1.26],[80,1.45],[90,1.68],[100,1.96],[110,2.2],[120,2.25]]};
function mortStamRef(age,kind){
  const T=MORT_STAM_REF[kind==='npc'?'npc':'player'];
  if(age<=T[0][0])return T[0][1];
  for(let i=1;i<T.length;i++)if(age<=T[i][0]){const a=T[i-1],b=T[i];return a[1]+(b[1]-a[1])*(age-a[0])/(b[0]-a[0])}
  return T[T.length-1][1];
}
function mortHazard(age,year,v,ill,qi,kind){
  const q=mortQ(age,year),t=mortTable(year);
  let mu;                                                   // 基準の死亡力（年あたり）
  if(age===0&&qi!=null&&qi>=0&&qi<4){const p=mortQuarterP(q,mortInfantShares(t.ax0),qi);mu=-Math.log(1-Math.min(p,0.999999))/0.25}
  else mu=-Math.log(Math.max(1e-12,1-q));
  mu*=HZ.scale;
  const mb=age<13?1:clamp(1+(500-v)/400,0.6,3)/mortStamRef(age,kind);     // 体力（子どもには効かせない。平均1に割り戻す）
  const mi=ill?ill.mult:1,w=mortIllW(age),ad=age>=(typeof TIME!=='undefined'?TIME.ADULT_FROM:18);
  const norm=mortIllMean(age,ad);
  const noIll=mu*mb/norm,tot=mu*mb*(1+(mi-1)*w)/norm;
  const acc=noIll*MORT_ACC_SHARE(age);
  return {q,mu,mb,mi,norm,acc,base:noIll-acc,ill:tot-noIll,tot};
}
