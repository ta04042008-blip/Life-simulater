// 04-names-family.js — 人物の名前（時代別・ひらがな）と家族の生成
/* ---------- 人物の名前（ひらがな・時代に合わせた名のみ）。男女は役割から分かる人だけ合わせ、他は男女どちらでもよい名 ---------- */
const NAMEP={
  noble:{m:'ただひら なりひさ もろざね ためみち よりみち さねよし あきひら ただざね みちつな ひろまさ もりただ ためとき よしちか すけみち ゆきなり かねただ'.split(' '),
         f:'あきこ しげこ ふみこ やすこ たかこ さだこ のぶこ ともこ もとこ ただこ ひろこ みちこ よしこ かずこ ときこ みつこ'.split(' ')},
  heian:{m:'まろ いぬまろ かめまろ おとまろ すえまろ たけまろ とよまろ ひこまろ いちまろ くまわか つねまろ おおまろ さだまろ もちまろ やすまろ ながまろ'.split(' '),
         f:'おとめ しげ やす とよ たえ つる ふみ あや かの はる さち まつ うめ いね くま みつ'.split(' ')},
  muro:{m:'たろう じろう さぶろう しろう ごろう ろくろう ひこたろう とらまる いぬまる つるまる かめまる せんまる やごろう まつまる げんた とうじ'.split(' '),
        f:'つる かめ まつ たけ さよ いと ふく くま せん とら かね なつ はる すぎ ゆう いち'.split(' ')},
  edo:{m:'たろう じろう さぶろう きち すけ ごんべえ げんざ もへえ とくべえ ひこべえ そうすけ きんた とらきち やへい せいじ ちょうべえ'.split(' '),
       f:'つる かめ みつ きく まつ たけ いと さよ ふく くま せん とら なつ はる すぎ'.split(' ')},
  showa:{m:'かずお ひろし まさお ひでお てつお よしお たかし いさむ まこと みのる さとる のぼる おさむ しげお てるお'.split(' '),
         f:'かずこ ようこ ひろこ みちこ よしこ ちえこ さちこ としこ ふみこ きよこ けいこ なおこ ゆりこ あきこ'.split(' ')},
  mod:{m:'けんじ こうじ たかし まさき ゆうた しんじ ひろき たくや しょうた だいすけ けんた りょう あきら まなぶ ゆうき'.split(' '),
       f:'ゆみ ともこ えみ あやか さとみ まり ちあき かおり めぐみ ようこ ゆか まゆみ なおみ あや'.split(' ')},
  n:'ゆき あき ちか とき なお まさ ひさ のり よし もと ただ さだ ひろ みち かず てる'.split(' ')
};
const roleBase=r=>String(r).replace(/[二三四五六七八九]$/,'');
const roleSex=r=>{r=roleBase(r);if(/従/.test(r))return 'n';if(/母|姉|妹|女房|娘|妻/.test(r))return 'f';if(/父|兄|弟|息子|夫|親方/.test(r))return 'm';return 'n'};
function giveName(role,pid,taken){
  const P=PERSONAS[pid],set=NAMEP[P.ns]||NAMEP.heian,sx=roleSex(role);
  let pool=sx==='m'?set.m:sx==='f'?set.f:NAMEP.n;
  let free=pool.filter(x=>!taken.has(x));
  if(!free.length){const alt=sx==='n'?[...set.m,...set.f]:pool;free=alt.filter(x=>!taken.has(x))}
  if(!free.length){const b=pool[rnd(pool.length)];let k=2;while(taken.has(b+'（'+k+'）'))k++;return b+'（'+k+'）'}
  return free[rnd(free.length)];
}
function nameNpcs(s){                      // 役割名のままの人物に、名前をつける（役割は role に残す）。主人公も。
  const taken=new Set(s.npc.filter(n=>n.role!==undefined).map(n=>n.name));if(s.myName)taken.add(s.myName);
  s.npc.forEach(n=>{if(n.role===undefined){n.role=roleBase(n.name);n.name=giveName(n.role,s.pid,taken);taken.add(n.name)}});
  if(!s.myName){s.myName=giveName('主人公',s.pid,taken)}
}
// 家族の生成（仮）：n0 が家族の境遇は、もう一人の親だけ追加。親が欠ける場合は祖母が加わる。兄弟姉妹は0〜2人
const FAMNEED={aristocrat:['父'],common:['父'],farm:['母'],artisan:['母','父']};
let FAM_MISS=0.12, FAM_SIB=[35,40,25], FAM_ELDER=0.5;   // 養育者が欠ける確率／兄弟姉妹0・1・2人の割合（％）／兄・姉になる確率（すべて仮）
/* ---- 時間の進め方（仕様v1.7 §2 確定）。画面の1回分の長さ（月）。内部は常に3か月ずつ処理する ---- */
const TIME={
  STEP_MONTHS:[[0,12],[6,3],[25,6],[60,12]],   // [開始年齢, 月数]：0〜5歳=1年、6〜24歳=3か月、25〜59歳=6か月、60歳以上=1年【確定】
  ADULT_FROM:25,                                // 旧「1年進行」の数値を換算して使う年齢（進行幅の境目と同じ）
  SMALL_FROM_AGE:4                              // 小さな選択が出始める年齢【ユーザー決定のゲーム仮定 2026-10-25：A案=4歳から】
};
function stepMonths(age){let m=TIME.STEP_MONTHS[0][1];for(const [a,v] of TIME.STEP_MONTHS)if(age>=a)m=v;return m}
function syncStep(){S.sm=stepMonths(S.age);S.mode=S.sm>=12?'y':'q'}   // 画面表示用の派生値（mode: 'y'=1年ごと, 'q'=1年未満ごと）
let SWITCH_AGE=[20,30];                               // 【旧】進行幅の切替年齢。v1.7で年齢固定（TIME）になり使わない。人物の絵などの種として残す
