// 02-abilities-temperament.js — 人物の能力（4項目）・★・気質（5軸/32タイプ）・小さな選択・周りの人物の生成と毎年の暮らし・旧セーブの移行
/* =====================================================================
   人物の能力・★・気質（人物情報・能力・気質の実装指示書 v1.0）
   主人公と周りの人物に共通の仕組み。数値はすべてゲーム上の仮値で、史実や確定数値ではない。
   ===================================================================== */
const gauss=()=>{let u=0,v=0;while(!u)u=rand();while(!v)v=rand();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)};
/* 出生時の能力の範囲（項目ごとに違う）。3つの一様乱数の平均で引くので、中央付近が出やすく両端は珍しい */
const AB_RANGE=[[120,300],[40,160],[100,260],[80,240]];
const bell=(lo,hi)=>lo+(hi-lo)*(rand()+rand()+rand())/3;
/* ★（活動による成長のしやすさ）：1が標準で下限・5が上限。出生時は1が最多（仮）。能力の初期値とは別に引く（独立） */
const STAR_W_BIRTH=[64,24,8,3,1],STAR_W_ADULT=[50,28,13,6,3];
const drawStar=w=>{let r=rand()*100,a=0;for(let i=0;i<5;i++){a+=w[i];if(r<a)return i+1}return 1};
const starStr=v=>{v=Math.max(1,Math.min(5,Math.round(v)||1));return '★'.repeat(v)+'☆'.repeat(5-v)};   // 表示用：★が成長のしやすさ（1〜5）
const STAR_MULT=[1,1.25,1.5,1.8,2.2];                 // 活動による成長だけに掛ける倍率（仮）
const starMult=s=>STAR_MULT[clamp(Math.round(s)||1,1,5)-1];
const SAT=v=>clamp(1.5*(1-v/1000),0.08,1);            // 高い能力値ほど成長が緩やか（★の倍率のあとに掛かる＝高い★にも効く）
/* ★の上下：活動の積み重ね（sx＝隠しの経験値）が溜まると上がり、使わない状態が続くと下がる。特別な経験では一気に動く */
/* XP_POL＝生活方針1ポイント・1年あたり／XP_EV＝出来事1回の成長量あたり（出来事は小さく、継続する活動を主にする）／XP_NPC＝周りの人の活動1回／XP_DECAY＝使わない年の目減り（13歳から） */
let XP_POL=2.5,XP_EV=0.12,XP_NPC=2,XP_UP=[90,190,320,500],XP_DOWN=[0,60,90,120,160],XP_DECAY_ME=3,XP_DECAY_NPC=2.2;
const xpAdd=(p,i,amt)=>{p.sx[i]+=amt};
function xpDecay(p,yrs,age,dec){if(age<13)return;for(let i=0;i<4;i++)p.sx[i]-=dec*yrs}
function starCheck(p,i,log){
  let ch=0;
  while(p.star[i]<5&&p.sx[i]>=XP_UP[p.star[i]-1]){p.sx[i]=Math.max(0,p.sx[i]-XP_UP[p.star[i]-1])*0.3;p.star[i]++;ch=1}
  while(p.star[i]>1&&p.sx[i]<=-XP_DOWN[p.star[i]-1]){p.star[i]--;p.sx[i]=XP_UP[p.star[i]-1]*0.35;ch=-1}
  if(p.star[i]===1&&p.sx[i]<0)p.sx[i]=0;
  if(p.star[i]===5&&p.sx[i]>150)p.sx[i]=150;
  if(ch&&log)log(i,ch,p.star[i]);
}
/* 年齢による自然な成長と衰え（★は掛けない） */
function natStep(p,age,yrs,yq){
  if(age<13){const frac=0.3+0.7*Math.min(1,age/13);for(let i=0;i<4;i++)p.stats[i]=clamp(p.stats[i]+(p.tgt[i]*frac-p.stats[i])*(yq?0.08:0.3)+(rnd(3)-1),0,1000)}
  if(age>35)p.stats[0]=clamp(p.stats[0]-(age-35)*0.18*yrs,0,1000);
  if(age>50)p.stats[3]=clamp(p.stats[3]-(age-50)*0.08*yrs,0,1000);
}
/* ---- 気質：5つの連続軸（0〜100。第1の文字側が高い）。表示は INFP-T のような32通り ---- */
const TM_AX=[['E','I','外向','内向'],['S','N','現実','直観'],['T','F','思考','感情'],['J','P','計画','柔軟'],['A','T','自信','揺らぎ']];
function mkTm(age){const sd=age>=13?16:10;return{v:[0,1,2,3,4].map(()=>clamp(Math.round(50+gauss()*sd),8,92)),on:false,sh:[0,0,0,0,0],log:[]}}
const tmType=t=>[0,1,2,3].map(i=>TM_AX[i][t.sh[i]?0:1]).join('')+'-'+TM_AX[4][t.sh[4]?0:1];
/* 表示の開始：8歳以上で傾向のはっきりした軸が4つ以上になったら。遅くとも13歳で始める。表示後は、境目を越えて少し進んだときだけ文字が変わる */
function tmCheck(t,age){
  if(!t.on){
    const clear=t.v.filter(x=>Math.abs(x-50)>=7).length;
    if((age>=8&&clear>=4)||age>=13){t.on=true;t.sh=t.v.map(x=>x>=50?1:0);return 'start'}
    return null;
  }
  let fl=false;
  t.v.forEach((x,i)=>{if(t.sh[i]&&x<44){t.sh[i]=0;fl=true}else if(!t.sh[i]&&x>56){t.sh[i]=1;fl=true}});
  return fl?'flip':null;
}
const TM_PLAST=age=>age<6?1.6:age<13?1.2:age<20?0.9:0.55;   // 幼いほど動きやすい（仮）
function tmNudge(t,ax,dir,w,age,why){
  const x=t.v[ax],room=1-clamp(Math.abs(x-50)/55,0,1)*0.6;     // 端に近いほど動きにくい
  const d=clamp(dir*w*TM_PLAST(age)*room,-2.6,2.6);             // 1回で動く量には上限（小さな選択で反転させない）
  t.v[ax]=clamp(x+d,2,98);
  if(Math.abs(d)>=0.6&&why){t.log.unshift({age,ax,d:Math.round(d*10)/10,x:String(why).slice(0,22)});if(t.log.length>10)t.log.pop()}
}
const tmWeight=(t,e)=>{const w=e.wt||1;if(!e.tm)return w;return w*clamp(1+e.tm[1]*(t.v[e.tm[0]]-50)/50*0.8,0.35,1.8)};
function tmPick(t,pool){
  if(!pool.length)return null;
  const ws=pool.map(e=>tmWeight(t,e)),sum=ws.reduce((a,b)=>a+b,0);let r=rand()*sum;
  for(let i=0;i<pool.length;i++){r-=ws[i];if(r<=0)return pool[i]}
  return pool[pool.length-1];
}
const tmWord=(ax,v)=>{const d=v-50;if(Math.abs(d)<10)return '中間';return (Math.abs(d)>=25?'強く':'やや')+(d>0?TM_AX[ax][2]:TM_AX[ax][3])};
/* 日常の気質イベント（自動）：その人の傾向に合うものが出やすい。どの極も、能力への効果の大きさは同じ程度にしてある */
const TMEV=[
 {x:'人の集まりに顔を出し、大勢と話した。',b:'わいわい',tm:[0,1,1.3],fx:[0,1,1,1]},
 {x:'ひとりで静かに考えごとをして過ごした。',b:'ぼんやり',tm:[0,-1,1.3],fx:[0,1,1,1]},
 {x:'目の前の仕事を、決まった手順どおりにこなした。',b:'こつこつ',tm:[1,1,1.3],fx:[1,1,1,0]},
 {x:'ふと思いついた工夫を試してみた。',b:'ひらめき',tm:[1,-1,1.3],fx:[0,1,1,1]},
 {x:'物事の筋道を考えて、理屈で整理した。',b:'なるほど',tm:[2,1,1.3],fx:[0,2,1,0]},
 {x:'相手の気持ちを思いやって、言葉を選んだ。',b:'そっと',tm:[2,-1,1.3],fx:[0,0,1,2]},
 {x:'先の予定を立てて、段取りを整えた。',b:'段取り',tm:[3,1,1.3],fx:[0,1,1,1]},
 {x:'気の向くまま、予定を決めずに過ごした。',b:'ふらり',tm:[3,-1,1.3],fx:[1,0,1,1]},
 {x:'うまくいかないことがあったが、気にせず受け止めた。',b:'まあいいか',tm:[4,1,1.3],fx:[0,1,1,1]},
 {x:'うまくいかなかったことを、いつまでも考え込んだ。',b:'うーん…',tm:[4,-1,1.3],fx:[0,1,1,1]}
];
const TMEV_KID=[
 {x:'大勢の子の輪に入って遊んだ。',b:'みんなで！',tm:[0,1,1.3],fx:[1,0,1,1]},
 {x:'すみっこで、ひとり静かに遊んだ。',b:'ひとりで…',tm:[0,-1,1.3],fx:[1,1,1,0]},
 {x:'いつもの遊びを、同じ順番でくり返した。',b:'いつもの',tm:[1,1,1.3],fx:[1,1,1,0]},
 {x:'変わった遊び方を思いついた。',b:'ひらめき',tm:[1,-1,1.3],fx:[0,2,1,0]},
 {x:'「どうして？」と理由を考えた。',b:'どうして？',tm:[2,1,1.3],fx:[0,2,1,0]},
 {x:'泣いている子のそばに、そっと寄りそった。',b:'だいじょうぶ',tm:[2,-1,1.3],fx:[0,0,1,2]},
 {x:'遊ぶ順番を決めてから始めた。',b:'まずはね',tm:[3,1,1.3],fx:[0,1,1,1]},
 {x:'気の向くまま、あちこち動き回って遊んだ。',b:'あっちこっち',tm:[3,-1,1.3],fx:[1,0,1,1]},
 {x:'転んでも、すぐ立ち上がって遊びを続けた。',b:'へっちゃら',tm:[4,1,1.3],fx:[1,0,1,1]},
 {x:'ちょっとしたことが気になって、なかなか寝つけなかった。',b:'うーん…',tm:[4,-1,1.3],fx:[0,1,1,1]}
];
[TMEV,TMEV_KID].forEach(a=>a.forEach(e=>{e.t='n';e.wt=0.55}));
/* 日常の出来事への気質タグ（その人の傾向に合うものが出やすくなり、起きた出来事は気質を少し動かす）。[軸,向き,強さ] */
const EVTAG={
 aristocrat:[[0,1,1.2],[0,-1,1],[3,1,1],[0,-1,1],[3,-1,1],[0,1,1],[1,1,.8]],
 common:[[3,1,1],[0,1,1.2],[1,1,1],[1,-1,.8],[3,-1,1],[4,-1,1],[0,1,1]],
 farm:[[1,1,1],[3,1,1],[3,1,.8],[0,1,.6],[0,1,1],[2,-1,.8],[4,-1,1]],
 artisan:[[3,1,1],[4,-1,1],[1,1,.8],[1,1,.6],[0,1,1],[3,1,.8],[0,1,1]]};
for(const k in EVTAG)EVTAG[k].forEach((t,i)=>{PERSONAS[k].ev[i].tm=t});
/* 決断の選択肢：気質の動き・特別な経験（sx＝★の経験値）・回復（rec）。[軸,向き,強さ] */
const DTAG=[['aristocrat',0,0,[[0,1,2.2]],[0,0,0,30]],['aristocrat',0,1,[[0,-1,1.6]]],['aristocrat',1,0,[[3,1,1.8]],[0,50,0,0]],['aristocrat',1,1,[[3,-1,1.8]]],
 ['common',0,0,[[4,1,1.6]],[40,0,0,0]],['common',0,1,[[4,-1,1]]],['common',1,0,[[0,1,2]]],['common',1,1,[[0,-1,2]],null,true],
 ['farm',0,0,[[2,-1,1.6]],[0,30,0,0]],['farm',0,1,[[4,-1,1.4]]],['farm',1,0,[[2,1,1.2]]],['farm',1,1,[[4,1,1.4]],[30,0,0,0]],
 ['artisan',0,0,[[4,1,1.8]],[0,40,30,0]],['artisan',0,1,[[4,-1,1.4],[3,1,.8]]],['artisan',1,0,[[1,-1,1.6]],[0,30,0,0]],['artisan',1,1,[[1,1,1.2]],null,true]];
DTAG.forEach(([k,d,o,tm,sx,rec])=>{const op=PERSONAS[k].dec[d].opts[o];op.tm=tm;if(sx)op.sx=sx;if(rec)op.rec=true});
/* 小さな選択：決断より軽い、日々の分かれ道。選ぶまで時間が止まる。傾向がはっきりした人には、その傾向に沿った追加のやり方が出る（ほかの選択肢は消えない） */
const SMALL=[
 {title:'休みの過ごし方',body:'ぽっかりと空いた時間ができた。どう過ごそう？',
  opts:[{l:'人に会いに行く',y:'会いに行こう！',x:'人に会って、話をして過ごした。',fx:[0,1,1,1],tm:[[0,1,2]]},
        {l:'ひとりで過ごす',y:'ひとりで…',x:'ひとり静かに過ごした。',fx:[1,1,1,0],tm:[[0,-1,2]]}],
  extra:[{ax:0,dir:1,need:12,opt:{l:'みんなを誘う',y:'みんなで行こう！',x:'声をかけて、大勢で出かけた。',fx:[1,0,1,1],tm:[[0,1,2.4]]}},
         {ax:0,dir:-1,need:12,opt:{l:'好きなことに没頭する',y:'じっくりやろう。',x:'時を忘れて、好きなことに打ち込んだ。',fx:[1,1,1,0],tm:[[0,-1,2.4]]}}]},
 {title:'やり方の分かれ道',body:'ものごとを進めるやり方で、迷ってしまった。',
  opts:[{l:'教わった通りに',y:'まずは基本から。',x:'教わった通りに、確実に進めた。',fx:[1,1,1,0],tm:[[1,1,2]]},
        {l:'自分なりに試す',y:'こうしてみよう！',x:'自分なりのやり方を試してみた。',fx:[0,1,1,1],tm:[[1,-1,2]]}],
  extra:[{ax:1,dir:1,need:12,opt:{l:'手順を書いて確かめる',y:'ひとつずつ確認！',x:'手順を書きとめ、確かめながら進めた。',fx:[1,1,1,0],tm:[[1,1,2.4]]}},
         {ax:1,dir:-1,need:12,opt:{l:'全体を思い描く',y:'先に形を考えよう。',x:'全体の形を思い描いてから取りかかった。',fx:[0,1,1,1],tm:[[1,-1,2.4]]}}]},
 {title:'言い分の食い違い',body:'身近な人と、言い分が食い違ってしまった。',
  opts:[{l:'筋道を立てて話す',y:'順番に説明するね。',x:'筋道を立てて、考えを説明した。',fx:[0,2,1,0],tm:[[2,1,2]]},
        {l:'まず気持ちを聞く',y:'どう思ってるの？',x:'まず相手の気持ちに耳を傾けた。',fx:[0,0,1,2],tm:[[2,-1,2]]}],
  extra:[{ax:2,dir:1,need:12,opt:{l:'事実を並べて整理する',y:'事実を確認しよう。',x:'わかっていることを並べて、整理してみせた。',fx:[0,2,1,0],tm:[[2,1,2.4]]}},
         {ax:2,dir:-1,need:12,opt:{l:'双方の思いを伝える',y:'間に立つよ。',x:'それぞれの思いを、互いに伝えた。',fx:[0,0,1,2],tm:[[2,-1,2.4]]}}]},
 {title:'これからの進め方',body:'これからのことを、どう進めようか考えている。',
  opts:[{l:'先に段取りを決める',y:'順番を決めよう。',x:'先に段取りを決めてから動いた。',fx:[0,1,1,1],tm:[[3,1,2]]},
        {l:'成り行きに任せる',y:'なんとかなるさ。',x:'成り行きに任せて動いてみた。',fx:[1,0,1,1],tm:[[3,-1,2]]}],
  extra:[{ax:3,dir:1,need:12,opt:{l:'予定を細かく書き出す',y:'全部書き出そう。',x:'日ごとの予定を細かく書き出した。',fx:[0,1,1,1],tm:[[3,1,2.4]]}},
         {ax:3,dir:-1,need:12,opt:{l:'道を残して動き出す',y:'まず動いてみよう。',x:'いくつかの道を残したまま、動き出した。',fx:[1,0,1,1],tm:[[3,-1,2.4]]}}]},
 {title:'うまくいかなかったあと',body:'思うようにいかないことがあった。どうしよう？',
  opts:[{l:'気持ちを切り替える',y:'よし、次！',x:'気持ちを切り替えて、次へ進んだ。',fx:[1,0,1,1],tm:[[4,1,2]]},
        {l:'じっくり振り返る',y:'何がだめだった？',x:'何がいけなかったか、じっくり振り返った。',fx:[0,1,1,1],tm:[[4,-1,2]]}],
  extra:[{ax:4,dir:1,need:12,opt:{l:'笑って話して前を向く',y:'聞いてよ！',x:'周りの人に笑って話し、前を向いた。',fx:[1,0,1,1],tm:[[4,1,2.4]]}},
         {ax:4,dir:-1,need:12,opt:{l:'備えを整えておく',y:'次は備えよう。',x:'同じことが起きないよう、備えを整えた。',fx:[0,1,1,1],tm:[[4,-1,2.4]]}}]},
 {title:'はじめての人',body:'はじめて会う人が目の前にいる。',
  opts:[{l:'自分から話しかける',y:'こんにちは！',x:'自分から声をかけて、話をした。',fx:[0,1,1,1],tm:[[0,1,2]]},
        {l:'声をかけられるのを待つ',y:'……',x:'相手が話しかけるのを、静かに待った。',fx:[1,1,1,0],tm:[[0,-1,2]]}],
  extra:[]}
];
const SMALL_GAP=yq=>yq?2+rand()*2:3+rnd(4);   // 次の小さな選択までの年数（仮）
function makeSmall(){
  let k;do{k=rnd(SMALL.length)}while(SMALL.length>1&&k===S.smallLast);S.smallLast=k;
  const d=SMALL[k],opts=d.opts.map(o=>JSON.parse(JSON.stringify(o)));
  d.extra.forEach(ex=>{if(ex.dir*(S.tm.v[ex.ax]-50)>=ex.need){const o=JSON.parse(JSON.stringify(ex.opt));o.ex=true;opts.push(o)}});
  return{title:d.title,body:d.body,small:true,who:null,opts};
}
function tmFit(o){if(!S.tm.on)return false;if(o.ex)return true;if(!o.tm)return false;let s=0;o.tm.forEach(([ax,dir])=>{s+=dir*(S.tm.v[ax]-50)/50});return s>=0.25}
/* 主人公の ★・気質 の変化を年表に記録 */
function starAll(){for(let i=0;i<4;i++)starCheck(S,i,(j,ch,st)=>{addLog('n',ch>0?`${STAT[j][0]}が伸びやすくなった（★${st}）`:`${STAT[j][0]}が伸びにくくなった（★${st}）`,true);lastBubble=ch>0?`★${st}！`:'…'})}
function tmReport(){const r=tmCheck(S.tm,S.age);if(r==='start'){addLog('k',`気質のタイプが見えてきた：${tmType(S.tm)}`,true);lastBubble=tmType(S.tm)}else if(r==='flip')addLog('k',`気質の傾向が変わってきた：${tmType(S.tm)}`,true)}
/* 人物（周りの人・主人公）の能力・★・気質を作る。生成時に一度だけ引き、保存して使い回す（再抽選しない）。
   age 歳までの自然な成長を進めた値にする */
function mkPerson(P,age){
  const init=AB_RANGE.map(r=>Math.round(bell(r[0],r[1])));
  const tgt=P.stats.map((b,i)=>clamp(Math.round(b+(init[i]-(AB_RANGE[i][0]+AB_RANGE[i][1])/2)*2),150,950));   // 生まれつきの差が、成長後の水準にも残る（仮）
  const star=[0,1,2,3].map(()=>drawStar(age>=13?STAR_W_ADULT:STAR_W_BIRTH));
  const o={stats:init.slice(),tgt,star,sx:[0,0,0,0],tm:mkTm(age)};
  for(let k=1;k<=age;k++)natStep(o,k,1,false);
  tmCheck(o.tm,age);
  return o;
}
/* 周りの人の毎年の暮らし：自分なりの活動で少し伸び、★の経験値が動き、気質も自分の経験で少し動く（主人公の選択とは混ぜない） */
const NPC_STAM_LINK=true;
function npcLife(n,a,yrs,yq){
  natStep(n,a,yrs,yq);
  if(a>=3&&a<65&&rand()<(yq?0.15:0.6)){
    const i=rnd(4),amt=a<13?5:9;
    n.stats[i]=clamp(n.stats[i]+amt*starMult(n.star[i])*SAT(n.stats[i]),0,1000);xpAdd(n,i,amt*XP_NPC);
  }
  xpDecay(n,yrs,a,XP_DECAY_NPC);
  for(let i=0;i<4;i++)starCheck(n,i,null);
  if(rand()<(a<13?1.2:0.6)*yrs){const e=tmPick(n.tm,a<13?TMEV_KID:TMEV);if(e)tmNudge(n.tm,e.tm[0],e.tm[1],e.tm[2],a,e.x)}
  tmCheck(n.tm,a);
}
/* 旧セーブ（版4）の読み込み：足りない項目だけを、一度だけ補う。補う値は人物ごとの固定の種で引くので、同じ旧セーブを何度開いても同じになる。
   既存の能力値（0〜1000）はそのまま使う（10倍などはしない）。存在しない幼少期の履歴は作らない */
const mulberry=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
function seeded(seed,fn){return rngDetached(seed,fn)}      // 種から決まる乱数を一時的に使う（人生の乱数 S.rs は動かさない）
/* 読み込み・移行の間は、人生の乱数 S.rs に触れない。補完に使う乱数は、保存の中身（または保存済みの種）から決まる固定の列にする */
function migrate(s){
  const seed=((s&&s.rs!=null?s.rs:hash(JSON.stringify(s)))^0x51ED270B)>>>0;
  return rngDetached(seed,()=>migrateBody(s));
}
function migrateBody(s){
  const P=PERSONAS[s.pid];if(!P||!Array.isArray(s.npc)||!Array.isArray(s.stats))throw new Error('読み込めない形式');
  /* 乱数の状態（v1.7 単位2）：旧セーブには無いので一度だけ補う。種は旧セーブの中身から決める（同じ旧セーブは何度開いても同じ種になり、
     補ったあとの人生は S.rs を保存するので以後は引き直さない）。すでに持っている保存は、そのまま使う */
  if(s.rs==null){s.rs=(hash(JSON.stringify(s))^0x9E3779B9)>>>0;s.rv=1}
  if(!Array.isArray(s.slots))s.slots=null;
  if(!Array.isArray(s.tgt))s.tgt=P.stats.slice();
  if(!Array.isArray(s.sx))s.sx=[0,0,0,0];
  if(!s.evSeen||typeof s.evSeen!=='object')s.evSeen={};
  if(!Array.isArray(s.pending))s.pending=[];
  if(!Array.isArray(s.star)||!s.tm){
    seeded(hash(`${s.pid}|${s.switchAge}|self`),()=>{
      if(!Array.isArray(s.star))s.star=[0,1,2,3].map(()=>drawStar(s.age>=13?STAR_W_ADULT:STAR_W_BIRTH));
      if(!s.tm){s.tm=mkTm(s.age);s.tm.src='migrated';tmCheck(s.tm,s.age)}
    });
  }
  s.npc.forEach(n=>{
    if(Array.isArray(n.stats)&&Array.isArray(n.star)&&Array.isArray(n.sx)&&n.tm&&Array.isArray(n.tgt))return;
    seeded(hash(`${s.pid}|${n.name}|${n.rel}|${n.off}`),()=>{
      const m=mkPerson(P,Math.max(0,n.dead?(n.deadAge||0):s.age+n.off));
      n.stats=m.stats;n.tgt=m.tgt;n.star=m.star;n.sx=m.sx;n.tm=m.tm;n.tm.src='migrated';
    });
  });
  if(typeof s.nextSmallT!=='number')s.nextSmallT=s.t+seeded(hash(`${s.pid}|${s.switchAge}|small|${Math.floor(s.t)}`),()=>SMALL_GAP(s.mode==='q'));
  s.ver=5;
  stNew(s);
  s.sm=stepMonths(s.age);s.mode=s.sm>=12?'y':'q';          // 進行幅は年齢から決まる（v1.7）。旧セーブの mode は表示用に再計算する
  return s;
}
const GEN={
 infant:[
  {t:'n',x:'養育者に抱かれて眠った。',fx:[2,0,0,0],b:'すやすや…'},
  {t:'n',x:'はじめて寝返りをうった。',fx:[3,1,0,0],b:'ごろん♪'},
  {t:'n',x:'よちよちと歩きはじめた。',fx:[4,1,3,0],b:'とてとて'},
  {t:'n',x:'言葉を覚えはじめた。',fx:[0,4,2,2],b:'ことば♪'},
  {t:'n',x:'熱を出して泣いた。',fx:[-3,0,-2,0],b:'えーん…'},
  {t:'n',x:'庭先で遊んだ。',fx:[2,1,3,2],b:'あそぶ♪'}],
 child:[
  {t:'n',x:'家の手伝いを覚えた。',fx:[2,2,3,0],b:'おてつだい'},
  {t:'n',x:'年上の子のまねをして遊んだ。',fx:[2,1,3,3],b:'まねっこ'},
  {t:'n',x:'大人の仕事をそばで見ていた。',fx:[0,5,3,0],b:'じっと見る'},
  {t:'n',x:'転んで膝をすりむいた。',fx:[-2,0,-1,0],b:'いたっ！'},
  {t:'n',x:'お話を聞かせてもらった。',fx:[0,5,3,2],b:'わくわく'}],
 elder:[
  {t:'n',x:'昔のことを若い人に語った。',fx:[0,2,3,4],b:'昔話'},
  {t:'n',x:'腰が痛んで、一日休んだ。',fx:[-4,0,-2,0],b:'いたた…'},
  {t:'n',x:'日向でゆっくり過ごした。',fx:[2,0,3,0],b:'ぽかぽか'},
  {t:'n',x:'若い人に仕事を教えた。',fx:[0,3,5,3],b:'教える'},
  {t:'n',x:'久しぶりに知り合いが訪ねてきた。',fx:[0,0,4,3],b:'おや、久しぶり'}]
};
