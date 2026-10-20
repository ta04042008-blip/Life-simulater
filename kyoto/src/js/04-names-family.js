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
