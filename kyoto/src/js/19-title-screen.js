// 19-title-screen.js — タイトル画面とつづきから
/* ---------- タイトル画面 ---------- */
function titleScreen(){
  const old=$('ttl');if(old)old.remove();
  let has=false;try{has=!!localStorage.getItem(KEY)}catch(e){}
  const el=document.createElement('div');el.className='ttl';el.id='ttl';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label','タイトル');
  const bg=(BG.common&&BG.common.spring)||'';
  el.innerHTML=`<div class="in"><div class="pic" style="background-image:url(${bg})" aria-hidden="true"></div>
    <h1>2000年の地球上の誰か1人。</h1><p class="sub">日本版プロトタイプ（京都）</p>
    <div class="menu" id="tmenu">
      <button class="tb main" id="tgo">はじめる</button>
      ${has?'<button class="tb" id="tcont">つづきから</button>':''}
      <button class="tb" id="tsel">境遇を選ぶ</button>
    </div>
    <div class="list" id="tlist" hidden></div>
    <p class="small">「はじめる」で、時代と境遇はランダムに決まります。</p></div>`;
  document.body.appendChild(el);
  $('tgo').onclick=()=>{el.remove();const b=randomBirth();birthMode='random';newLife(b.pid,b.year,true)};
  if(has)$('tcont').onclick=()=>{el.remove();$('load').onclick()};
  $('tsel').onclick=()=>{
    const l=$('tlist');l.hidden=!l.hidden;
    if(!l.innerHTML)l.innerHTML=Object.keys(PERSONAS).sort((a,b)=>PERSONAS[a].yr[0]-PERSONAS[b].yr[0]).map(k=>`<button class="chip" data-tp="${k}">${PERSONAS[k].label}</button>`).join('');
  };
  el.addEventListener('click',e=>{const t=e.target.closest('[data-tp]');if(t){el.remove();birthMode='select';newLife(t.dataset.tp,undefined,false)}});
  $('tgo').focus();
}
const BTH_ON=()=>!(navigator.webdriver&&!window.__bth);        // 自動テストの画面操作は演出を飛ばす（演出自体は window.__bth=1 で確認する）
function newLife(pid,year,rand){stop();remaining=null;setBar(0,0);resume=false;bthEnd();newGame(pid,year);sceneX=null;go('life');centerScene();if(BTH_ON())birthCeremony(!!rand)}
$('play').onclick=()=>timer?(stop(),render()):start();
$('speed').onclick=()=>{
  const old=SPEEDS[speedIdx][0];speedIdx=(speedIdx+1)%SPEEDS.length;const nw=SPEEDS[speedIdx][0];
  if(timer){stop();if(remaining!=null)remaining=remaining*nw/old;start()}
  else{if(remaining!=null){remaining=remaining*nw/old;setBar(1-remaining/nw,0)}render()}
};
$('adv1').onclick=()=>step(1);$('adv12').onclick=()=>step(S.mode==='q'?4:5);$('advd').onclick=()=>step(0,true);
$('newrand').onclick=()=>{const b=randomBirth();newLife(b.pid,b.year,true)};
document.addEventListener('click',e=>{
  if(evMode&&!e.target.closest('[data-opt]')&&(e.target.closest('#evcard')||e.target.closest('.evback'))){evTap();return}
  const pol=e.target.closest('[data-pol]');if(pol){S.policy=pol.dataset.pol;render()}
  if(e.target.closest('#evbadok')&&S&&S.decision&&!evDecOk(S.decision)){addLog('c',`【イベントの不備】「${S.decision.title||'名称なし'}」に不備（${evDecWhy(S.decision)}）があり、結果を適用せずに中止した`,true);S.decision=null;evBanner();render();return}
  const stc=e.target.closest('[data-stc]');if(stc){const why=stConfirm(stc.dataset.stc,stc.dataset.yes==='1');if(why)toast(why);render();return}
  const op=e.target.closest('[data-opt]');if(op)choose(+op.dataset.opt);
  const p=e.target.closest('[data-p]');if(p&&birthMode==='select')newLife(p.dataset.p,undefined,false);
  const bm=e.target.closest('[data-bm]');if(bm){birthMode=bm.dataset.bm;render()}
  const pr=e.target.closest('[data-prof]');if(pr)openProfile(pr.dataset.prof);
  if(e.target.closest('[data-close]'))closeSheet();
  if(e.target.closest('[data-next]')){if(birthMode==='random'){const b=randomBirth();newLife(b.pid,b.year,true)}else newLife(S.pid,undefined,false)}
});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape')closeSheet();
  if(evMode==='result'&&(e.key==='Enter'||e.key===' ')){e.preventDefault();evTap()}
  if((e.key==='Enter'||e.key===' ')&&e.target.closest&&e.target.closest('[data-prof]')){e.preventDefault();openProfile(e.target.closest('[data-prof]').dataset.prof)}
});
function go(name){
  closeSheet();
  if(!$('scr-life').hidden&&sc().clientWidth)sceneX=sc().scrollLeft;
  /* 画面を移っても再生は止めない（決断が起きたら、その時点で止まり、生活に戻ると窓が開く） */
  ['life','map','home','act','menu'].forEach(k=>{$('scr-'+k).hidden=k!==name});
  document.querySelectorAll('.nav button').forEach(b=>{b.toggleAttribute('aria-current',b.dataset.go===name);if(b.dataset.go===name)b.setAttribute('aria-current','page')});
  $('topbar').style.visibility=name==='life'?'visible':'hidden';
  $('topbar').style.height=name==='life'?'':'0';$('topbar').style.padding=name==='life'?'':'0';
  render();window.scrollTo(0,0);
  if(name==='life'){if(sceneX==null)centerScene();else sc().scrollLeft=sceneX}
}
document.querySelectorAll('.nav button').forEach(b=>b.onclick=()=>go(b.dataset.go));

const KEY='kyoto-kurashi-mihon-v4';
function toast(t){$('toast').textContent=t}
$('totitle').onclick=()=>{stop();titleScreen()};
$('save').onclick=()=>{try{localStorage.setItem(KEY,JSON.stringify(S));toast('セーブしました。')}catch(e){toast('この環境では保存できません。')}};
$('load').onclick=()=>{try{const v=localStorage.getItem(KEY);if(!v){toast('セーブデータがありません。');return}stop();remaining=null;setBar(0,0);const raw=JSON.parse(v);if(!raw.sv){try{localStorage.setItem(KEY+'-premigrate',v)}catch(_){}}   /* 状態システム導入前のセーブは、移行前のコピーを残す */
  S=migrate(raw);evHide();render();centerScene();toast('ロードしました。')}catch(e){toast('ロードできませんでした。'+(e&&e.message&&/新しい版/.test(e.message)?'（'+e.message+'）':''))}};

function kzNode(n){
  if(n.nodeType===3){if(n.parentNode&&/^(SCRIPT|STYLE)$/.test(n.parentNode.nodeName))return;const v=kz(n.nodeValue);if(v!==n.nodeValue)n.nodeValue=v;return}
  if(n.nodeType!==1||/^(SCRIPT|STYLE)$/.test(n.nodeName))return;
  const w=document.createTreeWalker(n,NodeFilter.SHOW_TEXT);let c;
  while((c=w.nextNode())){if(/^(SCRIPT|STYLE)$/.test(c.parentNode.nodeName))continue;const v=kz(c.nodeValue);if(v!==c.nodeValue)c.nodeValue=v}
}
new MutationObserver(ms=>{for(const m of ms){if(m.type==='characterData')kzNode(m.target);else m.addedNodes.forEach(kzNode)}}).observe(document.body,{childList:true,subtree:true,characterData:true});
kzNode(document.body);
(function kzStatic(){const w=document.createTreeWalker($('scr-map'),NodeFilter.SHOW_TEXT);const ns=[];while(w.nextNode())ns.push(w.currentNode);ns.forEach(n=>{n.nodeValue=kz(n.nodeValue)})})();
$('personas').innerHTML=Object.keys(PERSONAS).sort((a,b)=>PERSONAS[a].yr[0]-PERSONAS[b].yr[0]).map(k=>`<button class="chip" data-p="${k}" aria-pressed="false">${PERSONAS[k].label}</button>`).join('');
newGame('common');
render();
centerScene();
if(!(navigator.webdriver&&!window.__ttl))titleScreen();      // 自動テストでは出さない（確認は window.__ttl=1）
