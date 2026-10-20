// 10-state-resources.js — 状態システム 段階4：資源（資金・食料・物資）・貸借
/* ---------- 段階4：資源（資金・食料・物資）・貸借 ---------- */
function stIncomeMonth(){
  const h=S.hh;
  const inc=stV(ST_INC+(S.mo>=h.bonusFrom?h.bonus:0));
  h.fund+=inc;stLed('収入',inc,'fund');
  const need=stV(ST_LIV),pay=Math.min(need,h.fund);                      // 生活費：不足分は未払として記録（借金にはしない）
  h.fund-=pay;stLed('生活費',-pay,'fund');
  if(pay<need)h.unpaid+=need-pay;
  const ratio=need>0?pay/need:1;
  h.food+=Math.floor(stV(ST_FIN)*ratio);                                 // 補給は払えた割合で（端数は切り捨て）
  const out=Math.min(h.food,stV(ST_FOUT));
  h.food-=out;
  if(out<stV(ST_FOUT)){h.short++;if(h.short===1||h.short%6===0)addLog('c','食べ物が足りない月があった。',true)}
}
function stLoansMonth(){
  S.hh.loans.forEach(l=>{
    if(l.st==='精算'||l.ask||S.mo<l.due||(l.rem||0)>=4)return;               // 確認の催促は4回まで。債務そのものは消さない
    const tn=npcById(l.tid);
    if(l.dir==='貸'&&(!tn||tn.dead)){l.st='相手不在（精算されず）';l.ask=1;return}
    l.ask=1;l.rem=(l.rem||0)+1;
    const th=stNewTh(l.dir==='貸'
      ?{t:'th',sk:'ask',ck:'貸借',m:'返済の確認',ttl:'貸した分の返済の確認',w:0,du:6,jd:'B',tid:l.tid,ntg:1,ef:[['repay']],ok:'貸していた分が返ってきた。',ng:'返済は確認できなかった。（未精算）',ex:'返済は確認できないまま、期限が過ぎた。（未精算）'}
      :{t:'th',sk:'conf',ck:'貸借',m:'返済の確認',ttl:'借りた分の返済',w:0,du:6,tid:l.tid,ef:[['repay']],ok:'借りていた分を返した。',ng:'返済はあとにした。（未精算）',ex:'返事をしないまま、期限が過ぎた。（未精算）'},
      {ev:'LOAN',seq:0,j:0,k:l.id,title:'貸借',pid:l.tid});
    th.loan=l.id;th.amt=l.left;
  });
}
function stRepay(th){
  const l=S.hh.loans.find(x=>x.id===th.loan);if(!l)return;
  if(l.dir==='貸'){S.hh.fund+=l.left;stLed('返済を受け取った',l.left,'fund');l.left=0;l.st='精算'}
  else{
    const p=Math.min(l.left,Math.max(0,stAvail('fund')));
    S.hh.fund-=p;l.left-=p;stLed('返済',-p,'fund');
    l.st=l.left>0?'未精算':'精算';
  }
}
function stLoanAfter(th,res){
  const l=S.hh.loans.find(x=>x.id===th.loan);if(!l)return;
  if(res==='ok'&&l.st==='精算')return;
  if(l.st!=='精算'){l.st='未精算';l.ask=0;l.due=S.mo+6}                    // 満期は自動没収でも返済成功でもなく、確認の時期。未精算のまま6か月ごとに確認（4回まで）
}
/* 本人の確認（家計画面のボタン） */
function stConfirm(id,yes){
  const th=S.ths.find(t=>t.id===id);
  if(!th||th.st!=='本人確認待ち'||th.bad)return '';
  if(!yes){thClose(th,'本人中止',th.ng||'見送ることにした。');return ''}
  const why=thReq(th);
  if(why)return why;
  thResolve(th,'ok');
  return '';
}

