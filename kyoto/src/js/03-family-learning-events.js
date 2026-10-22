// 03-family-learning-events.js — 家族の出来事、学び（6歳〜）と仕事（13歳〜）の出来事、活動による成長の区分
// 家族の出来事：{n} は、知っていて存命の家族からランダムに選ばれる
const FAMEV={
 infant:[{x:'{n}があやしてくれた。',fx:[1,1,0,1],b:'あやされる',aff:3},{x:'{n}に背負われて出かけた。',fx:[1,2,2,0],b:'おんぶ',aff:3}],
 child:[{x:'{n}に叱られた。',fx:[0,1,-3,0],b:'しゅん…',aff:-1},{x:'{n}の手伝いをした。',fx:[1,1,3,0],b:'おてつだい',aff:3},{x:'{n}から昔の話を聞いた。',fx:[0,4,3,0],b:'昔話',aff:3}],
 adult:[{x:'{n}と食卓を囲んだ。',fx:[1,0,3,0],b:'いただきます',aff:3},{x:'{n}の相談に乗った。',fx:[0,1,2,2],b:'相談',aff:3},{x:'{n}と些細なことで言い合いになった。',fx:[0,0,-3,0],b:'むっ',aff:-3}],
 elder:[{x:'{n}が様子を見に来てくれた。',fx:[1,0,3,0],b:'ありがとう',aff:3},{x:'{n}と昔を振り返った。',fx:[0,1,3,2],b:'昔を思う',aff:3}]};
Object.values(FAMEV).forEach(a=>a.forEach(e=>{e.fam=true;e.t='n'}));
/* 活動による成長（★の倍率が掛かる）／回復・自然な成長（掛からない）の区別。印のない出来事は活動 */
const REC_TX=['御簾の内から庭の花を眺めて過ごした。','日向でゆっくり過ごした。'];
for(const k in PERSONAS)PERSONAS[k].ev.forEach(e=>{if(REC_TX.includes(e.x))e.k='rec'});
GEN.elder.forEach(e=>{if(REC_TX.includes(e.x))e.k='rec'});
GEN.infant.forEach(e=>e.k='nat');FAMEV.infant.forEach(e=>e.k='nat');
[[GEN.child,[[3,1,1],[0,1,1],[0,-1,1],[4,-1,.8],[1,-1,1]]],[GEN.elder,[[0,1,.6],null,null,[3,1,.6],[0,1,.6]]],
 [FAMEV.child,[[4,-1,1],[3,1,.8],[1,-1,.8]]],[FAMEV.adult,[[0,1,.8],[2,-1,.8],[2,1,.8]]],[FAMEV.elder,[null,null]]]
 .forEach(([a,ts])=>a.forEach((e,i)=>{if(ts[i])e.tm=ts[i]}));
// 学び（6歳〜）と仕事（13歳〜）：境遇ごとの技能に合わせた出来事。sk は隠しの熟練度への加算（仮）
const LEARN={
 aristocrat:{study:[
   {x:'学者から文字と漢籍の素読を教わった。',fx:[0,6,2,0],sk:15,b:'素読',np:{1:3}},
   {x:'和歌の手ほどきを受けた。',fx:[0,4,3,3],sk:15,b:'和歌の稽古',np:{1:2}},
   {x:'管絃の稽古に通った。',fx:[0,2,3,4],sk:12,b:'管絃の稽古'}],
  work:[{x:'年中行事の作法を覚えた。',fx:[-1,3,2,2],sk:15,b:'作法を覚える'},{x:'邸の務めを手伝った。',fx:[1,1,2,2],sk:12,b:'お務め'}]},
 common:{study:[
   {x:'大人のやり方を見て覚えた。',fx:[0,4,3,0],sk:15,b:'見て覚える'},
   {x:'市の売り買いの仕方を聞いた。',fx:[0,4,3,1],sk:12,b:'なるほど'}],
  work:[{x:'土間の仕事をひと通りこなした。',fx:[2,1,2,0],sk:15,b:'ひと仕事'},{x:'手仕事の品を作って近所に分けた。',fx:[1,1,3,3],sk:12,b:'できた！',np:{1:3}}]},
 farm:{study:[
   {x:'畑の土と水の見方を教わった。',fx:[0,5,3,0],sk:15,b:'土を見る',np:{1:3}},
   {x:'種をまく時期を覚えた。',fx:[0,4,3,0],sk:12,b:'時期を覚える'}],
  work:[{x:'一日畑に出て働いた。',fx:[3,0,1,0],sk:15,b:'ひと働き'},{x:'収穫を終えて蔵へ運んだ。',fx:[3,1,3,0],sk:12,b:'収穫！'}]},
 artisan:{study:[
   {x:'親方の手元を見て覚えた。',fx:[0,6,3,0],sk:15,b:'見て覚える',np:{0:3}},
   {x:'道具の使い方を教わった。',fx:[0,5,3,0],sk:15,b:'道具を学ぶ',np:{1:3}}],
  work:[{x:'注文の品をひとつ仕上げた。',fx:[-1,2,5,2],sk:18,b:'仕上げた！',np:{0:2}},{x:'下仕事を任された。',fx:[1,1,2,0],sk:12,b:'下仕事'}]}
};
let emoQ=[];const emo=(who,type)=>{emoQ=emoQ.filter(e=>e[0]!==who);emoQ.push([who,type])};
let popQ=[],lastBubble=null,birthMode='select',seasonOv=null,seasonTimers=[];
const TYPE={k:'節目',n:'通常',r:'行動結果',c:'継続'};

let S=null,timer=null,speedIdx=0,resume=false;
const SPEEDS=[[30000,'×1'],[15000,'×2'],[7500,'×4'],[1000,'×30']];  // 1回（四半期／1年）あたりのミリ秒
let tickStart=0,tickMs=0,remaining=null,animT=null;
const $=id=>document.getElementById(id);


