// 単位4：死亡確率の表（JMD実データ／暫定推定）が実際のゲームの人生に反映されているかを見る集団検査。
// ・乳児：4回の3か月判定を通した死亡割合が、その年の q0 に一致する（標本誤差の範囲）
// ・人生全体：ゲームを実際に進めた平均の没年齢が、同じ表から計算した期待値に近い（体力・病気の個人差を入れても平均が大きくずれない）
import { open } from './lib.mjs';
const { browser, page, errs } = await open();
const out = []; const T = (name, ok, note = '') => { out.push(ok); console.log((ok ? 'PASS ' : 'FAIL ') + name + (note ? '  — ' + note : '')); };

const inf = await page.evaluate(() => {
  const r = {};
  for (const y of [1700, 1920, 1947, 1960, 2000, 2024]) {
    const N = 40000; let d = 0; const q0 = mortQ(0, y);
    for (let i = 0; i < N; i++) { let dead = false; for (let k = 0; k < 4 && !dead; k++) { const h = annualHazard(0, 500, null, k, y); if (rand() < 1 - Math.exp(-h.mu * 0.25)) dead = true } if (dead) d++ }
    r[y] = { q0, sim: d / N, sigma: Math.sqrt(q0 * (1 - q0) / N) };
  }
  return r;
});
for (const [y, v] of Object.entries(inf)) T(`${y}年：0歳の4回の判定を通した死亡割合が q0 に一致`, Math.abs(v.sim - v.q0) < 4 * v.sigma + 1e-4, `表${v.q0.toFixed(4)} 実測${v.sim.toFixed(4)}`);

const N = +(process.env.COHORT_N || 150);
for (const by of [2000, 1900, 1700]) {
  const ex = await page.evaluate((by) => {
    // 期待値：基準の死亡力だけで同じ年に生まれた人が過ごす四半期ごとの生存から、平均没年齢を数える（個人差なしの理論値）
    let l = 1, e = 0; for (let k = 0; k < 4 * 140; k++) { const age = Math.floor(k / 4), y = by + age, h = annualHazard(age, 500, null, age === 0 ? k % 4 : null, y); const p = 1 - Math.exp(-h.mu * 0.25); e += l * p * (k / 4 + 0.125); l *= 1 - p; }
    return e + l * 140;
  }, by);
  const ages = []; let bad = 0;
  for (let done = 0; done < N; done += 25) {   // 1回に25人ずつ（ページの負荷を抑える）
    const res = await page.evaluate((by) => {
      const go = () => { if (S.decision) { choose(0); if (S.decision) S.decision = null; return } slotsEnsure(); flushSlots(); tick(); };
      const a = []; let bad = 0;
      for (let i = 0; i < 25; i++) { newGame('common', by); S.switchAge = 24; let g = 0; while (!S.dead && g++ < 20000) go(); if (!S.dead) bad++; else a.push(S.deathAge); }
      return { a, bad };
    }, by);
    ages.push(...res.a); bad += res.bad;
  }
  const mean = ages.reduce((a, b) => a + b, 0) / ages.length;
  const r = { ex, mean, n: ages.length, bad, u1: ages.filter((a) => a < 1).length / ages.length, q0: await page.evaluate((by) => mortQ(0, by), by), sd: Math.sqrt(ages.reduce((a, b) => a + (b - mean) ** 2, 0) / ages.length) };
  const se = r.sd / Math.sqrt(r.n);
  T(`${by}年生まれ：全員が死ぬ（${r.n}人）`, r.bad === 0 && r.n >= N);
  T(`${by}年生まれ：平均没年齢が表の期待値に近い（誤差±${Math.max(3 * se, 3).toFixed(1)}歳以内）`, Math.abs(r.mean - r.ex) < Math.max(3 * se, 3), `期待${r.ex.toFixed(1)} 実測${r.mean.toFixed(1)} 乳児死亡${(r.u1 * 100).toFixed(1)}%（表${(r.q0 * 100).toFixed(1)}%） 標準偏差${r.sd.toFixed(1)}`);
}
T('ページエラーなし', errs.length === 0, JSON.stringify(errs));
await browser.close();
console.log(out.filter(Boolean).length + '/' + out.length + ' PASS'); process.exit(out.every(Boolean) ? 0 : 1);
