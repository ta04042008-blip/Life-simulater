// 09-state-cases-aftermath.js — 件（進行中のこと）、大きな選択の後日談、件の完了時の書き込み
/* ---------- 件（進行中のことがら） ---------- */
function stNewTh(c,ctx){
  const th={id:'T'+(++S.thN),ev:ctx.ev,j:ctx.j,seq:ctx.seq,m:c.m,ck:c.ck,ttl:c.ttl,sk:c.sk,jd:c.jd||'c',st:'',why:'',
            tid:c.tid||null,ntg:c.ntg||0,pid:ctx.pid||c.pid||null,mo0:S.mo,tk0:S.tk||0,chk:S.mo+(c.w!=null?c.w:1),
            due:c.du!=null?S.mo+c.du:null,tm:c.tm||0,amt:c.amt||0,rq:c.rq||null,ef:c.ef||[],ok:c.ok||'',ng:c.ng||'',ex:c.ex||'',cur:c.cur||'',
            cd:c.cd||null,hold:c.hold||'',sx:c.sx||null,lost:c.lost||'',co:c.co||null,cox:c.cox||null};
  if(c.sk==='work'){const L=c.len||1,T=c.tm||0;th.len=L;th.prog=0;th.pm=[];for(let i=0;i<L;i++)th.pm.push(Math.floor(T/L)+(i<T%L?1:0))}   // 自由時間は合計を月数で分けて使う
  if(ctx.sp){th.sp=JSON.parse(JSON.stringify(ctx.sp));th.nmo=S.mo+th.sp.m;if(c.sk==='note')th.chk=th.nmo}
  if(c.hd){th.hd=c.hd;stHdApply(th,'go')}
  if(c.ob){const o=stObjEnsure(c.ob);if(o)th.obj=o.nm}
  th.st=c.sk==='conf'?'本人確認待ち':c.sk==='ask'?'相手返答待ち':c.sk==='search'?'候補探し':c.sk==='note'?'作業中':'実行待ち';
  const openN=S.ths.filter(t=>ST_OPEN.includes(t.st)&&!t.queued).length;
  if(openN>=ST_MAXTH){th.queued=1;th.why='同時に進める件が多いため、新規受付待ち';addLog('c',`進行中のことが多すぎるため、「${th.ttl}」は順番を待つことになった。`,true)}
  if(th.hold)stHold(ctx.ev,c.m,'件',th.hold);
  S.ths.push(th);
  if(th.sk==='conf'&&!th.queued)addLog('c',`「${th.ttl}」について、あなたの返事を待っている。（家計画面で選べる）`,true);
  return th;
}
function thReq(th){
  const q=th.rq;
  const cs=[];if(th.co)cs.push(th.co);if(th.cox)cs.push(...th.cox);
  if(cs.length&&!th.rsv){
    for(const x of cs)if(stAvail(x.a)<x.n)return ST_NAME[x.a]+'が足りない';
    cs.forEach(x=>{S.hh.rv[x.a]+=x.n});                                  // 予約：持っている量は減らさず、使える量だけを減らす
    th.rsv={a:cs[0].a,n:cs[0].n};th.rsx=cs.slice(1).map(x=>({a:x.a,n:x.n}));
  }
  if(q){
    if(q.worked&&S.wk.worked<q.worked)return `仕事の実施月数が足りない（${S.wk.worked}/${q.worked}か月）`;
    if(q.dmgmax!=null&&S.hs.dmg>q.dmgmax)return '住まいの傷みが大きく、迎えられる状態ではない';
    if(q.lv&&skillLv(S.skill)<q.lv)return `技能がLv${q.lv}に届いていない`;
    if(q.fund&&stAvail('fund')<stV(q.fund))return '資金が足りない';
    if(q.goods&&stAvail('goods')<stV(q.goods))return '物資が足りない';
    if(q.hold&&th.amt&&stAvail('fund')<th.amt)return '分けられる資金が足りない';
  }
  if(th.ef.some(x=>x[0]==='invest'||x[0]==='repay')&&th.amt&&th.ef.some(x=>x[0]==='invest')&&stAvail('fund')<th.amt)return '資金が足りない';
  return '';
}
function thRelease(th){
  if(th.rsv){S.hh.rv[th.rsv.a]=Math.max(0,S.hh.rv[th.rsv.a]-th.rsv.n);th.rsv=null}
  if(th.rsx){th.rsx.forEach(x=>{S.hh.rv[x.a]=Math.max(0,S.hh.rv[x.a]-x.n)});th.rsx=null}
}
function thClose(th,st,text){
  if(!ST_OPEN.includes(th.st))return;
  th.st=st;th.end=S.mo;thRelease(th);
  if(th.loan)stLoanAfter(th,'ng');
  stHdApply(th,'ng');
  if(th.ev==='COMP')stCompEnd();
  if(th.ev==='CARE')stCareEnd();
  if(text)addLog('r',stTx(th,text),true);
}
function thLog(th,res){
  const t=res==='ok'?th.ok:(th.ng||th.ok);
  if(t)addLog('r',stTx(th,t),true);
}
function thResolve(th,res){
  if(th.fin)return;
  th.fin=1;th.res=res;
  try{stEff(th,res)}catch(err){stBad(`件「${th.ttl}」`,res,'完了時の変更で異常：'+(err&&err.message||err),th)}
  th.st=res==='ok'?'完了':'断られた';th.end=S.mo;th.why='';thRelease(th);
  if(th.loan)stLoanAfter(th,res);
  stHdApply(th,res==='ok'?'ok':'ng');
  if(th.sp&&th.sp.k!=='C')stSpFx(th,res);
  if(!th.sp||th.notified||th.sp.k==='C')thLog(th,res);                                    // 後日談の付くものは、通知の月に文を出す（通知のあとに完了したときは、ここで一度だけ）
}
/* 大きな選択の後日談：能力・好感度は、判定が確定した時に一度だけ。文は通知の月に出す */
function stSpFx(th,res){
  if(th.spf)return;                                                        // 後日談の効果は一度だけ（確定時と通知時の二重適用をしない）
  const sp=th.sp;
  if(sp.k==='C')res='ok';                                                  // 他の仕組みの現状を知らせるだけ（判定なし）
  if(res==='ng'&&!sp.ng){th.spf=1;th.spx=null;return}                      // 断られた時に、成功の報いは付けない
  const r=(res==='ng'&&sp.ng)?sp.ng:sp.ok;
  if(!r||!evStr(r.x)||!evFx4(r.fx)){evProblem(`後日談（${th.ev}）の内容が不正なため、適用せずに中止した`);return}
  th.spf=1;th.spx=r.x;
  const pi=npcIdx(th.pid),pn=pi>=0?S.npc[pi]:null,np={};
  if(pn&&!pn.dead&&r.af)np[pi]=r.af>0?evFol(r.af):-clamp(Math.abs(r.af),1,2);
  applyFx(r.fx.map(evFol),np,'rec',1);
  if(pn&&np[pi])hist(pi,r.x);
  lastBubble=res==='ok'?'ありがたい！':'うーん…';
}
const stOpenRp=()=>S.ths.some(x=>x.ck==='修繕'&&(ST_OPEN.includes(x.st)||x.queued));
function stSpCond(th){
  switch(th.ev){
    case 'E01-07':case 'E14-07':return 'no';                               // 修繕の件が作られなかった時だけ、この担い手になる
    case 'E08-10':return (S.hl.care&&S.hl.care.tid===th.pid)?'ok':'no';
    case 'E09-07':{const a=stAct('芸の修業');return a&&a.mo>=1?'ok':'no'}
    case 'E09-10':{const a=stAct('趣味');return a&&a.st==='継続'?'ok':'no'}
  }
  return 'ok';
}
function stSpNo(th){
  switch(th.ev){
    case 'E01-07':case 'E14-07':return stOpenRp()?'住まいの修繕は、まだ続いている。':(S.hs.dmg===0?'住まいに、直すほどの傷みはなく、暮らしは落ち着いている。':'住まいの修繕は、始められなかった。');
    case 'E08-10':return '家族の世話は、続けられなかった。';
    case 'E09-07':return '修業は、思うように進められていない。';
    case 'E09-10':return '趣味との付き合い方は、まだ定まっていない。';
  }
  return '';
}
/* 他の仕組み（健康・住居・情報）に依存する後日談：成立済みの記録をそのまま文章にする。新しい抽選はしない */
function stCText(th){
  const hc=()=>{const l=S.hl.conds.filter(c=>c.pid==='ME');return l[l.length-1]||null};
  switch(th.ev){
    case 'E08-07':{const c=hc();if(!c)return '療養の日々を過ごした。';
      return c.st==='回復'?'療養の日々を重ね、体のようすは、すっかり落ち着いた。':c.st==='軽快'?th.spx:'療養を続けているが、体のようすは、まだ変わらない。'}
    case 'E08-09':{const c=hc();if(!c)return '相談と様子見を重ね、ひとつの判断に落ち着いた。';
      return c.st==='回復'?'相談と様子見を重ねるうち、体のようすは落ち着いた。（相談だけで治ったわけではない）':c.st==='軽快'?th.spx:'相談を重ねたが、体のようすは、まだ変わらない。'}
    case 'E12-08':return (S.hs.stay!==S.hs.home)?'身を寄せた先で過ごしている。（争いが収まったわけではない）'
      :S.ths.some(x=>x.ev==='E12-08'&&x.j===0&&ST_OPEN.includes(x.st))?'安全な退避先を探している。（争いが収まったわけではない）'
      :'今いる場所にとどまっている。（争いが収まったわけではない）';
    case 'E14-09':return S.ths.some(x=>x.ev==='E14-09'&&x.j===0&&ST_OPEN.includes(x.st))?'安全な移住先を調べている。（災害を避けられるとは限らない）'
      :'移住先は決まらないまま、いまの住まいで暮らしている。（災害を避けられるとは限らない）';
  }
  return '';
}
function thNotify(th){
  const sp=th.sp;
  if(!sp||th.notified||S.mo<th.nmo)return;
  th.notified=1;
  if(sp.k==='C'){                                                          // 判定なし。現状を一度だけ知らせる
    stSpFx(th,'ok');
    addLog('r',stTx(th,stCText(th)||th.cur||th.spx),true);
    return;
  }
  if(th.fin){const t=(th.sx&&th.sx[th.res])||th.spx||(th.res==='ng'?th.ng:'');if(t)addLog('r',stTx(th,t),true);return}
  if(ST_OPEN.includes(th.st))addLog('r',`「${th.ttl}」は、まだ続いている。`,true);   // 未完成なら「続いている」と知らせる（件は残す）
}
function stCand(th){
  const out=[];
  const gs=th.cd||[];
  gs.forEach(g=>{
    if(g==='@p'){const n=npcById(th.pid);if(n&&n.known&&!n.dead)out.push(S.npc.indexOf(n));return}
    const G=EV_GROUPS[g];if(!G)return;
    S.npc.forEach((n,i)=>{if(n.known&&!n.dead&&npcAge(n)>=3&&n.id!==th.pid&&(g==='fam'?n.rel==='家族':(G.alias||[]).includes(n.rel))&&!out.includes(i))out.push(i)});
  });
  return out.length?out[rnd(out.length)]:-1;
}
function thStep(th){
  const tn=th.tid?npcById(th.tid):null;
  if(th.tid&&(!tn||tn.dead)){thClose(th,'対象喪失',th.lost||'相手が亡くなり、この件は止まった。');return}
  if(th.due!=null&&S.mo>th.due&&!(th.sk==='conf'&&(S.tk||0)<th.tk0+2)){   // 本人の確認待ちは、少なくとも2回分の進行のあいだ待つ（年ごとの進行で、答える間もなく切れないように）
    thClose(th,'期限到来',(th.st==='条件不足'&&th.why)?`「${th.ttl}」は、条件が整わないまま期限が過ぎた。（${th.why}）`:(th.ex||`「${th.ttl}」は、期限が過ぎた。`));
    return;
  }
  if(th.sk==='conf'){th.st='本人確認待ち';return}
  if(S.mo<th.chk)return;
  if(th.sk==='note'){
    if(stSpCond(th)==='no'){th.sx={ng:stSpNo(th)};thResolve(th,'ng');th.st='完了';return}   // 実際に行われていなければ、成功の文も報いも出さない
    thResolve(th,'ok');return}
  const why=thReq(th);
  if(why){th.st='条件不足';th.why=why;return}
  if(th.ntg&&!th.tid&&th.sk!=='search'){th.st='条件不足';th.why='相手がいない';return}
  th.why='';
  const pi=npcIdx(th.tid||th.pid);
  if(th.sk==='ask'){
    th.st='相手返答待ち';
    if(!th.res)th.res=th.jd==='c'?'ok':(rand()<evProb(pi>=0?pi:null,'B')?'ok':'ng');   // 抽選は実行条件が揃った時に一度だけ
    thResolve(th,th.res);
  }else if(th.sk==='plan'){
    if(th.tm&&frLeft()<th.tm){
      th.slip=(th.slip||0)+1;th.chk=S.mo+1;th.st='条件不足';th.why='今月は時間が足りない';
      if(th.slip>3)thClose(th,'期限到来',th.ex||`「${th.ttl}」は、時間が取れないまま過ぎた。`);
      return;
    }
    if(th.tm)frTake(th.tm);
    let res='ok';
    if(th.jd==='E'){if(!th.res)th.res=rand()<evProb(npcIdx(th.pid),'E')?'ok':'ng';res=th.res}
    thResolve(th,res);
  }else if(th.sk==='search'){
    const c=th.cd?stCand(th):-1;
    if(c<0){th.st='候補探し';th.why=th.hold?'候補調査中':'見つかっていない';return}
    th.cand=S.npc[c].name;th.cid=S.npc[c].id;th.st='候補提示';
    thResolve(th,'ok');
  }else if(th.sk==='work'){
    th.st='作業中';
    const need=th.pm[th.prog]||0;
    if(frLeft()<need){th.slip=(th.slip||0)+1;th.why='今月は時間が足りない';return}   // 時間が足りない月は進まない（材料は予約したまま）
    th.why='';frTake(need);th.prog++;th.chk=S.mo+1;
    if(th.prog>=th.len)thResolve(th,'ok');
  }else stBad(`件「${th.ttl}」`,th.sk,'不明な件の種類',th);
}
function stThreads(){
  S.ths.forEach(t=>{
    if(t.queued&&S.ths.filter(x=>ST_OPEN.includes(x.st)&&!x.queued).length<ST_MAXTH){t.queued=0;t.why='';t.chk=Math.max(t.chk,S.mo);if(t.due!=null)t.due=Math.max(t.due,S.mo+3)}
  });
  S.ths.slice().forEach(th=>{
    if(th.bad||th.queued)return;
    if(ST_OPEN.includes(th.st))thStep(th);
    thNotify(th);
  });
  // 古い完了済みの履歴を整理（未通知の後日談は残す）
  const closed=S.ths.filter(t=>!ST_OPEN.includes(t.st)&&(!t.sp||t.notified));
  if(closed.length>ST_KEEP){const drop=new Set(closed.slice(0,closed.length-ST_KEEP).map(t=>t.id));S.ths=S.ths.filter(t=>!drop.has(t.id))}
}
/* 件が完了した時の、他の仕組みへの書き込み（成功時だけ） */
function stEff(th,res){
  if(res!=='ok')return;
  const w=S.wk,h=S.hh;
  th.ef.forEach(e=>{
    switch(e[0]){
      case 'info':stInfoAdd(e[1],e[2],e[3],'me',th.tid||th.pid,e[4]);break;
      case 'biz':w.biz=true;w.form='担当';break;
      case 'train':w.train='継続';if(w.form==='未設定'||w.form==='手伝い')w.form='修業';{const a=stActEnsure('修業');a.st='継続';a.since=S.mo;a.len=12}break;       // 12か月で一区切り
      case 'visit':w.visit++;stInfoAdd('約束','見学を許された。','本人確認','me',th.tid,null);break;
      case 'act':{const a=stActEnsure(e[1]);a.mo++;a.last=S.mo;break}
      case 'meth':w.meth=e[1];break;
      case 'bonus':h.bonus=Math.min(ST_BMAX,h.bonus+1);h.bonusFrom=S.mo+1;break;     // 翌月から。加算の上限は+2（仮）
      case 'trade':w.trade=th.obj||'別の生業';break;
      case 'indep':w.form='独立';break;
      case 'role':if(!w.roles.includes(e[1]))w.roles.push(e[1]);break;
      case 'publish':{const k=stObjEnsure('作品');k.st='発表済み';break}
      case 'spend':{const n=stV(e[2]);const p=Math.min(n,Math.max(0,stAvail(e[1])));h[e[1]]-=p;stLed(th.ttl,-p,e[1]);break}
      case 'plan':h.plans.push({k:e[1],tid:th.tid,amt:th.amt,mo:S.mo});break;
      case 'borrow':{
        h.fund+=th.amt;stLed('借入',th.amt,'fund');
        h.loans.push({id:'N'+(++h.lnN),dir:'借',tid:th.tid,amt:th.amt,left:th.amt,from:S.mo,due:S.mo+12,st:'未返済',ask:0});break}
      case 'invest':{const p=Math.min(th.amt,Math.max(0,stAvail('fund')));h.fund-=p;h.invest+=p;stLed('出資',-p,'fund');break}
      case 'xfer':{
        const a=e[1],to=e[2],n=Math.min(th.amt,h[a]);
        h[a]-=n;if(th.rsv&&th.rsv.a===a){h.rv[a]=Math.max(0,h.rv[a]-th.rsv.n);th.rsv=null}
        h[to]+=n;stLed(th.ttl,-n,a);break}
      case 'repay':stRepay(th);break;
      case 'pay':{                                                         // 予約していた費用を、完了時に払う
        const rel=x=>{h.rv[x.a]=Math.max(0,h.rv[x.a]-x.n)};
        if(th.rsv)rel(th.rsv);(th.rsx||[]).forEach(rel);th.rsv=null;th.rsx=null;
        [th.co].concat(th.cox||[]).filter(Boolean).forEach(x=>{const p=Math.min(x.n,h[x.a]);h[x.a]-=p;stLed(th.ttl,-p,x.a)});
        break}
      case 'dmg-':S.hs.dmg=Math.max(0,S.hs.dmg-1);break;                   // 一段階だけ。良好まで一気に戻さない
      case 'prep+':S.hs.prep=Math.min(10,S.hs.prep+stS());break;           // 備えは＋1〜2、上限10
      case 'stay':{S.hs.stay='「'+(th.cand||'知人')+'」のところ';S.hs.stayEnd=S.mo+e[1];const n=Math.min(1,Math.max(0,frLeft()));frTake(n);break}   // 滞在先だけ変える。主な住まいは変えない
      case 'mar':{                                                           // 婚姻は協議と意思確認まで。成立は制度条件が未設定のため保留
        const r=stRel(th.tid||th.pid);if(r){r.inst='制度条件未確認'}
        stHold(th.ev,'婚姻の成立','世帯','年代・場面の婚姻の条件が未設定のため、成立は保留（制度条件未確認）');break}
      case 'cohab':{const n=npcById(th.tid||th.pid);if(n)n.co=true;break}
      case 'uncohab':{const n=npcById(th.tid||th.pid);if(n&&n.co){n.co=false;addLog('n',`${n.name}との同居は、解消した。`,true)}break}
      case 'care':{const id=th.tid||th.pid;if(id&&!S.hd.care.some(x=>x.id===id))S.hd.care.push({id,mo:S.mo});break}   // 養育関係の記録だけ。実の子にはしない
      case 'sep':{const n=npcById(th.tid||th.pid);if(n){n.co=false;S.hd.sep.push({id:n.id,mo:S.mo})}break}               // 居住世帯を分けるだけ。血縁・婚姻は残す
      case 'guest':S.hd.guests.push({nm:'迎えた世帯',mo:S.mo});stPob('地域で受け入れた世帯（イベントの前提として仮に用意）');break
      case 'helper':{const id=th.tid||th.pid;if(id)S.hl.helper={id,mo:S.mo};break}     // 承諾した支援者を記録
      case 'wl':S.hl.work=e[1];break;                                         // 合意後に仕事量を変える
      case 'carex':{const k=S.hl.care;if(k){k.end=S.mo+6;k.ask=0;k.ext++}break}
      case 'cpx':{const k=S.hs.comp;if(k){k.end=S.mo+3;k.ask=0;k.ext++}break}
      case 'trip':S.hs.trips++;stHold(th.ev,'訪問','住居','友人の所在地・往復の経路のデータが未設定のため、移動の確認は省いた');break;
      case 'fpart':{const f=stFacEnsure();f.part++;break}
      case 'nx':{                                                           // 次の段階の件（受入れ→実行確認）を作る
        const nt=stNewTh(Object.assign({t:'th'},e[1],{tid:th.cid||th.tid,ntg:1}),{ev:th.ev,seq:th.seq,j:th.j,k:'nx'+th.id,title:th.ttl,pid:th.pid});
        nt.cand=th.cand;nt.cid=th.cid;
        if(th.sp&&!th.spf){nt.sp=th.sp;nt.nmo=th.nmo;nt.sx=th.sx;nt.cur=th.cur;nt.notified=th.notified;th.sp=null}   // 実際に実行された時に結果を知らせる（準備や受入れだけで成功の文を出さない）
        break}
      default:stBad(`件「${th.ttl}」`,e[0],'不明な完了時の変更の種類',th);
    }
  });
}

