// 18a-save-system.js — 京都版の自動保存・JSONバックアップ・検証付き復元。
// 旧手動セーブ KEY は変更しない。自動保存・復元前の退避を別キーへ保存。
const SAVE_AUTO_KEY='kyoto-kurashi-mihon-v4-autosave';
const SAVE_PREV_KEY='kyoto-kurashi-mihon-v4-autosave-previous';
const SAVE_PROTECT_KEY='kyoto-kurashi-mihon-v4-before-replace';
const SAVE_FORMAT='earth2000-kyoto-save', SAVE_EXPORT_VERSION=1;
let saveArmed=false, savePending=null, saveWarned=false;

function saveSnapshot(){return JSON.stringify(S)}
function saveStateOk(s){
  if(!s||typeof s!=='object'||Array.isArray(s))throw new Error('保存形式が不正です');
  if(!Object.prototype.hasOwnProperty.call(PERSONAS,s.pid))throw new Error('不明な境遇です');
  if(typeof s.ver==='number'&&s.ver>5)throw new Error('新しい版のセーブデータです');
  if(s.sv!=null&&(!Number.isInteger(s.sv)||s.sv>1||s.sv<0))throw new Error('対応していない状態システムの版です');
  if(!Number.isInteger(s.age)||s.age<0||!Number.isInteger(s.year)||!Number.isFinite(s.t)||s.t<0)throw new Error('年齢・年・経過時間が不正です');
  /* 年齢の固定上限は置かない。代わりに、出生年・年齢・経過時間が互いに矛盾しないことを調べる：
     現在の年 − 年齢 ＝ 出生年（西暦1〜BIRTH_MAX）、経過時間 ＝ 年齢 ＋ 季節×0.25（旧セーブは年送りで季節0） */
  const by=s.year-s.age;
  if(by<1||by>BIRTH_MAX)throw new Error('出生年と年齢が合いません');
  if(Math.abs(s.t-(s.age+(Number.isInteger(s.q)?s.q:0)*0.25))>0.2501)throw new Error('年齢と経過時間が合いません');
  if(s.dead&&(!Number.isFinite(s.deathAge)||s.deathAge>s.age))throw new Error('死亡の記録が合いません');
  if(!['q','y'].includes(s.mode)||!Number.isInteger(s.q)||s.q<0||s.q>3)throw new Error('進行状態が不正です');
  if(!Array.isArray(s.stats)||s.stats.length!==4||!s.stats.every(v=>Number.isFinite(v)&&v>=0&&v<=1000))throw new Error('能力値が不正です');
  if(!Array.isArray(s.npc)||s.npc.length>1000||!s.npc.every(n=>n&&typeof n==='object'&&!Array.isArray(n)))throw new Error('人物データが不正です');
  if(!Array.isArray(s.log)||!Array.isArray(s.chron)||!Array.isArray(s.pending))throw new Error('人生記録が不正です');
  if(s.rs!=null&&(!Number.isInteger(s.rs)||s.rs<0||s.rs>4294967295))throw new Error('乱数の状態が不正です');
  if(s.slots!=null&&(!Array.isArray(s.slots)||s.slots.length>20||!s.slots.every(x=>x&&(x.k==='o'||x.k==='l')&&Number.isFinite(x.at)&&x.at>=0&&x.at<=1)))throw new Error('途中イベントの予定が不正です');
  if(s.decision!=null&&(!s.decision||!Array.isArray(s.decision.opts)||!s.decision.opts.length))throw new Error('回答待ちのデータが不正です');
  if(s.npc.some(n=>!Array.isArray(n.stats)||n.stats.length!==4||!n.stats.every(v=>Number.isFinite(v)&&v>=0&&v<=1000)))throw new Error('人物の能力値が不正です');
  return s;
}
function savePrepare(input){
  if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('JSONの形式が不正です');
  let raw=input;
  if(Object.prototype.hasOwnProperty.call(input,'format')){
    if(input.format!==SAVE_FORMAT||input.version!==SAVE_EXPORT_VERSION)throw new Error('対応していない書き出し形式です');
    raw=input.state;
  }
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new Error('人生データがありません');
  // 検査・移行は現在のSとは別のオブジェクトで行い、失敗時もプレイ中の状態を保持する。
  const s=JSON.parse(JSON.stringify(raw));
  if(!Object.prototype.hasOwnProperty.call(PERSONAS,s.pid)||!Array.isArray(s.npc)||!Array.isArray(s.stats))throw new Error('読み込めない形式です');
  if(typeof s.ver==='number'&&s.ver>5)throw new Error('新しい版のセーブデータです');
  if(s.sv!=null&&(!Number.isInteger(s.sv)||s.sv>1||s.sv<0))throw new Error('対応していない状態システムの版です');
  if(!Number.isFinite(s.age)||!Number.isFinite(s.year)||!Number.isFinite(s.t))throw new Error('時間が不正です');
  return saveStateOk(migrate(s));
}
function saveProtectPrevious(){
  // 新しい人生・ロード・ファイル読み込み前の人生を独立した復元用スロットに退避。
  try{
    const previous=saveArmed&&S?saveSnapshot():localStorage.getItem(SAVE_AUTO_KEY);
    if(previous)localStorage.setItem(SAVE_PROTECT_KEY,previous);
    saveButtons();
    return true;
  }catch(e){toast('保存領域が不足しているため、現在の人生を保護できません。JSONを書き出してください。');return false}
}
function saveAutoNow(){
  if(!saveArmed||!S)return false;
  if(savePending!=null){clearTimeout(savePending);savePending=null}
  try{
    const data=saveSnapshot(),old=localStorage.getItem(SAVE_AUTO_KEY);
    if(data===old)return true;
    if(old)localStorage.setItem(SAVE_PREV_KEY,old);
    localStorage.setItem(SAVE_AUTO_KEY,data);
    saveButtons();
    saveWarned=false;
    return true;
  }catch(e){
    if(!saveWarned){toast('自動保存できませんでした。JSONを書き出してください。');saveWarned=true}
    return false;
  }
}
function saveAutoSoon(){
  if(!saveArmed||savePending!=null)return;
  savePending=setTimeout(()=>{savePending=null;saveAutoNow()},250);
}
function saveNewLife(){
  saveArmed=true;
  saveAutoNow();
}
/* ---- 旧形式（乱数の状態が無い・状態システムが無い）のセーブの原本退避 ----
   キーは原本の内容の指紋から作る。同じ原本は何度読み込んでも上書きしない。別の原本は別のキーで残す。一覧は索引に持つ。 */
const SAVE_PREMIG_INDEX=()=>KEY+'-premigrate-index';
function saveFingerprint(text){let h1=5381,h2=52711;for(let i=0;i<text.length;i++){const c=text.charCodeAt(i);h1=((h1*33)^c)>>>0;h2=((h2*31)+c)>>>0}return h1.toString(36)+h2.toString(36)+text.length.toString(36)}
function saveNeedsBackup(input){const raw=input&&input.format&&input.state?input.state:input;return !!raw&&typeof raw==='object'&&Array.isArray(raw.stats)&&(raw.rs==null||raw.sv==null)}
function saveBackupOriginal(input){
  if(!saveNeedsBackup(input))return true;
  try{
    const text=JSON.stringify(input),key=KEY+'-premigrate-'+saveFingerprint(text);
    if(localStorage.getItem(key)!=null)return true;                 // 同じ原本はすでに退避済み。上書きしない
    localStorage.setItem(key,text);
    let idx=[];try{idx=JSON.parse(localStorage.getItem(SAVE_PREMIG_INDEX())||'[]')}catch(e){idx=[]}
    if(!Array.isArray(idx))idx=[];
    idx.push({key,at:new Date().toISOString()});
    localStorage.setItem(SAVE_PREMIG_INDEX(),JSON.stringify(idx));
    return true;
  }catch(e){toast('移行前のデータを退避できないため、読み込みを中止しました。JSONを書き出してから、空き容量を確保してください。');return false}
}
/* 移行前の原本を、手動セーブの枠へ戻す（移行に失敗した・移行後の人生がおかしいときの復元）。現在の手動セーブは先に別キーへ退避する */
function saveRestoreOriginal(key){
  try{
    const text=localStorage.getItem(key||'');if(!text){toast('移行前のデータがありません。');return false}
    const cur=localStorage.getItem(KEY);if(cur&&cur!==text)localStorage.setItem(KEY+'-replaced-by-restore',cur);
    localStorage.setItem(KEY,text);toast('移行前のデータを手動セーブの枠へ戻しました。');return true;
  }catch(e){toast('戻せませんでした：'+e.message);return false}
}
function saveRestore(input,label,protect=true){
  // 旧データそのものを、移行を試す前に、内容ごとに一度だけ保存する（同じ内容は上書きしない）。移行に失敗してもこの原本は残る。保存できなければ中止する。
  if(!saveBackupOriginal(input))return false;
  let candidate;
  try{candidate=savePrepare(input)}catch(e){toast('ロードできませんでした：'+e.message);return false}
  if(protect&&!saveProtectPrevious())return false;
  stop();remaining=null;setBar(0,0);resume=false;bthEnd();
  S=candidate;saveArmed=true;evHide();sceneX=null;
  go('life');centerScene();saveAutoNow();
  toast(label+'を読み込みました。');
  return true;
}
function saveLoadKey(key,label){
  let raw;
  try{const text=localStorage.getItem(key);if(!text){toast(label+'がありません。');return false}raw=JSON.parse(text)}
  catch(e){toast(label+'を読み込めません：'+e.message);return false}
  return saveRestore(raw,label,key!==SAVE_PROTECT_KEY);
}
function saveManual(){
  try{localStorage.setItem(KEY,saveSnapshot());saveAutoNow();toast('手動セーブしました。')}
  catch(e){toast('セーブできませんでした。JSONを書き出してください。')}
}
function saveExport(){
  if(!S){toast('書き出す人生がありません。');return}
  try{
    const payload={format:SAVE_FORMAT,version:SAVE_EXPORT_VERSION,exportedAt:new Date().toISOString(),state:JSON.parse(saveSnapshot())};
    const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));
    const a=document.createElement('a');
    a.href=url;a.download='kyoto-life-'+String(S.year)+'-'+String(S.age)+'sai.json';
    document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),60000);
    toast('JSONを作成しました。端末に保存してください。');
  }catch(e){toast('書き出しに失敗しました：'+e.message)}
}
async function saveImportFile(file){
  if(!file)return false;
  if(file.size>5*1024*1024){toast('JSONファイルが大きすぎます（上限5MB）。');return false}
  let parsed;
  try{parsed=JSON.parse(await file.text());savePrepare(parsed)}
  catch(e){toast('読み込みを中止しました：'+e.message);return false}
  if(!confirm('今の人生を復元用に保護して、ファイルの人生へ切り替えますか？'))return false;
  return saveRestore(parsed,'JSONファイル');
}
function saveButtons(){
  const protectedButton=$('restore-protected'),previousButton=$('load-prev-auto');
  if(!protectedButton||!previousButton)return;
  try{
    protectedButton.hidden=!localStorage.getItem(SAVE_PROTECT_KEY);
    previousButton.hidden=!localStorage.getItem(SAVE_PREV_KEY);
  }catch(e){protectedButton.hidden=true;previousButton.hidden=true}
}
window.addEventListener('pagehide',()=>saveAutoNow());
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')saveAutoNow()});
