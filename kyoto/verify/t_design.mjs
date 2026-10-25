// 設計データの受け口（18b-design-hook.js）の確認
//  1) 設計データが無いとき：既定値を記録するだけ（applied=0, errors=[]）
//  2) 設計データがあるとき：数値・境遇・名前が差し替わり、画面（境遇の一覧）にも出る。形の合わない値は使わず errors に残る
//  3) 新しい境遇の値を変えても、元にした境遇（共有していた配列）は変わらない
import { chromium, BUILD } from './lib.mjs';
const results = []; const T = (n, ok, d = '') => { results.push(ok); console.log((ok ? 'PASS ' : 'FAIL ') + n + (d ? '  — ' + d : '')); };
async function run(design) {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  if (design) await p.addInitScript((d) => { window.__KYOTO_DESIGN__ = d; }, design);
  await p.goto('file://' + BUILD); await p.waitForTimeout(300);
  return { b, p, errs };
}
{ // 1
  const { b, p, errs } = await run(null);
  const r = await p.evaluate(() => ({ a: KYOTO_DESIGN.applied, e: KYOTO_DESIGN.errors, d: KYOTO_DESIGN.defaults, n: Object.keys(KYOTO_DESIGN.defaults.personas).length }));
  T('設計データ無し：何も差し替えない', r.a === 0 && r.e.length === 0);
  T('既定値の記録：27境遇（単位3で+10・寿命の上限の設計項目は廃止）・全項目', r.n === 27 && r.d.vars.MAXAGE === undefined && r.d.vars.FAM_SIB.join() === '35,40,25' && r.d.personas.farm.npc.length === 4, JSON.stringify(r.d.vars.SPEEDS));
  T('エラーなし', errs.length === 0, errs.join());
  await b.close();
}
{ // 2,3
  const design = { v: 1, vars: { FAM_SIB: [100, 0, 0], FAM_MISS: 0, SWITCH_AGE: [25, 25], RANDW: null, XP_UP: [1, 2] },
    personas: { farm: { label: 'テスト農家', stats: [900, 900, 900, 900], npc: [['父', '家族', 58, 0], ['畑の人', '近所', 28, 6], ['運ぶ人', '取引', 9, null], ['友', '友人', 20, null]] },
      mer_m: { npcoff: [40, 40, 40, 40] }, nosuch: { label: 'x' } } };
  const { b, p, errs } = await run(design);
  const r = await p.evaluate(() => {
    render = () => {}; openResult = () => {}; showFx = () => {}; evClose = () => {}; syncEvent = () => {};
    const chips = [...document.querySelectorAll('#personas .chip')].map((c) => c.textContent);
    let maxAge = 0, sib = 0, sw = new Set();
    for (let L = 0; L < 40; L++) {
      newGame('farm'); sw.add(S.switchAge);
      sib += S.npc.filter((n) => /兄|姉|弟|妹/.test(n.role || '')).length;
      let g = 0; while (!S.dead && g++ < 3000) { if (S.decision) { choose(0); continue; } slots = rollSlots(); flushSlots(); tick(); }
      maxAge = Math.max(maxAge, S.age);
    }
    return { applied: KYOTO_DESIGN.applied, errors: KYOTO_DESIGN.errors, chips, maxAge, sib, sw: [...sw], farmStats: PERSONAS.farm.stats, npc0: PERSONAS.farm.npc[1][0],
      artisanOff: NPCOFF.artisan, merOff: NPCOFF.mer_m, edoMachiyaOff: NPCOFF.edo_machiya, cur: KYOTO_DESIGN.snapshot().vars.SWITCH_AGE, def: KYOTO_DESIGN.defaults.vars.SWITCH_AGE, hasMax: 'MAXAGE' in KYOTO_DESIGN.snapshot().vars };
  });
  T('差し替えた件数', r.applied === 7, String(r.applied));
  T('形の合わない値・知らない境遇は使わず記録', r.errors.length === 3 && r.errors.some((e) => e.includes('RANDW')) && r.errors.some((e) => e.includes('XP_UP')) && r.errors.some((e) => e.includes('nosuch')), r.errors.join(' / '));
  T('境遇名が画面の一覧に出る', r.chips.includes('テスト農家'), r.chips.slice(0, 4).join(','));
  T('寿命に年齢の上限という設計項目は無い（MAXAGE廃止）', !r.hasMax, String(r.maxAge));
  T('兄弟姉妹0人が効く', r.sib === 0, String(r.sib));
  T('切替年齢が効く', r.sw.length === 1 && r.sw[0] === 25, r.sw.join());
  T('境遇の能力・周りの人', r.farmStats.join() === '900,900,900,900' && r.npc0 === '畑の人');
  T('新しい境遇だけ変わり、元の境遇は変わらない', r.merOff.join() === '40,40,40,40' && r.artisanOff.join() !== '40,40,40,40' && r.edoMachiyaOff.join() === r.artisanOff.join(), `${r.artisanOff}/${r.merOff}/${r.edoMachiyaOff}`);
  T('既定値と現在値を別に持つ', r.def.join() !== '25,25' && r.cur.join() === '25,25');
  T('エラーなし', errs.length === 0, errs.join());
  await b.close();
}
const ok = results.every(Boolean);
console.log(ok ? `${results.length}/${results.length} PASS` : 'FAIL');
process.exit(ok ? 0 : 1);
