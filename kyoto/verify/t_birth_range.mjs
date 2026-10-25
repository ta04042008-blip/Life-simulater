// 単位3：出生年の完全均等抽選（西暦1〜2025年）・境遇データの網羅・境界年・データ欠落時に引き直さないこと
import { open } from './lib.mjs';
const { browser, page, errs } = await open();
const out = []; const T = (name, ok, note = '') => { out.push(ok); console.log((ok ? 'PASS ' : 'FAIL ') + name + (note ? '  — ' + note : '')); };
const gp = () => page.evaluate(() => { window.go1 = () => { if (S.decision) { choose(0); if (S.decision) S.decision = null; return } slotsEnsure(); flushSlots(); tick(); }; });
await gp();

// 1. 実際の抽選（本番の randomBirth）を大量に引く：年が1〜2025の範囲、全年に境遇あり、均等性（カイ二乗に近い簡易検定）
const d = await page.evaluate(() => {
  const N = 200000, cnt = new Array(2026).fill(0), per = {}; let gap = 0, bad = 0;
  for (let i = 0; i < N; i++) {
    const b = randomBirth(); if (b.gap) { gap++; continue; }
    if (b.year < 1 || b.year > 2025) { bad++; continue; }
    cnt[b.year]++; per[b.pid] = (per[b.pid] || 0) + 1;
    const P = PERSONAS[b.pid]; if (!(b.year >= P.yr[0] && b.year < P.yr[1]) || P.testOnly) bad++;
  }
  // 10年区間ごとの度数で均等性を見る（期待 N/2025*10）
  const exp = N / 2025 * 10; let worst = 0, chi = 0, bins = 0;
  for (let s = 1; s <= 2020; s += 10) { let c = 0; for (let y = s; y < s + 10; y++) c += cnt[y]; worst = Math.max(worst, Math.abs(c - exp) / Math.sqrt(exp)); chi += (c - exp) ** 2 / exp; bins++; }
  return { N, gap, bad, min1: Math.min(...cnt.slice(1)), max: Math.max(...cnt.slice(1)), worst, chi, bins, per, exp, y0: cnt[0], y2026: 0 };
});
T('抽選：範囲外0・データ欠落0・不正な境遇0（20万回）', d.gap === 0 && d.bad === 0 && d.y0 === 0, JSON.stringify({ gap: d.gap, bad: d.bad }));
T('抽選：全2025年のうち出ない年が無い', d.min1 > 0, `最小${d.min1}回/最大${d.max}回（期待約${(d.N / 2025).toFixed(0)}）`);
T('抽選：10年区間の度数が均等（最大偏差 4.5σ 未満・χ²が自由度202の±5σ内）', d.worst < 4.5 && Math.abs(d.chi - (d.bins - 1)) < 5 * Math.sqrt(2 * (d.bins - 1)), `最大偏差${d.worst.toFixed(2)}σ χ²=${d.chi.toFixed(1)}（自由度${d.bins - 1}）`);
console.log('   境遇別回数:', JSON.stringify(d.per));

// 2. 全年（強制）：1〜2025の各年を乱数で強制し、境遇が必ず見つかり、年が一致すること
const f = await page.evaluate(() => {
  let miss = [], wrong = [];
  for (let y = 1; y <= 2025; y++) { const b = randomBirth(y); if (b.gap) miss.push(y); else if (b.year !== y) wrong.push(y); }
  return { n: 2025, miss: miss.slice(0, 20), wrong: wrong.slice(0, 20) };
});
T('全2025年を強制抽選：境遇の欠落なし・年は変更されない', f.miss.length === 0 && f.wrong.length === 0, JSON.stringify(f));

// 3. 境界年ごとに、その年で成立する正式な境遇を全部実際に始めて数年進め、時代名・生まれ年・エラーを確認
const bd = await page.evaluate(() => {
  const res = [];
  for (const y of [1, 1900, 1901, 1925, 1926, 1999, 2000, 2025]) {
    const ks = birthCandidates(y);
    for (const k of ks) {
      newGame(k, y); const era0 = S.era, y0 = S.year; let n = 0; while (!S.dead && n++ < 40) go1();
      res.push({ y, k, year0: y0, pid: S.pid, era: era0, ok: S.year >= y });
    }
  }
  return res;
});
T('境界年（1,1900,1901,1925,1926,1999,2000,2025）の全境遇で人生を開始・進行できる', bd.length > 0 && bd.every((r) => r.year0 === r.y && r.pid === r.k && r.ok), `${bd.length}件`);
const eraOk = await page.evaluate(() => [[1911, '明治'], [1912, '大正'], [1925, '大正'], [1926, '昭和'], [1988, '昭和'], [1989, '平成'], [2018, '平成'], [2019, '令和'], [2025, '令和']].every(([y, e]) => eraName(y) === e));
T('時代名の境界（明治/大正/昭和/平成/令和）', eraOk);

// 4. データ欠落年：テスト専用の仮データを注入しても正式抽選に混ざらず、欠落は欠落のまま報告され引き直されない
const g = await page.evaluate(() => {
  const save = {}; const removed = [];
  PERSONAS.__testonly = { ...PERSONAS.common, yr: [1, 2026], testOnly: true }; RANDW.__testonly = 1000;
  for (const k of Object.keys(PERSONAS)) { const p = PERSONAS[k]; if (k !== '__testonly' && 1950 >= p.yr[0] && 1950 < p.yr[1]) { save[k] = p.yr; p.yr = [1, 1]; removed.push(k) } }
  let calls = 0;
  const b = randomBirth(1950);
  for (const k in save) PERSONAS[k].yr = save[k]; delete PERSONAS.__testonly; delete RANDW.__testonly;
  return { b, calls, removed };
});
T('データ欠落年(1950年を一時的に空に)：年は維持・gap報告・テスト専用境遇は混ざらない', g.b.year === 1950 && g.b.gap === true && g.b.pid === null, JSON.stringify(g));
const gl = await page.evaluate(() => { const h = JSON.stringify(S); const r = newLife(null, 1950, true); return { r, same: JSON.stringify(S) === h } });
T('欠落年で人生を開始しようとしても中止され、現在の人生は変わらない', gl.r === false && gl.same);

T('ページエラーなし', errs.length === 0, JSON.stringify(errs));
await browser.close();
console.log(out.filter(Boolean).length + '/' + out.length + ' PASS'); process.exit(out.every(Boolean) ? 0 : 1);
