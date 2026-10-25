// 単位4：死亡確率の表（01a/01b）の純粋な計算の検査（ブラウザ不要）。
import test from 'node:test'; import assert from 'node:assert/strict'; import vm from 'node:vm'; import { readFileSync } from 'node:fs';
const src = (f) => readFileSync(new URL('../src/js/' + f, import.meta.url), 'utf8');
const ctx = vm.createContext({ Math, console });
vm.runInContext('const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));const HZ={scale:1,illMult:3,sevMult:6};', ctx);
for (const f of ['01a-mortality-data.js', '01b-mortality.js']) vm.runInContext(src(f), ctx);
const run = (code) => vm.runInContext(code, ctx);
const hz = (a, y, v = 500, ill = null, qi = null, kind) => run(`mortHazard(${a},${y},${v},${ill ? JSON.stringify(ill) : 'null'},${qi},${kind ? `'${kind}'` : 'undefined'})`);

test('1947〜2024年：表は JMD の値で、平均寿命を各歳の q から再計算すると表の e0 に一致する', () => {
  const bad = run(`(()=>{const o=[];for(let y=JMD_Y0;y<=JMD_Y1;y++){const t=mortTable(y);if(t.src!=='JMD実データ')o.push(y+':src');const e=mortE0(t.q,t.ax0,t.mx110);if(Math.abs(e-JMD_E0[y-JMD_Y0])>0.15)o.push(y+':'+e.toFixed(2)+'/'+JMD_E0[y-JMD_Y0])}return o})()`);
  assert.equal(JSON.stringify(bad), "[]");
});
test('2025年以降は2024年の表のまま（ゲーム内推定）', () => {
  assert.equal(run('mortTable(2030)===mortTable(2024)'), true);
  assert.equal(run('mortQ(60,2100)===mortQ(60,2024)'), true);
});
test('110歳以上は強制死亡にならない（死亡力一定の延長で、年間確率は約0.5〜0.57）', () => {
  for (const y of [1947, 1980, 2024]) { const q = run(`mortQ(110,${y})`), q130 = run(`mortQ(130,${y})`); assert.ok(q > 0.4 && q < 0.7 && q === q130, `${y}:${q}`); }
  assert.ok(hz(115, 2024).tot * 0.25 < 0.2);
});
test('3か月ごとの判定を4回通した生存が 1−q に一致する（1歳以上、全年）', () => {
  let worst = 0;
  for (const y of [1700, 1895, 1920, 1947, 1965, 1995, 2011, 2024]) for (let a = 1; a < 110; a++) { const h = hz(a, y); const q = run(`mortQ(${a},${y})`); worst = Math.max(worst, Math.abs(Math.pow(Math.exp(-h.mu * 0.25), 4) - (1 - q))); }
  assert.ok(worst < 1e-9, String(worst));
});
test('0歳：4つの四半期の判定を通した生存が 1−q0 に一致し、前半に偏る（暫定の配分）', () => {
  for (const y of [1700, 1920, 1947, 1960, 2000, 2024]) {
    let s = 1; const ps = []; for (let k = 0; k < 4; k++) { const p = 1 - Math.exp(-hz(0, y, 500, null, k).mu * 0.25); ps.push(p); s *= 1 - p; }
    assert.ok(Math.abs(s - (1 - run(`mortQ(0,${y})`))) < 1e-9, `${y}`);
    assert.ok(ps[0] > ps[1] && ps[1] > ps[2] * 0.9, `${y}: ${ps}`);
  }
});
test('1946年以前の暫定表：平均寿命がアンカーに一致し、0歳の死亡確率は1947年より低くならない', () => {
  for (const y of [1, 1000, 1603, 1750, 1890, 1895, 1920, 1935, 1946]) {
    const t = run(`mortTable(${y})`), a = run(`mortAnchorAt(${y})`);
    assert.equal(t.src, '暫定推定');
    assert.ok(Math.abs(run(`mortE0(mortTable(${y}).q,mortTable(${y}).ax0,mortTable(${y}).mx110)`) - a.e0) < 0.02, `${y}`);
    assert.ok(t.q[0] >= run('JMD_Q[0][0]') - 1e-9, `${y}: q0 ${t.q[0]}`);
  }
});
test('全年・全年齢で q は 0 以上 1 未満', () => {
  const bad = run(`(()=>{let n=0;for(const y of [1,800,1603,1850,1900,1946,1947,2024]){const t=mortTable(y);for(const q of t.q)if(!(q>=0&&q<1))n++}return n})()`);
  assert.equal(bad, 0);
});
test('二重計上の防止：病気の確率を考慮した平均の死亡力が基準の死亡力に一致する（成人・標準の体力）', () => {
  // 病気の人の割合 f と倍率の平均 mbar から、全体の平均 = (1−f)×病気でない人 + f×病気の人 が基準 mu になる
  for (const a of [20, 40, 70]) {
    const norm = run(`mortIllMean(${a},true)`), mu = hz(a, 2000).mu;
    const pill = (0.05 + a / 1500) * 0.75, f = (pill * 4) / (1 + pill * 4), s = 0.05 + a / 1200, mbar = (1 - s) * 3 + s * 6;
    const none = hz(a, 2000, 560, null, null, 'npc'), mbRef = run(`mortStamRef(${a},'npc')`);
    const rrNone = 1 / norm, rrIll = mbar / norm;                        // 病気なし・病気（平均倍率）の相対リスク（体力は基準の平均）
    assert.ok(Math.abs((1 - f) * rrNone + f * rrIll - 1) < 1e-9, `age ${a}`);
    assert.ok(none.acc >= 0 && none.base > 0 && mbRef > 0);
  }
});
test('死因の内訳（事故・病気・その他）の和が全体に一致し、事故を別枠で足さない', () => {
  for (const [a, ill] of [[0, null], [30, null], [30, { mult: 3, name: '風邪' }], [80, { mult: 6, name: '重い病' }]]) {
    const h = hz(a, 2000, 400, ill, a === 0 ? 1 : null); assert.ok(Math.abs(h.acc + h.base + h.ill - h.tot) < 1e-12); assert.ok(h.acc < h.tot);
  }
});
test('死亡率の倍率 HZ.scale：0なら死なない、極端に大きければ確実に死ぬ', () => {
  run('HZ.scale=0'); assert.equal(hz(50, 2000).tot, 0); run('HZ.scale=1e6'); assert.ok(1 - Math.exp(-hz(50, 2000).tot * 0.25) > 0.999999); run('HZ.scale=1');
});
