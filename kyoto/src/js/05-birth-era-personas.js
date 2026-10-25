// 05-birth-era-personas.js — 生まれ年と時代の判定、新しい13の境遇、ランダム出生
/* ---------- 生まれ年と時代／新しい境遇（背景は既存のものとは別・文章と絵は近い境遇のものを流用） ---------- */
/* 元号：近代は改元日で正確に判定する（年の途中で変わる年は両方を表示）。1868年の改元(9/8)は江戸→明治の区分として年単位で扱う（従来どおり）。
   史実の改元日：明治→大正 1912-07-30 ／ 大正→昭和 1926-12-25 ／ 昭和→平成 1989-01-08 ／ 平成→令和 2019-05-01 */
const ERA_CHANGES=[[1912,7,30,'明治','大正'],[1926,12,25,'大正','昭和'],[1989,1,8,'昭和','平成'],[2019,5,1,'平成','令和']];
function eraAt(y,m,d){                                    // 西暦の年月日の元号（近代のみ）。m,d を省くとその年の1月1日
  const dm=(m||1)*100+(d||1);let e=y<1912?'明治':y<1926?'大正':y<1989?'昭和':y<2019?'平成':'令和';
  for(const [cy,cm,cd,a,b] of ERA_CHANGES){if(y===cy)e=dm>=cm*100+cd?b:a}
  return e;
}
function eraName(y){
  if(y<1868){return y<794?'古代':y<1185?'平安':y<1333?'鎌倉':y<1573?'室町':y<1603?'安土桃山':'江戸'}
  const ch=ERA_CHANGES.find(c=>c[0]===y);if(ch)return ch[3]+'／'+ch[4];     // 改元の年は両方（例：1912年＝明治／大正、2019年＝平成／令和）
  return eraAt(y);
}
const eraText=(y)=>`${eraName(y)}（${y}年頃）`;
PERSONAS.aristocrat.yr=[1,1185];PERSONAS.common.yr=[1,1185];PERSONAS.farm.yr=[1,1185];PERSONAS.artisan.yr=[1185,1603];
PERSONAS.aristocrat.ns='noble';PERSONAS.common.ns='heian';PERSONAS.farm.ns='heian';PERSONAS.artisan.ns='muro';
RANDW.aristocrat=5;RANDW.common=45;RANDW.farm=35;RANDW.artisan=50;                  // ランダムの重み：同じ時代の中で（仮）
const NEWBG={"mer_m": {"spring": "@@ASSET:backgrounds/mer_m_spring.png@@", "summer": "@@ASSET:backgrounds/mer_m_summer.png@@", "autumn": "@@ASSET:backgrounds/mer_m_autumn.png@@", "winter": "@@ASSET:backgrounds/mer_m_winter.png@@"}, "edo_farm": {"spring": "@@ASSET:backgrounds/edo_farm_spring.png@@", "summer": "@@ASSET:backgrounds/edo_farm_summer.png@@", "autumn": "@@ASSET:backgrounds/edo_farm_autumn.png@@", "winter": "@@ASSET:backgrounds/edo_farm_winter.png@@"}, "edo_machiya": {"spring": "@@ASSET:backgrounds/edo_machiya_spring.png@@", "summer": "@@ASSET:backgrounds/edo_machiya_summer.png@@", "autumn": "@@ASSET:backgrounds/edo_machiya_autumn.png@@", "winter": "@@ASSET:backgrounds/edo_machiya_winter.png@@"}, "edo_shop": {"spring": "@@ASSET:backgrounds/edo_shop_spring.png@@", "summer": "@@ASSET:backgrounds/edo_shop_summer.png@@", "autumn": "@@ASSET:backgrounds/edo_shop_autumn.png@@", "winter": "@@ASSET:backgrounds/edo_shop_winter.png@@"}, "edo_nagaya": {"spring": "@@ASSET:backgrounds/edo_nagaya_spring.png@@", "summer": "@@ASSET:backgrounds/edo_nagaya_summer.png@@", "autumn": "@@ASSET:backgrounds/edo_nagaya_autumn.png@@", "winter": "@@ASSET:backgrounds/edo_nagaya_winter.png@@"}, "sh_rent": {"spring": "@@ASSET:backgrounds/sh_rent_spring.png@@", "summer": "@@ASSET:backgrounds/sh_rent_summer.png@@", "autumn": "@@ASSET:backgrounds/sh_rent_autumn.png@@", "winter": "@@ASSET:backgrounds/sh_rent_winter.png@@"}, "sh_sal": {"spring": "@@ASSET:backgrounds/sh_sal_spring.png@@", "summer": "@@ASSET:backgrounds/sh_sal_summer.png@@", "autumn": "@@ASSET:backgrounds/sh_sal_autumn.png@@", "winter": "@@ASSET:backgrounds/sh_sal_winter.png@@"}, "sh_rich": {"spring": "@@ASSET:backgrounds/sh_rich_spring.png@@", "summer": "@@ASSET:backgrounds/sh_rich_summer.png@@", "autumn": "@@ASSET:backgrounds/sh_rich_autumn.png@@", "winter": "@@ASSET:backgrounds/sh_rich_winter.png@@"}, "m70": {"spring": "@@ASSET:backgrounds/m70_spring.png@@", "summer": "@@ASSET:backgrounds/m70_summer.png@@", "autumn": "@@ASSET:backgrounds/m70_autumn.png@@", "winter": "@@ASSET:backgrounds/m70_winter.png@@"}, "m80a": {"spring": "@@ASSET:backgrounds/m80a_spring.png@@", "summer": "@@ASSET:backgrounds/m80a_summer.png@@", "autumn": "@@ASSET:backgrounds/m80a_autumn.png@@", "winter": "@@ASSET:backgrounds/m80a_winter.png@@"}, "m80d": {"spring": "@@ASSET:backgrounds/m80d_spring.png@@", "summer": "@@ASSET:backgrounds/m80d_summer.png@@", "autumn": "@@ASSET:backgrounds/m80d_autumn.png@@", "winter": "@@ASSET:backgrounds/m80d_winter.png@@"}, "m90c": {"spring": "@@ASSET:backgrounds/m90c_spring.png@@", "summer": "@@ASSET:backgrounds/m90c_summer.png@@", "autumn": "@@ASSET:backgrounds/m90c_autumn.png@@", "winter": "@@ASSET:backgrounds/m90c_winter.png@@"}, "m90w": {"spring": "@@ASSET:backgrounds/m90w_spring.png@@", "summer": "@@ASSET:backgrounds/m90w_summer.png@@", "autumn": "@@ASSET:backgrounds/m90w_autumn.png@@", "winter": "@@ASSET:backgrounds/m90w_winter.png@@"}};
const NEWP2=[   // 単位3：1901〜1925年と2000〜2025年の正式な境遇（根拠は docs/v17-records/unit3_sources.md）。絵と背景は近い境遇のものを流用
 ['tai_machiya','artisan','町家（職人・小商い／明治末〜大正）','奉公人','京都・町家',[1901,1926],'mt',[560,400,540,400],'家業の技',[['親方','師',50],['兄弟子','仲間',32],['隣の店の人','近所',9],['出入りの商人','取引',5]],0,'edo_machiya'],
 ['tai_factory','common','職工の家（長屋／明治末〜大正）','若者','京都・長屋',[1901,1926],'mt',[560,300,500,380],'工場の技',[['母','家族',55],['大家','近所',30],['工場の人','取引',6],['同じ年頃の子','友人',18]],0,'edo_nagaya'],
 ['tai_farm','farm','農家（明治末〜大正）','若者','京都近郊・農家',[1901,1926],'mt',[620,240,520,340],'農の技',[['父','家族',58],['隣の畑の人','近所',28],['村の世話役','取引',7],['幼なじみ','友人',20]],0,'edo_farm'],
 ['tai_sal','common','勤め人の家（明治末〜大正）','若者','京都・市内の借家',[1901,1926],'mt',[540,520,520,460],'勤めの技',[['母','家族',55],['隣の家の人','近所',30],['近所の店の人','取引',6],['同級生','友人',18]],0,'sh_sal'],
 ['r_house','common','一戸建て・標準的な家計（2000年代〜）','若者','京都・住宅地',[2000,2026],'y2000',[540,520,520,480],'勤めの技',[['母','家族',55],['隣の家の人','近所',30],['近所の店の人','取引',6],['同級生','友人',18]],0,'m70'],
 ['r_mansion','common','マンション・標準的な家計（2000年代〜）','若者','京都・マンション',[2000,2026],'y2000',[540,540,520,500],'勤めの技',[['母','家族',55],['同じ階の人','近所',30],['近所の店の人','取引',6],['同級生','友人',18]],0,'m90c'],
 ['r_apart','common','賃貸アパート・標準的な家計（2000年代〜）','若者','京都・アパート',[2000,2026],'y2000',[540,480,520,440],'家の仕事',[['母','家族',55],['大家','近所',30],['近所の店の人','取引',6],['同級生','友人',18]],0,'m80a'],
 ['r_house_rich','common','一戸建て・裕福な家計（2000年代〜）','若者','京都・邸宅',[2000,2026],'y2000',[520,640,500,600],'教養',[['母','家族',60],['隣家の人','近所',30],['出入りの業者','取引',6],['同級生','友人',18]],0,'m90w'],
 ['r_mansion_rich','common','マンション・裕福な家計（2000年代〜）','若者','京都・マンション',[2000,2026],'y2000',[520,640,500,600],'教養',[['母','家族',60],['同じ階の人','近所',30],['出入りの業者','取引',6],['同級生','友人',18]],0,'m90w'],
 ['r_apart_rich','common','賃貸アパート・裕福な家計（2000年代〜）','若者','京都・アパート',[2000,2026],'y2000',[520,600,500,560],'教養',[['母','家族',60],['大家','近所',30],['出入りの業者','取引',6],['同級生','友人',18]],0,'m90w']
];
const NEWP=[
 ['mer_m','artisan','商人（標準）','丁稚','京都・町の店',[1185,1603],'muro',[560,460,560,480],'商い',[['番頭','師',50],['同じ年頃の丁稚','仲間',32],['隣の店の人','近所',9],['取引先の人','取引',5]],50],
 ['edo_farm','farm','農家（標準）','若者','京都近郊・農家',[1603,1901],'edo',[620,240,520,340],'農の技',[['父','家族',58],['隣の畑の人','近所',28],['庄屋の使い','取引',7],['幼なじみ','友人',20]],35],
 ['edo_machiya','artisan','町家（職人・小商い）','奉公人','京都・町家',[1603,1901],'edo',[560,400,540,400],'家業の技',[['親方','師',50],['兄弟子','仲間',32],['隣の店の人','近所',9],['出入りの商人','取引',5]],25],
 ['edo_shop','artisan','商家（裕福）','若旦那','京都・大店',[1603,1901],'edo',[540,560,520,560],'商い',[['番頭','師',50],['手代','仲間',32],['隣の店の人','近所',9],['取引先の人','取引',5]],15],
 ['edo_nagaya','common','長屋の暮らし','若者','京都・長屋',[1603,1901],'edo',[560,300,500,380],'日雇いの技',[['母','家族',55],['大家','近所',30],['棒手振り','取引',6],['同じ年頃の子','友人',18]],25],
 ['sh_rent','common','借家の暮らし','若者','京都・町の借家',[1926,1970],'showa',[560,380,520,400],'家の仕事',[['母','家族',55],['大家','近所',30],['商店街の人','取引',6],['同級生','友人',18]],0],
 ['sh_sal','common','勤め人の家','若者','京都・郊外の家',[1926,1970],'showa',[540,520,520,460],'勤めの技',[['母','家族',55],['隣の家の人','近所',30],['近所の店の人','取引',6],['同級生','友人',18]],0],
 ['sh_rich','common','裕福な家（昭和）','坊ちゃん','京都・邸宅',[1926,1970],'showa',[520,640,480,600],'教養',[['母','家族',60],['隣家の人','近所',30],['出入りの商人','取引',6],['同級生','友人',18]],0],
 ['m70','common','一戸建ての家','若者','京都・住宅地',[1970,1980],'mod',[540,520,520,480],'勤めの技',[['母','家族',55],['隣の家の人','近所',30],['近所の店の人','取引',6],['同級生','友人',18]],0],
 ['m80a','common','アパート暮らし','若者','京都・アパート',[1980,1990],'mod',[540,480,520,440],'家の仕事',[['母','家族',55],['大家','近所',30],['近所の店の人','取引',6],['同級生','友人',18]],0],
 ['m80d','common','団地暮らし','若者','京都・団地',[1980,1990],'mod',[540,500,520,460],'勤めの技',[['母','家族',55],['同じ棟の人','近所',30],['団地の店の人','取引',6],['同級生','友人',18]],0],
 ['m90c','common','マンション暮らし','若者','京都・マンション',[1990,2000],'mod',[540,540,520,500],'勤めの技',[['母','家族',55],['同じ階の人','近所',30],['近所の店の人','取引',6],['同級生','友人',18]],0],
 ['m90w','common','裕福な家（1990年代）','若者','京都・邸宅',[1990,2000],'mod',[520,640,500,600],'教養',[['母','家族',60],['隣家の人','近所',30],['出入りの業者','取引',6],['同級生','友人',18]],0]
];
NEWP.concat(NEWP2).forEach(([k,b,label,name,place,yr,ns,stats,skill,npc,rw,bgFrom])=>{
  const B=PERSONAS[b];
  PERSONAS[k]={...B,label,name,kid:undefined,place,yr,ns,year:yr[0],stats,skillName:skill,
    npc:npc.map((n,i)=>[n[0],n[1],n[2],B.npc[i][3]])};
  BG[k]=NEWBG[k]||NEWBG[bgFrom]||BG[b];SPR.body[k]=SPR.body[b];SPR.hair[k]=SPR.hair[b];SPR.hairGray[k]=SPR.hairGray[b];
  NPCOFF[k]=NPCOFF[b];NPCSK[k]=NPCSK[b];NPCSKN[k]=NPCSKN[b];FAMNEED[k]=FAMNEED[b];LEARN[k]=LEARN[b];
  if(rw)RANDW[k]=rw;
  if(yr[0]===2000&&yr[1]===2026)PERSONAS[k].nsFrom=[2019,'reiwa'];     // 2019年以降に生まれる人（本人・家族）の名前は令和の型
});
/* 抽選の重み（C案：当時の社会構造・生活水準の資料を基準にし、多様性補正の最低保証を付ける。等確率を最終仕様にしない）
   重みは次の表1か所で管理する。status：'統計'＝資料で確認した値から算出／'仮'＝資料が不足するためゲーム仮定（利用者の判断・追加調査で置き換える）。
   住居の形態と家庭の経済状況は別項目（HOUSING_2023 と ECON）で、2000〜2025年の重みは「住居の割合×経済状況の割合」で作る。 */
const BIRTH_FLOOR=1;                      // 多様性補正：どの境遇も最低この重み（全体100あたり）を持つ
/* 京都市「令和5年住宅・土地統計調査」(2023)：総世帯731,200のうち 一戸建て316,600／長屋建て14,200／共同住宅399,700（持ち家52.2%・借家40.7%）。
   共同住宅を分譲マンションと賃貸アパートに分ける割合の資料は未確認のため 50:50 を【仮】とする。2000〜2022年にも同じ割合を【仮】で当てる */
const HOUSING_N=316600+14200+399700;       // 建て方3区分の合計（730,500。総世帯731,200との差0.1%は「その他」として除く）
const HOUSING_2023={house:(316600+14200)/HOUSING_N*100,mansion:399700/HOUSING_N*100/2,apart:399700/HOUSING_N*100/2};
const ECON={standard:90,rich:10};         // 家庭の経済状況の割合：資料未確認の【仮】
const BIRTH_W_TABLE={                      // [重み, status, 根拠]
  tai_machiya:[30,'仮','1920年全国の産業別就業者(第1次54.9/第2次20.9/第3次24.2%)を参考に、京都市の都市部を考えた粗い見積り。京都市の職業構成は未確認'],
  tai_factory:[25,'仮','1920年全国の産業別就業者を参考にした仮置き（第2次産業。西陣織などの工場労働を想定）'],
  tai_farm:[20,'仮','1920年全国の産業別就業者を参考にした仮置き（京都市は都市部のため第1次産業比率より低く見積もった）'],
  tai_sal:[15,'仮','1920年全国の産業別就業者を参考にした仮置き（官吏・会社員。新中間層）'],
  sh_rent:[10,'仮','1926〜1969年の住居・職業の資料は未確認。等重みの暫定'],sh_sal:[10,'仮','1926〜1969年の住居・職業の資料は未確認。等重みの暫定'],sh_rich:[10,'仮','1926〜1969年の住居・職業の資料は未確認。等重みの暫定'],
  m70:[10,'仮','1970年代の資料は未確認。等重みの暫定'],
  m80a:[10,'仮','1980年代の資料は未確認。等重みの暫定'],m80d:[10,'仮','1980年代の資料は未確認。等重みの暫定'],
  m90c:[10,'仮','1990年代の資料は未確認。等重みの暫定'],m90w:[10,'仮','1990年代の資料は未確認。等重みの暫定']
};
[['house','r_house'],['mansion','r_mansion'],['apart','r_apart']].forEach(([h,k])=>{
  BIRTH_W_TABLE[k]=[Math.max(BIRTH_FLOOR,+(HOUSING_2023[h]*ECON.standard/100).toFixed(2)),'仮',`住居(${h}):令和5年京都市住宅・土地統計調査${h==='house'?'(一戸建て+長屋)':'(共同住宅の50:50は仮)'}×経済状況(標準${ECON.standard}%は仮)`];
  BIRTH_W_TABLE[k+'_rich']=[Math.max(BIRTH_FLOOR,+(HOUSING_2023[h]*ECON.rich/100).toFixed(2)),'仮',`住居×経済状況(裕福${ECON.rich}%は仮)。最低保証${BIRTH_FLOOR}`];
});
const BIRTH_W_PROV=Object.fromEntries(Object.entries(BIRTH_W_TABLE).map(([k,v])=>[k,v[0]]));
Object.assign(RANDW,BIRTH_W_PROV);
function makeFamily(pid){
  const P=PERSONAS[pid],out=[];
  const mk=(name,aff,off,skill,from,fromText)=>({name:name,rel:'家族',aff,from,known:from===0,off,skill,skillName:P.skillName,dead:false,deadAge:null,hist:[],extra:{},fromText:fromText||null,...mkPerson(P,Math.max(0,off))});
  const need=FAMNEED[pid];let missing=0;
  need.forEach(r=>{
    if(rand()<FAM_MISS&&!(need.length===2&&missing===1)){missing++}
    else out.push(mk(r,r==='母'?58:52,r==='母'?26:30,400+rnd(250),0));
  });
  if(missing>0)out.push(mk('祖母',55,52,400+rnd(200),0));
  const r=rand(),cnt=r<FAM_SIB[0]/100?0:r<(FAM_SIB[0]+FAM_SIB[1])/100?1:2;
  const ELD=[['兄','姉'],['次兄','次姉']],YNG=[['弟','妹'],['末弟','末妹']];let e=0,y=0;
  for(let i=0;i<cnt;i++){
    if(rand()<FAM_ELDER)out.push(mk(ELD[e++][rnd(2)],35+rnd(20),2+rnd(5),100+rnd(150),0));
    else{const off=-(2+rnd(3));out.push(mk(YNG[y++][rnd(2)],42+rnd(14),off,40,-off,'が生まれた。'))}
  }
  return out;
}
function nameOf(){const P=PERSONAS[S.pid];if(S.myName)return S.myName;return S.age<13?(P.kid||'子'):S.age<30?P.name:S.age<60?'大人':'年長者'}
function dateLabel(){return S.mode==='q'?`${S.year}年${QL[S.q]}`:`${S.year}年`}
function newGame(pid,year){
  evHide();
  // 新しい人生は自分の乱数の種を持つ。作り終わるまでは前の人生の乱数に触れず、最後に状態を S.rs へ書く
  const sRS=RS,sL=RSL;if(!sL)RS=rngEntropy()|0;RSL=true;               // すでに種を決めた乱数の中（検査など）なら、その続きを使う
  try{newGameBody(pid,year);S.rs=RS>>>0;RSW=S.rs;RSL=sL}catch(e){RS=sRS;RSL=sL;throw e}
}
function newGameBody(pid,year){
  const P=PERSONAS[pid],me=mkPerson(P,0);
  if(year==null)year=P.yr[0]+rnd(P.yr[1]-P.yr[0]);      // 生まれ年：境遇の時代の中でランダム     // 出生時の能力・★・気質を、ここで一度だけ抽選する
  S={pid,ver:5,year,era:eraText(year),rs:0,rv:1,slots:null,q:0,age:0,t:0,mode:stepMonths(0)>=12?'y':'q',sm:stepMonths(0),switchAge:SWITCH_AGE[0]+rnd(SWITCH_AGE[1]-SWITCH_AGE[0]+1),policy:'交流',
     stats:me.stats,tgt:me.tgt,star:me.star,sx:me.sx,tm:me.tm,
     skill:0,
     npc:P.npc.map((n,i)=>({name:n[0],rel:n[1],aff:n[2],from:n[3],known:n[3]===0,off:NPCOFF[pid][i],skill:NPCSK[pid][i],skillName:NPCSKN[pid][i],dead:false,deadAge:null,hist:[],extra:{},...mkPerson(P,NPCOFF[pid][i])})),
     log:[],chron:[],pending:[],evSeen:{},ongoing:null,decision:null,decCount:0,nextDecT:13+rnd(3),nextSmallT:TIME.SMALL_FROM_AGE+rand()*2,smallLast:-1,dead:false,deathAge:null,cause:null,orphan:false};
  S.npc.push(...makeFamily(pid));
  nameNpcs(S);
  stNew(S);
  addLog('k',`${S.era}、${P.place}に生まれた。`,true);
  S.npc.forEach((n,i)=>{if(n.known&&n.rel==='家族')hist(i,'生まれたときから一緒にいる')});
}
function hist(k,text){const n=S.npc[k];if(!n)return;n.hist.unshift({ym:dateLabel(),age:S.age,x:text});if(n.hist.length>5)n.hist.pop()}
function npcAge(n){return n.dead?n.deadAge:S.age+n.off}
function addLog(t,x,main){
  const e={ym:dateLabel(),age:S.age,t,x};
  S.log.unshift(e);if(S.log.length>300)S.log.pop();
  if(main===undefined)main=(t!=='n');
  if(main)S.chron.push(e);
}
/* kind：'act'＝活動による成長（学習・運動・仕事など。プラスの分に★の倍率と「高いほど緩やか」を掛け、★の経験値も溜まる）／
   'rec'＝回復／'nat'＝年齢による自然な成長。rec・nat と、マイナスの変化には★を掛けない */
function applyFx(fx,np,kind,sc){
  let net=0;kind=kind||'act';
  if(fx)fx.forEach((d,i)=>{
    const o=S.stats[i];let g=d*(sc==null?3:sc);
    if(d>0&&kind==='act'){xpAdd(S,i,g*XP_EV);g=g*starMult(S.star[i])*SAT(o)}
    S.stats[i]=clamp(o+g+(d&&sc==null?rnd(3)-1:0),0,1000);const c=Math.round(S.stats[i]-o);net+=c;if(c)popQ.push([i,c])});
  starAll();
  const thr=8-(50-S.tm.v[4])/50*2.5;                      // 揺らぎ寄りほど、つらい出来事に早く反応する（見た目の反応だけ）
  if(net>=8)emo('self','joy');else if(net<=-thr)emo('self','sad');   /* 出来事の結果：能力の増減（仮の基準） */
  if(net<=-8)tmNudge(S.tm,4,-1,0.9,S.age,'つらい出来事');else if(net>=8)tmNudge(S.tm,4,1,0.5,S.age,'うまくいった出来事');
  if(np)for(const k in np){const n=S.npc[k];if(n&&!n.dead){n.aff=clamp(n.aff+np[k],0,100);if(np[k]>=3)emo('n'+k,'love');else if(np[k]<=-3)emo('n'+k,'anger')}}
}
function visible(n){return n.known&&!n.dead&&n.aff>=10}
