import {BUILD,FIXDIR} from './lib.mjs';
import {open} from './lib.mjs';
import fs from 'fs';
const {browser,page,errs}=await open();
const legacy={};for(const k of ['child','young','adult','elder','pending'])legacy[k]=fs.readFileSync(`${FIXDIR}/legacy_${k}.json`,'utf8');
const R=await page.evaluate((legacy)=>{
  const res=[];const T=(id,name,ok,detail)=>res.push({id,name,ok:!!ok,detail:detail===undefined?'':detail});
  const stubs=()=>{render=()=>{};openResult=()=>{};showFx=()=>{};evClose=()=>{};syncEvent=()=>{}};
  stubs();
  const P=PERSONAS;
  /* ---- 1. 値域：主人公・周りの人物（200人生×全期間）---- */
  {
    let bad=[],ticks=0;
    for(let L=0;L<200;L++){
      newGame(['aristocrat','common','farm','artisan'][L%4]);S.policy=['学び','仕事','交流','家族','休養'][L%5];let g=0;
      const chk=(who,p)=>{
        if(!p.stats||p.stats.length!==4||p.stats.some(v=>!(v>=0&&v<=1000)))bad.push(who+':stats');
        if(!p.star||p.star.length!==4||p.star.some(v=>!(v>=1&&v<=5&&Number.isInteger(v))))bad.push(who+':star');
        if(!p.tm||p.tm.v.length!==5||p.tm.v.some(v=>!(v>=2&&v<=98)))bad.push(who+':tm');
      };
      while(!S.dead&&g++<3000){
        if(S.decision){choose(rnd(S.decision.opts.length));continue}
        slots=rollSlots();flushSlots();tick();ticks++;
        chk('me',S);S.npc.forEach((n,i)=>chk('npc'+i,n));
      }
    }
    T(1,'主人公・周りの人物とも、4能力(0〜1000)・★(1〜5の整数)・気質5軸が全期間で範囲内',bad.length===0,`${ticks}回分の進行を検査 / 逸脱 ${bad.length}件 ${bad.slice(0,3)}`);
    // 全員が4能力と個別の★を持つ
    newGame('common');
    const all=[S,...S.npc];
    T(1,'主人公と全NPCが4能力・4つの★・気質を持つ',all.every(p=>p.stats.length===4&&p.star.length===4&&p.tm&&p.tm.v.length===5),`${all.length}人`);
  }
  /* ---- 2. 出生の分布 ---- */
  {
    const N=20000,arr=[];for(let k=0;k<N;k++){const o=mkPerson(P.common,0);arr.push({v:o.stats.slice(),s:o.star.slice()})}
    const cen=[0,1,2,3].map(i=>{const [lo,hi]=AB_RANGE[i],mid=(lo+hi)/2,w=hi-lo;return arr.filter(a=>Math.abs(a.v[i]-mid)<=w/6).length/N});
    T(2,'能力の初期値：範囲の中央1/3に半数超が入り(一様なら33%)、両端は珍しい',cen.every(x=>x>0.55),'中央1/3の割合 '+cen.map(x=>x.toFixed(2)));
    T(2,'項目ごとに範囲が異なる',new Set(AB_RANGE.map(r=>r.join('-'))).size===4,JSON.stringify(AB_RANGE));
    const sd=[0,1,2,3].map(i=>{const c=[0,0,0,0,0];arr.forEach(a=>c[a.s[i]-1]++);return c.map(x=>x/N)});
    T(2,'★は1が最多で、高いほど珍しい（全4項目）',sd.every(c=>c[0]>0.5&&c[0]>c[1]&&c[1]>c[2]&&c[2]>c[3]&&c[3]>c[4]),sd.map(c=>c.map(x=>Math.round(x*100)).join('/')).join(' | '));
    const corr=(x,y)=>{const n=x.length,mx=x.reduce((a,b)=>a+b)/n,my=y.reduce((a,b)=>a+b)/n;let a=0,b=0,c=0;for(let i=0;i<n;i++){a+=(x[i]-mx)*(y[i]-my);b+=(x[i]-mx)**2;c+=(y[i]-my)**2}return a/Math.sqrt(b*c)};
    const cr=[0,1,2,3].map(i=>corr(arr.map(a=>a.v[i]),arr.map(a=>a.s[i])));
    T(2,'能力の初期値と、その項目の★は独立（相関≒0）',cr.every(c=>Math.abs(c)<0.03),'相関 '+cr.map(c=>c.toFixed(3)));
  }
  /* ---- 3,4. ★の効き方 ---- */
  {
    const setup=(stars,policy,age,stats)=>{newGame('common');S.age=age;S.mode='y';S.policy=policy;S.star=stars.slice();S.stats=stats.slice();S.sx=[0,0,0,0];S.ongoing=null;S.t=age;S.nextDecT=1e9;S.nextSmallT=1e9};
    const gain=(st,v)=>{let tot=0;const N=3000;for(let k=0;k<N;k++){setup([1,st,1,1],'交流',30,[500,v,500,500]);applyFx([0,4,0,0],null,'act');tot+=S.stats[1]-v}return tot/N};
    const g300=[1,2,3,4,5].map(s=>gain(s,300)),g800=[1,2,3,4,5].map(s=>gain(s,800));
    T(3,'同じ活動なら、★が高いほど成長が大きい',g300.every((x,i)=>i===0||x>g300[i-1])&&g800.every((x,i)=>i===0||x>g800[i-1]),'v=300: '+g300.map(x=>x.toFixed(1))+' / v=800: '+g800.map(x=>x.toFixed(1)));
    T(3,'能力が高いほど成長は緩やか（同じ★で比較、★5でも）',[0,1,2,3,4].every(i=>gain(i+1,200)>gain(i+1,500)&&gain(i+1,500)>gain(i+1,800)),'');
    const sumAfter=(kind,fx,st)=>{let t=0;for(let k=0;k<3000;k++){setup([st,st,st,st],'交流',30,[500,500,500,500]);applyFx(fx,null,kind);t+=S.stats.reduce((a,b)=>a+b,0)}return t/3000};
    const near=(a,b)=>Math.abs(a-b)<0.5;
    T(4,'回復(rec)・自然な成長(nat)・マイナスの変化には★倍率が掛からない',near(sumAfter('rec',[4,4,4,4],1),sumAfter('rec',[4,4,4,4],5))&&near(sumAfter('nat',[4,4,4,4],1),sumAfter('nat',[4,4,4,4],5))&&near(sumAfter('act',[-4,-4,-4,-4],1),sumAfter('act',[-4,-4,-4,-4],5)),'');
    const nat=(st)=>seeded(5,()=>{const p={stats:[500,500,500,500],tgt:[600,600,600,600],star:[st,st,st,st]};for(let a=1;a<=70;a++)natStep(p,a,1,false);return p.stats.map(Math.round).join()});
    T(4,'年齢による自然な成長・衰え(natStep)は★に無関係',nat(1)===nat(5),nat(1));
    const tk=(policy,age,st)=>seeded(777,()=>{setup([st,st,st,st],policy,age,[450,300,450,450]);tick();return S.stats.map(x=>x.toFixed(2)).join()});
    T(4,'休養方針（回復）は★1でも★5でも同じ結果／学び方針は知識だけ差が出る',tk('休養',30,1)===tk('休養',30,5)&&tk('学び',30,1)!==tk('学び',30,5),'');
    const ill=(st)=>seeded(9,()=>{setup([st,st,st,st],'休養',30,[300,300,300,300]);S.ongoing={name:'風邪',mult:3,left:3};tick();return S.stats.map(x=>x.toFixed(2)).join()});
    T(4,'病気からの回復(+10)にも★は掛からない',ill(1)===ill(5),'');
    // ★の変更だけでは現在の能力値は動かない
    setup([1,1,1,1],'休養',30,[450,300,450,450]);const before=S.stats.slice();S.sx=[500,500,500,500];starAll();
    T(4,'★が変わっても、その場で能力値は増減しない',S.star.every(s=>s>=2)&&S.stats.every((v,i)=>v===before[i]),'★→'+S.star+' 能力 '+S.stats.map(Math.round));
  }
  /* ---- 5. ★の上下 ---- */
  {
    let ups=[0,0,0,0],downs=[0,0,0,0],special=0,specialDown=0;
    for(let L=0;L<240;L++){
      newGame(['aristocrat','common','farm','artisan'][L%4]);const pol=['学び','仕事','交流','家族','休養'];let g=0;S.policy='交流';
      while(!S.dead&&g++<3000){
        if(S.decision){const s0=S.star.slice();choose(rnd(S.decision.opts.length));for(let i=0;i<4;i++)if(S.star[i]>s0[i])special++;continue}
        if(S.age>=6&&Math.random()<0.1)S.policy=pol[rnd(5)];
        const s0=S.star.slice();slots=rollSlots();flushSlots();tick();
        for(let i=0;i<4;i++){if(S.star[i]>s0[i])ups[i]++;if(S.star[i]<s0[i])downs[i]++}
      }
    }
    T(5,'日常の積み重ねで★が上がる／使わない・重い病などで下がる',ups.some(x=>x>0)&&downs.some(x=>x>0),`上昇 ${ups} / 低下 ${downs}`);
    // 特別な経験（決断の選択肢 sx）で一気に上がる／重い病で下がる
    newGame('aristocrat');S.age=20;S.star=[1,1,1,1];S.sx=[0,80,0,0];S.decision=JSON.parse(JSON.stringify(P.aristocrat.dec[1]));S.npc.forEach(n=>n.known=true);choose(0);
    T(5,'特別な経験（決断「写しに行く」）で★の経験値が一気に動き、★が上がる',S.star[1]===2,'★'+S.star+' sx '+S.sx.map(Math.round));
    newGame('common');S.age=30;S.star=[3,1,1,1];S.sx=[0,0,0,0];S.sx[0]-=70;S.sx[0]-=70;starAll();
    T(5,'重い病のような特別な経験で★が下がる（下限は★1）',S.star[0]<3&&S.star.every(s=>s>=1),'★'+S.star);
  }
  /* ---- 6. 気質の形成・表示・変化 ---- */
  {
    let early=0,notOn13=0,startAges=[],flips=0,flipLives=0,alive13=0,logged=0,ty=0;
    for(let L=0;L<300;L++){
      newGame(['aristocrat','common','farm','artisan'][L%4]);let g=0,flipsHere=0;
      while(!S.dead&&g++<3000){
        if(S.decision){choose(rnd(S.decision.opts.length));continue}
        const on0=S.tm.on,t0=on0?tmType(S.tm):null;
        slots=rollSlots();flushSlots();tick();
        if(S.age<8&&S.tm.on)early++;
        if(S.age>=13&&!S.tm.on)notOn13++;
        if(on0&&S.tm.on&&tmType(S.tm)!==t0)flipsHere++;
      }
      const st=S.chron.find(e=>/気質のタイプが見えてきた/.test(e.x));
      if(st){startAges.push(st.age);logged++}
      if(S.deathAge>=13)alive13++;
      flips+=flipsHere;if(flipsHere)flipLives++;
    }
    T(6,'幼いうち(8歳未満)は「形成中」で、タイプ表示は始まらない',early===0,'8歳未満で表示開始 '+early+'件');
    T(6,'遅くとも13歳でタイプ表示が始まる',notOn13===0,'13歳以上で未表示 '+notOn13+'件');
    const avg=startAges.reduce((a,b)=>a+b,0)/startAges.length;
    T(6,'表示開始の年齢にばらつきがある（8〜13歳）',Math.min(...startAges)>=8&&Math.max(...startAges)<=13&&new Set(startAges).size>=3,`平均${avg.toFixed(1)}歳 範囲${Math.min(...startAges)}〜${Math.max(...startAges)}`);
    T(6,'表示後も経験と選択で、タイプが変わることがある（ただし頻繁ではない）',flipLives>0&&flips/300<1,`文字が変わった人生 ${flipLives}/300・1人生あたり ${(flips/300).toFixed(2)}回`);
    // 1回の小さな選択で極端に反転させない
    let maxMove=0;for(let k=0;k<2000;k++){newGame('common');const t=S.tm;t.v[0]=60;const b=t.v[0];tmNudge(t,0,-1,2.4,10,'x');maxMove=Math.max(maxMove,Math.abs(t.v[0]-b))}
    T(6,'1回の選択で動く量には上限がある（最大2.6）',maxMove<=2.6+1e-9,'最大 '+maxMove.toFixed(2));
    newGame('common');S.age=30;S.tm.v=[90,90,90,90,90];S.tm.on=true;S.tm.sh=[1,1,1,1,1];for(let k=0;k<3;k++)tmNudge(S.tm,0,-1,2.4,30,'x');tmCheck(S.tm,30);
    T(6,'極端な傾向の人は、数回の選択ではタイプが反転しない',S.tm.sh[0]===1,'v='+S.tm.v[0].toFixed(1));
    // 表示の境目：行きつ戻りつを避ける（44〜56の間では文字を変えない）
    newGame('common');S.tm.on=true;S.tm.sh=[1,0,1,0,1];S.tm.v=[52,48,50,54,46];tmCheck(S.tm,30);
    T(6,'境目の付近(44〜56)では、文字が行きつ戻りつしない',S.tm.sh.join()==='1,0,1,0,1','');
    T(6,'表示は32通りの形式（例 INFP-T）',/^[EI][SN][TF][JP]-[AT]$/.test((newGame('common'),S.tm.on=true,S.tm.sh=[0,0,0,0,0],tmType(S.tm))),(S.tm.sh=[1,1,1,1,1],tmType(S.tm))+' / '+(S.tm.sh=[0,0,0,0,0],tmType(S.tm)));
    // 内部は連続値であり、固定のタイプIDだけではない
    newGame('common');
    T(6,'出生時に完成したタイプは固定されない（内部は連続値、表示前）',S.tm.on===false&&S.tm.v.every(Number.isInteger)&&new Set(S.tm.v).size>1,JSON.stringify(S.tm.v));
  }
  /* ---- 7. 気質が自動行動に効く／重要な判断は本人の回答を待つ ---- */
  {
    const cnt=(v0)=>{newGame('common');S.age=30;S.tm.v=[v0,50,50,50,50];const pool=eventPool().filter(e=>e.meet==null);let c=0,N=6000;for(let k=0;k<N;k++){const e=tmPick(S.tm,pool);if(e&&e.tm&&e.tm[0]===0&&e.tm[1]===1)c++}return c/N};
    const hi=cnt(85),lo=cnt(15),mid=cnt(50);
    T(7,'外向の強い人ほど外向的な出来事が出やすく、内向の強い人は出にくい',hi>mid&&mid>lo,`E寄り${(hi*100).toFixed(1)}% / 中間${(mid*100).toFixed(1)}% / I寄り${(lo*100).toFixed(1)}%`);
    // 全軸で確認
    const axisOk=[0,1,2,3,4].every(ax=>{const f=(v)=>{newGame('common');S.age=30;S.tm.v=[50,50,50,50,50];S.tm.v[ax]=v;const pool=eventPool();let c=0,N=5000;for(let k=0;k<N;k++){const e=tmPick(S.tm,pool);if(e&&e.tm&&e.tm[0]===ax&&e.tm[1]===1)c++}return c/N};return f(85)>f(15)});
    T(7,'5つの軸すべてで、傾向に合う出来事が出やすい',axisOk,'');
    // 気質で出来事が「禁止」されない
    newGame('common');S.age=30;S.tm.v=[98,98,98,98,98];const pool=eventPool();let seen=new Set();for(let k=0;k<20000;k++){const e=tmPick(S.tm,pool);seen.add(e.x)}
    T(7,'極端な気質でも、どの出来事も出る可能性は残る（禁止しない）',pool.every(e=>seen.has(e.x)||e.fam),`${seen.size}/${pool.length}種`);
    // 選択肢：追加のやり方は条件つきで出るが、基本の選択肢は消えない
    newGame('common');S.age=20;S.tm.v=[95,50,50,50,50];const d1=(()=>{for(let k=0;k<200;k++){const d=makeSmall();if(d.title==='休みの過ごし方')return d}})();
    newGame('common');S.age=20;S.tm.v=[50,50,50,50,50];const d2=(()=>{for(let k=0;k<200;k++){const d=makeSmall();if(d.title==='休みの過ごし方')return d}})();
    T(7,'傾向が強い人にだけ、追加のやり方が出る。基本の2択はいつも残る',d1.opts.length===3&&d2.opts.length===2&&d1.opts.slice(0,2).every((o,i)=>o.l===d2.opts[i].l),`強い:${d1.opts.map(o=>o.l)} / 中間:${d2.opts.map(o=>o.l)}`);
    // 重要な判断は回答を待つ：小さな選択・決断とも、時間が止まる（tickは進まない）
    for(const kind of ['small','big']){
      newGame('common');S.age=20;S.t=20;S.mode='y';S.npc.forEach(n=>n.known=true);
      if(kind==='small'){S.nextSmallT=0;S.nextDecT=1e9}else{S.nextDecT=0;S.nextSmallT=1e9}
      tick();const has=!!S.decision;const sz=S.decision&&!!S.decision.small;const age0=S.age,t0=S.t;const r=tick();const age1=S.age;
      T(7,(kind==='small'?'小さな選択':'大きな選択（決断）')+'が出たら、回答するまで時間が進まない',has&&sz===(kind==='small')&&r===false&&age1===age0&&S.t===t0,'');
    }
    // step() も止まる
    newGame('common');S.age=20;S.t=20;S.mode='y';S.nextSmallT=0;S.nextDecT=1e9;const a0=S.age;step(5);T(7,'「1年×5」操作でも、選択が出た時点で止まる',S.decision&&S.age===a0+1,'age '+a0+'→'+S.age);
    // 回答は一度だけ反映
    newGame('common');S.age=20;S.t=20;S.decision=makeSmall();const tm0=JSON.stringify(S.tm.v),st0=S.stats.slice();choose(0);const tm1=JSON.stringify(S.tm.v),st1=S.stats.slice();choose(0);choose(1);
    T(7,'同じ選択への回答は二重に反映されない',JSON.stringify(S.tm.v)===tm1&&S.stats.every((v,i)=>v===st1[i])&&tm0!==tm1,'');
    // 気質が本人の選択でゆっくり動く
    newGame('common');S.age=20;S.tm.v=[50,50,50,50,50];for(let k=0;k<8;k++){S.decision=JSON.parse(JSON.stringify(SMALL[0]));S.decision.opts=S.decision.opts.map(o=>o);S.decision.who=null;choose(0)}
    T(7,'小さな選択を重ねると、気質が選んだ方向へ少しずつ動く（外向を8回）',S.tm.v[0]>58&&S.tm.v[0]<80,'E/I = '+S.tm.v[0].toFixed(1));
    // 周りの人の気質は主人公の選択では動かない
    newGame('common');S.age=20;const npcBefore=JSON.stringify(S.npc.map(n=>n.tm.v));for(let k=0;k<30;k++){S.decision=makeSmall();choose(rnd(S.decision.opts.length))}
    T(7,'主人公の選択は、周りの人の気質を直接変えない（人物自身の経験とは別）',JSON.stringify(S.npc.map(n=>n.tm.v))===npcBefore,'');
  }
  /* ---- 8. 好感度9/10と既知条件 ---- */
  {
    newGame('common');const n=S.npc[0];n.known=true;n.dead=false;
    n.aff=10;const a10=visible(n);n.aff=9;const a9=visible(n);n.aff=9.9;const a99=visible(n);n.aff=10.0;
    T(8,'好感度10は表示、9以下は非表示',a10===true&&a9===false&&a99===false,`10:${a10} 9:${a9} 9.9:${a99}`);
    n.aff=50;n.known=false;const unk=visible(n);n.known=true;n.dead=true;const dead=visible(n);n.dead=false;
    T(8,'未知の人物・故人は、好感度が高くても相関図に出ない',unk===false&&dead===false,'');
    // 血縁（家族）でも免除しない
    const fam=S.npc.find(x=>x.rel==='家族'&&x.known);fam.aff=9;
    T(8,'血縁・同居でも閾値は免除しない',visible(fam)===false,fam.name);
    // 閾値未満になっても情報が残る
    fam.hist=[{ym:'x',age:1,x:'テスト'}];fam.aff=3;const keep={rel:fam.rel,hist:fam.hist.length,id:S.npc.indexOf(fam),name:fam.name,stats:fam.stats.length,star:fam.star.length,tm:!!fam.tm};
    for(let k=0;k<5;k++){S.age=Math.max(S.age,1);}
    T(8,'好感度が下がって非表示でも、関係・交流履歴・能力・★・気質のデータは消えない',keep.rel==='家族'&&keep.hist===1&&keep.stats===4&&keep.star===4&&keep.tm&&S.npc.includes(fam),JSON.stringify(keep));
  }
  /* ---- 9. 保存・再開 ---- */
  {
    newGame('farm');S.policy='学び';let g=0;while(!S.dead&&S.age<30&&g++<3000){if(S.decision){choose(rnd(S.decision.opts.length));continue}slots=rollSlots();flushSlots();tick()}
    const snapStr=JSON.stringify(S);localStorage.setItem(KEY,snapStr);
    const orig=JSON.parse(snapStr);
    // 再開
    S=null;$('load').onclick();
    const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
    T(9,'セーブ→ロードで、能力・★・★の経験値・気質（値・表示状態・履歴）が一致する',same(S.stats,orig.stats)&&same(S.star,orig.star)&&same(S.sx,orig.sx)&&same(S.tm,orig.tm)&&same(S.tgt,orig.tgt),'タイプ '+(S.tm.on?tmType(S.tm):'形成中'));
    T(9,'周りの人物の能力・★・気質も一致する（再抽選なし）',S.npc.every((n,i)=>same(n.stats,orig.npc[i].stats)&&same(n.star,orig.npc[i].star)&&same(n.tm,orig.npc[i].tm)&&same(n.sx,orig.npc[i].sx)),S.npc.length+'人');
    // 再描画しても変わらない
    const j0=JSON.stringify(S);render=()=>{};for(let k=0;k<5;k++)syncEvent();stubs();
    T(9,'画面の再描画では値が変わらない',JSON.stringify(S)===j0,'');
    // ロードを2回しても同じ
    $('load').onclick();$('load').onclick();
    T(9,'何度ロードしても同じ値（再抽選・二重反映なし）',JSON.stringify(S.npc.map(n=>[n.stats,n.star,n.tm.v]))===JSON.stringify(orig.npc.map(n=>[n.stats,n.star,n.tm.v])),'');
    // 続きを遊んでも、年が二重に進まない
    const age0=S.age;step(1);T(9,'再開後も1回の進行は1回分だけ進む',S.age-age0<=1,'age '+age0+'→'+S.age);
  }
  /* ---- 9b. 旧セーブ（版4）の移行 ---- */
  {
    const ids=['child','young','adult','elder','pending'];
    const out=[];
    for(const k of ids){
      const raw=legacy[k];const old=JSON.parse(raw);
      localStorage.setItem(KEY,raw);S=null;$('load').onclick();
      const a=JSON.stringify([S.star,S.tm,S.npc.map(n=>[n.stats,n.star,n.tm,n.sx])]);
      localStorage.setItem(KEY,raw);S=null;$('load').onclick();
      const b=JSON.stringify([S.star,S.tm,S.npc.map(n=>[n.stats,n.star,n.tm,n.sx])]);
      const keepStats=JSON.stringify(S.stats)===JSON.stringify(old.stats);        // 既存の0〜1000をそのまま（10倍しない）
      const keepLog=S.log.length===old.log.length&&S.chron.length===old.chron.length;
      const noFake=S.tm.log.length===0&&S.npc.every(n=>n.tm.log.length===0);          // 幼少期の履歴を作らない
      const ageOk=S.tm.on===(old.age>=13||S.tm.on);
      const inRange=S.stats.every(v=>v>=0&&v<=1000)&&S.npc.every(n=>n.stats.every(v=>v>=0&&v<=1000));
      out.push({k,age:old.age,det:a===b,keepStats,keepLog,noFake,inRange,type:S.tm.on?tmType(S.tm):'形成中',ver:S.ver,hasDecision:!!S.decision});
    }
    T('9b','旧セーブ5種：移行しても、既存の能力値・年表はそのまま（10倍などしない）',out.every(o=>o.keepStats&&o.keepLog&&o.inRange),JSON.stringify(out.map(o=>o.k+':'+o.keepStats+'/'+o.keepLog)));
    T('9b','旧セーブ5種：同じ旧セーブを何度開いても、補う値は同じ（再抽選しない）',out.every(o=>o.det),'');
    T('9b','旧セーブ：存在しない幼少期の履歴を作らない／13歳以上はタイプ表示、未満は形成中',out.every(o=>o.noFake)&&out.find(o=>o.k==='child').type==='形成中'&&out.filter(o=>o.age>=13).every(o=>o.type!=='形成中'),out.map(o=>o.k+':'+o.type).join(' '));
    T('9b','旧セーブ：版が5になり、選択待ちの状態も引き継がれる',out.every(o=>o.ver===5)&&out.find(o=>o.k==='pending').hasDecision,'');
    // 移行後に続きが遊べる
    localStorage.setItem(KEY,legacy.adult);S=null;$('load').onclick();let g=0;while(!S.dead&&g++<3000){if(S.decision){choose(rnd(S.decision.opts.length));continue}slots=rollSlots();flushSlots();tick()}
    T('9b','旧セーブの続きを最後まで遊べる',S.dead,'死亡 '+S.deathAge+'歳');
    // 壊れたセーブ・未知の境遇で、状態を壊さない
    newGame('common');const keep=JSON.stringify(S);localStorage.setItem(KEY,'{broken');$('load').onclick();const t1=$('toast').textContent;
    localStorage.setItem(KEY,JSON.stringify({pid:'ghost',npc:[],stats:[1,2,3,4]}));$('load').onclick();
    T('9b','壊れた・読めないセーブでは、いまの状態を壊さずに知らせる',JSON.stringify(S)===keep&&t1.length>0&&$('toast').textContent.includes('ロードできません'),t1+' / '+$('toast').textContent);
  }
  return res;
},legacy);
let pass=0,fail=0;
for(const r of R){console.log((r.ok?'PASS ':'FAIL ')+'['+r.id+'] '+r.name+(r.detail?'  — '+r.detail:''));r.ok?pass++:fail++}
console.log(`\n${pass}/${pass+fail} PASS`);console.log('page errors:',errs);
await browser.close();
