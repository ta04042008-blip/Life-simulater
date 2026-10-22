import {open} from './lib.mjs';

const {browser,page,errs}=await open();
const results=[];const T=(n,ok,d='')=>{results.push([ok,n,d]);console.log((ok?'PASS ':'FAIL ')+n+(d?'  — '+d:''))};
for(const vp of [{width:390,height:844},{width:375,height:667}]){
  await page.setViewportSize(vp);
  await page.evaluate(()=>{newGame('aristocrat');S.npc.forEach(n=>{if(n.rel==='家族'||n.from===0)n.known=true})});
  // 16歳まで進める
  await page.evaluate(()=>{const keep=[render,openResult,showFx,evClose,syncEvent];render=()=>{};openResult=()=>{};showFx=()=>{};evClose=()=>{};syncEvent=()=>{};let g=0;S.policy='学び';
    while(!S.dead&&S.age<16&&g++<3000){if(S.decision){choose(rnd(S.decision.opts.length));continue}if(S.age>=6)S.policy='学び';slots=rollSlots();flushSlots();tick()}
    S.nextSmallT=1e9;S.nextDecT=1e9;S.npc.forEach(n=>{n.known=true;n.dead=false;n.aff=Math.max(n.aff,30)});window.__r=keep});
  await page.evaluate(()=>{location.hash='';});
  // 元の関数を戻す（ページを開き直さず、再定義）
  await page.reload();await page.waitForTimeout(300);
  await page.evaluate(()=>{newGame('aristocrat');S.age=16;S.mode='q';S.npc.forEach(n=>{n.known=true;n.aff=45});S.tm.on=true;S.tm.sh=[0,0,0,0,1];S.tm.v=[30,35,40,38,66];S.star=[1,3,1,2];S.nextSmallT=1e9;S.nextDecT=1e9;render();go('life')});
  await page.waitForTimeout(400);
  const tag=vp.width+'x'+vp.height;
  await page.screenshot({path:`shots/life_${tag}.png`});
  const ov=await page.evaluate(()=>({sw:document.documentElement.scrollWidth,iw:innerWidth,stats:$('stats').innerText.replace(/\n/g,' '),ptm:$('ptm').innerText}));
  T(`[${tag}] 生活画面：横にはみ出さない・★と気質が出る`,ov.sw<=ov.iw+1&&/★★★☆☆/.test(ov.stats)&&/INFJ|INF|I[SN]/.test(ov.ptm),ov.stats+' | '+ov.ptm);
  // 相関図→自分のプロフィール
  await page.evaluate(()=>go('map'));await page.waitForTimeout(250);
  await page.click('[data-prof="self"]');await page.waitForTimeout(250);
  await page.screenshot({path:`shots/self_${tag}.png`});
  const sp=await page.evaluate(()=>({t:$('sheet').innerText.replace(/\n+/g,' / '),ov:document.documentElement.scrollWidth<=innerWidth+1,card:$('sheet').querySelector('.sheet-card').scrollWidth<=$('sheet').querySelector('.sheet-card').clientWidth+1}));
  T(`[${tag}] 自分のプロフィール：能力に★、気質のタイプと各軸`,/★★★☆☆/.test(sp.t)&&/気質/.test(sp.t)&&/タイプ/.test(sp.t)&&sp.ov&&sp.card,sp.t.slice(0,170));
  await page.evaluate(()=>closeSheet());
  // 周りの人（好感度45＝親しい）
  const idx=await page.evaluate(()=>S.npc.findIndex(n=>visible(n)));
  await page.click(`[data-prof="${idx}"]`);await page.waitForTimeout(250);
  await page.screenshot({path:`shots/npc_${tag}.png`});
  const np=await page.evaluate(()=>$('sheet').innerText.replace(/\n+/g,' / '));
  T(`[${tag}] 親しい人のプロフィール：能力の数値・★・気質タイプが見える`,/★/.test(np)&&!/？　★/.test(np.split('気質')[0]||'')&&/タイプ/.test(np),np.slice(0,200));
  await page.evaluate(()=>closeSheet());
  // 親しくない人：数値と気質は「？」、★は見える
  await page.evaluate(()=>{S.npc[0].aff=12;S.npc[0].hist=[]});
  await page.click('[data-prof="0"]').catch(()=>{});await page.waitForTimeout(250);
  const np2=await page.evaluate(()=>$('sheet').innerText.replace(/\n+/g,' / '));
  T(`[${tag}] 親しくない人のプロフィール：数値・気質は「？」、★は見える`,/？　★+☆*/.test(np2)&&/タイプ \/ ？|タイプ ？/.test(np2.replace(/ \/ /g,' ')),np2.slice(0,220));
  await page.evaluate(()=>closeSheet());
  // 小さな選択の画面
  await page.evaluate(()=>{go('life');S.tm.v=[90,50,50,50,50];S.tm.on=true;S.tm.sh=[1,1,1,1,1];S.decision=null;S.t=20;S.nextSmallT=0;S.nextDecT=1e9;S.age=16});
  await page.evaluate(()=>{let g=0;const t0=S.t;while(!S.decision&&g++<50){tick()}render();});
  await page.waitForTimeout(2500);
  await page.screenshot({path:`shots/small_${tag}.png`});
  const sm=await page.evaluate(()=>({has:!!S.decision&&S.decision.small,win:!$('evwin').hidden,tag:document.querySelector('.evtag')&&document.querySelector('.evtag').innerText,opts:[...document.querySelectorAll('.evopts .pbtn')].map(b=>b.innerText.replace(/\n/g,'/')),ov:document.documentElement.scrollWidth<=innerWidth+1,play:$('play').disabled}));
  T(`[${tag}] 小さな選択：専用の帯・選択肢（気質に合う印）・再生は止まる`,sm.has&&sm.win&&sm.tag==='小さな選択'&&sm.opts.length>=2&&sm.ov&&sm.play,JSON.stringify(sm.opts));
  // 選ぶと閉じて続く
  const before=await page.evaluate(()=>JSON.stringify(S.tm.v));
  await page.click('.evopts .pbtn >> nth=0');await page.waitForTimeout(300);
  const after=await page.evaluate(()=>({win:$('evwin').hidden,dec:S.decision,tm:JSON.stringify(S.tm.v),play:$('play').disabled}));
  T(`[${tag}] 選ぶと窓が閉じ、時間が再び進められる`,after.win&&!after.dec&&after.tm!==before&&!after.play,'');
}
const bad=results.filter(r=>!r[0]).length;console.log(`${results.length-bad}/${results.length} PASS`,errs);
await browser.close();
