// 16-ui-profile-text.js — 人物シート、フォントにない漢字のカタカナ変換
/* ---------- profile sheet ----------
   項目は PROFILE.self / PROFILE.npc の配列に1行足すだけで増やせます。
   - get が undefined / null / '' を返す、または例外を出した項目は「？」で表示（画面は壊れません）
   - 値はすべてエスケープして表示します
   - NPC の n.extra = {項目名:値} に入れたものは、コードを足さなくても末尾に並びます */
/* フォントにない漢字をカタカナにする（単語の辞書→1文字ずつの読み）。辞書にない漢字は、そのまま残す */
const KCH={"並":"ナミ","久":"ヒサ","井":"イ","些":"サ","亡":"ナ","仮":"カリ","任":"マカ","保":"タモ","修":"シュウ","値":"チ","備":"ソナ","優":"ユウ","再":"サイ","判":"ハン","制":"セイ","刺":"サ","削":"ケズ","務":"ツト","勧":"スス","卓":"タク","収":"オサ","叱":"シカ","含":"フク","呼":"ヨ","噂":"ウワサ","因":"イン","域":"イキ","基":"キ","報":"ホウ","境":"キョウ","増":"ゾウ","壊":"コワ","壮":"ソウ","奉":"ホウ","娘":"ムスメ","嫁":"ヨメ","存":"ゾン","宅":"タク","寄":"ヨ","寝":"ネ","尾":"オ","届":"トド","層":"ソウ","履":"リ","崩":"クズ","師":"シショウ","常":"ツネ","幼":"オサナ","床":"トコ","庶":"ショ","従":"ジュウ","御":"ギョ","情":"ジョウ","慌":"アワ","戻":"モド","房":"ボウ","扱":"アツカ","技":"ワザ","抱":"ダ","抽":"チュウ","招":"マネ","拡":"カク","振":"フ","接":"セツ","推":"スイ","搬":"ハン","摘":"ツ","支":"ササ","政":"セイ","故":"コ","敷":"シキ","断":"コトワ","既":"キ","暮":"ク","替":"カ","枚":"マイ","柄":"ガラ","欲":"ヨク","歳":"サイ","混":"コン","減":"ゲン","準":"ジュン","滅":"メツ","滞":"トドコオ","激":"ゲキ","炊":"タ","熟":"ジュク","率":"リツ","琴":"コト","環":"カン","甘":"アマ","略":"リャク","畦":"アゼ","痛":"イタ","療":"リョウ","眠":"ネム","眺":"ナガ","確":"カク","示":"シメ","祖":"ソ","程":"ホド","稽":"ケイ","穫":"カク","端":"ハシ","簡":"カン","簾":"スダレ","籍":"セキ","素":"ソ","絃":"ゲン","経":"ケイ","統":"トウ","継":"ケイ","緒":"ショ","職":"ショク","肩":"カタ","背":"セ","能":"ノウ","脚":"アシ","腰":"コシ","膝":"ヒザ","若":"ワカ","荒":"ア","蔵":"クラ","薪":"タキギ","衰":"オトロ","補":"ホ","褒":"ホ","覧":"ラン","訪":"オトズ","設":"セツ","評":"ヒョウ","詠":"ヨ","詳":"クワ","認":"ニン","誕":"タン","誘":"サソ","識":"シキ","譲":"ユズ","貴":"キ","込":"コ","途":"ト","這":"ハ","遅":"オソ","遇":"グウ","過":"ス","邪":"ジャ","邸":"ヤシキ","郭":"カク","針":"ハリ","閉":"ト","限":"ゲン","隠":"カク","隣":"トナリ","非":"ヒ","頃":"ゴロ","項":"コウ","頼":"タノ","魅":"ミ","齢":"レイ"};
const KWORDS={"従兄弟":"イトコ","兄弟子":"アニデシ","年齢":"ネンレイ","技能":"ギノウ","能力":"ノウリョク","魅力":"ミリョク","境遇":"キョウグウ","意欲":"イヨク","知識":"チシキ","職人技":"ショクニンワザ","農の技":"農のワザ","幼児期":"ヨウジキ","若年期":"ジャクネンキ","壮年期":"ソウネンキ","高齢期":"コウレイキ","老衰":"ロウスイ","上層貴族":"ジョウソウキゾク","庶民":"ショミン","奉公":"ホウコウ","家政":"カセイ","管絃":"カンゲン","素読":"ソドク","継続":"ケイゾク","故人":"コジン","基本":"キホン","間柄":"アイダガラ","屋敷":"ヤシキ","支度":"シタク","運搬":"ウンパン","体力":"体力","体調":"体調","事故":"ジコ","稽古":"ケイコ","収穫":"シュウカク","評判":"ヒョウバン","噂":"ウワサ","幼なじみ":"オサナなじみ","日向":"日向","若君":"ワカギミ","女房":"ニョウボウ","邸宅":"テイタク","貴族":"キゾク","師":"シショウ","田畑":"田畑","衰え":"オトロえ","荒れ":"アレ","頼み事":"タノみゴト","頼む":"タノむ","頼る":"タヨる","過ごし":"スごし","断る":"コトワる","断って":"コトワって","断った":"コトワった","断らず":"コトワらず","歳":"サイ","期":"期","約":"約","食卓":"ショクタク","背負":"セオ","保存":"ホゾン","寝返り":"ネガエり","振り返":"フりカエ","井戸端":"イドバタ","道端":"ミチバタ","履歴":"リレキ","修業":"シュギョウ","優先":"ユウセン","標準":"ヒョウジュン","一緒":"イッショ","祖母":"ソボ","職人":"ショクニン","若者":"ワカモノ","通常":"ツウジョウ","風邪":"カゼ","死因":"シイン","決断":"ケツダン","些細":"ササイ","工房":"コウボウ","刺激":"シゲキ","炊事":"スイジ","非表示":"ヒヒョウジ","表示":"ヒョウジ","既知":"キチ","漢籍":"カンセキ","蔵書":"ゾウショ","御簾":"ミス","人混み":"ヒトゴみ","準備":"ジュンビ","経過":"ケイカ","指摘":"シテキ","身寄り":"ミヨリ","療養":"リョウヨウ","隣家":"リンカ","畦道":"アゼミチ","一覧":"イチラン","再生":"サイセイ","久しぶり":"ヒサしぶり","死亡":"シボウ","背景":"ハイケイ","推定":"スイテイ","簡略":"カンリャク","誕生":"タンジョウ","抽選":"チュウセン","数値":"スウチ","増減":"ゾウゲン","補正":"ホセイ","統計":"トウケイ","強制":"キョウセイ","上限":"ジョウゲン","確認":"カクニン","判断":"ハンダン","地域":"チイキ","情報":"ジョウホウ","熟練度":"ジュクレンド","直接":"チョクセツ","設定":"セッテイ","仮置き":"カリオき","仮設定":"カリセッテイ","除外":"除外","方針":"ホウシン","工程":"コウテイ"};
const KZ_ON=false;   /* true にすると、フォントにない漢字をカタカナにする（x8y12 など収録が少ないフォント用） */
const KWMAX=Math.max(...Object.keys(KWORDS).map(w=>w.length));
function kz(s){
  s=String(s);if(!KZ_ON)return s;let o='',i=0;
  while(i<s.length){
    let hit=false;
    for(let n=Math.min(KWMAX,s.length-i);n>=2&&!hit;n--){const w=s.substr(i,n);if(KWORDS[w]!==undefined){o+=KWORDS[w];i+=n;hit=true}}
    if(hit)continue;
    const c=s[i];o+=KCH[c]!==undefined?KCH[c]:c;i++;
  }
  return o;
}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const UNKNOWN='？';
const PROFILE={
  self:[
    {group:'基本',label:'年齢',get:()=>`${S.age}歳（${bandOf(S.age)}）`},
    {group:'基本',label:'境遇',get:()=>PERSONAS[S.pid].label},
    {group:'基本',label:'時代',get:()=>S.era||PERSONAS[S.pid].era},
    ...STAT.map(([n],i)=>({group:'能力',label:n,get:()=>`${Math.round(S.stats[i])}　${starStr(S.star[i])}`})),
    {group:'技能',label:()=>PERSONAS[S.pid].skillName,get:()=>S.age>=6?`Lv${skillLv(S.skill)}`:null},
    {group:'気質',label:'タイプ',get:()=>S.tm.on?tmType(S.tm):'形成中'},
    ...TM_AX.map((a,i)=>({group:'気質',label:`${a[2]}／${a[3]}`,get:()=>tmWord(i,S.tm.v[i]),hide:()=>!S.tm.on})),
    {group:'気質の変化',label:'気質の変化',list:true,get:()=>{
      const t=S.tm;
      if(!t.log.length)return t.src==='migrated'?['旧セーブから引き継いだため、これまでの記録はありません']:[];
      return t.log.slice(0,5).map(e=>`${e.age}歳：${e.x}`)}}
  ],
  npc:[
    {group:'間柄',label:'関係',get:n=>(n.role&&n.role!==n.rel&&!/^新しい/.test(n.role))?`${n.rel}（${n.role}）`:n.rel},
    {group:'間柄',label:'好感度',get:n=>Math.round(n.aff)},
    {group:'基本',label:'年齢',get:n=>n.dead?`故人（${approxAge(n.deadAge)}）`:approxAge(npcAge(n))},
    {group:'技能',label:n=>(n.known&&(n.aff>=40||n.hist.length>=3))?n.skillName:'技能',get:n=>(n.aff>=40||n.hist.length>=3)?`Lv${skillLv(n.skill)}`:null},
    /* 能力の数値と気質は、親しくなる（好感度40以上か交流3回以上）まで「？」。★は、知り合った人なら最初から見える */
    ...STAT.map(([nm],i)=>({group:'能力',label:nm,get:n=>`${(n.aff>=40||n.hist.length>=3)?Math.round(n.stats[i]):UNKNOWN}　${starStr(n.star[i])}`})),
    {group:'気質',label:'タイプ',get:n=>(n.aff>=40||n.hist.length>=3)?(n.tm.on?tmType(n.tm):'形成中'):null},
    {group:'交流の履歴',label:'交流の履歴',list:true,get:n=>n.hist.slice(0,5).map(e=>`${e.ym}（${e.age}歳）${e.x}`)}
  ]
};
function profRows(fields,ctx,extraObj){
  const G=[];const grp=name=>{let g=G.find(z=>z.name===name);if(!g){g={name,rows:'',lists:''};G.push(g)}return g};
  for(const f of fields){
    if(f.hide){let h=false;try{h=f.hide(ctx)}catch(e){}if(h)continue}
    let label,val;
    try{label=typeof f.label==='function'?f.label(ctx):f.label;val=f.get(ctx)}catch(e){val=undefined;label=label||'?'}
    const g=grp(f.group||'その他');
    if(f.list){
      const items=Array.isArray(val)?val:null;
      g.lists+=(items===null?`<p class="note unk">${UNKNOWN}</p>`:items.length?`<ul class="log">${items.map(x=>`<li><span class="x">${esc(kz(x))}</span></li>`).join('')}</ul>`:`<p class="note">まだありません</p>`);
    }else{
      const ok=val!==undefined&&val!==null&&val!=='';
      g.rows+=`<dt>${esc(kz(label))}</dt><dd class="${ok?'':'unk'}">${ok?esc(kz(val)):UNKNOWN}</dd>`;
    }
  }
  if(extraObj){const g=grp('その他');Object.keys(extraObj).forEach(k=>{g.rows+=`<dt>${esc(kz(k))}</dt><dd>${esc(kz(extraObj[k]))}</dd>`})}
  return G.filter(g=>g.rows||g.lists).map(g=>`<section class="pgroup"><h3>${esc(kz(g.name))}</h3>${g.rows?`<dl class="prof">${g.rows}</dl>`:''}${g.lists}</section>`).join('');
}
function openProfile(target){
  let title,tag,fields,ctx,extra=null,face,gone=false,rel=null;
  if(target==='self'){title=nameOf();tag='自分';fields=PROFILE.self;ctx=S;face=selfFace()}
  else{
    const n=S.npc[+target];
    if(!n||!n.known)return;
    title=n.name;tag=n.dead?'故人':n.rel;fields=PROFILE.npc;ctx=n;face=npcFace(n);gone=!!n.dead;rel=n.rel;
    if(n.extra&&typeof n.extra==='object')extra=n.extra;
  }
  const body=profRows(fields,ctx,extra);
  const tagStyle=rel?` style="border-left:6px solid ${relCol(rel)}"`:'';
  title=kz(title);tag=kz(tag);
  $('sheet').innerHTML=`<div class="sheet-back" data-close="1"></div><div class="sheet-card"><div class="sheet-head"><div class="who"><img class="face${gone?' gone':''}" src="${face}" alt=""><div><b>${esc(title)}</b><br><span class="tag"${tagStyle}>${esc(tag)}</span></div></div><button class="pbtn" data-close="1" aria-label="${kz('閉じる')}">${kz('閉じる')}</button></div>${body}</div>`;
  $('sheet').hidden=false;
  const c=$('sheet').querySelector('button');if(c)c.focus();
}
function closeSheet(){const s=$('sheet');if(s&&!s.hidden){s.hidden=true;s.innerHTML=''}}

