// Asset-independent regression checks for the Kyoto prototype's CE birth-year bounds.
// Run: node --test kyoto/verify/birth-year-range.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(resolve(root, p), 'utf8');

// The Kyoto code is a classic script whose modules share globals. Supply only
// the base persona fixture required to load the real production birth-year code.
const base = () => ({
  stats: [500, 500, 500, 500],
  npc: Array.from({ length: 4 }, () => ['名前', '家族', 50, 0]),
  yr: [1, 1185],
});
const personaIds = ['aristocrat', 'common', 'farm', 'artisan'];
const ctx = vm.createContext({
  PERSONAS: Object.fromEntries(personaIds.map((id) => [id, base()])),
  RANDW: {},
  BG: {},
  SPR: { body: {}, hair: {}, hairGray: {} },
  NPCOFF: {},
  NPCSK: {},
  NPCSKN: {},
  FAMNEED: {},
  LEARN: {},
  rnd: () => 0,
});
// 出生年の最大値は本番コード（01-core-personas.js）の定義をそのまま読む（テスト側で値を決め直さない）
const maxMatch = read('src/js/01-core-personas.js').match(/const BIRTH_MAX=(\d+);/);
assert.ok(maxMatch, 'BIRTH_MAX must be defined in production code');
const BIRTH_MAX = Number(maxMatch[1]);
vm.runInContext('const BIRTH_MAX=' + BIRTH_MAX + ';', ctx);
vm.runInContext(read('src/js/05-birth-era-personas.js'), ctx, {
  filename: '05-birth-era-personas.js',
});
vm.runInContext(read('src/js/17-control.js'), ctx, {
  filename: '17-control.js',
});
const pick = () => vm.runInContext('randomBirth()', ctx);

test('all selectable Kyoto birth-year ranges start in CE 1 or later', () => {
  for (const [id, persona] of Object.entries(ctx.PERSONAS)) {
    assert.ok(persona.yr[0] >= 1, id + ': invalid first year');
    assert.ok(persona.yr[1] <= 2026, id + ': beyond supported year 2025');
    assert.ok(persona.yr[0] < persona.yr[1], id + ': empty range');
  }
});

test('birth-year maximum is CE 2025', () => {
  assert.equal(BIRTH_MAX, 2025);
});

test('random births cover CE 1 through CE 2025 without an invalid year or persona', () => {
  for (let offset = 0; offset < BIRTH_MAX; offset++) {
    ctx.rnd = () => offset; // Force every possible result of rnd(2025): the year is drawn uniformly.
    const { pid, year, gap } = pick();
    assert.equal(year, offset + 1, 'year draw ' + offset);
    assert.ok(!gap, 'unexpected data gap at CE ' + year);
    assert.ok(Object.hasOwn(ctx.PERSONAS, pid), 'unknown persona for year ' + year);
    const [from, until] = ctx.PERSONAS[pid].yr;
    assert.ok(year >= from && year < until, pid + ' not valid in CE ' + year);
  }
});

test('every CE 1–2025 birth year has at least one valid, drawable formal persona', () => {
  const formal = Object.entries(ctx.PERSONAS).filter(([k, p]) => !p.testOnly && ctx.RANDW[k] > 0);
  for (let year = 1; year <= BIRTH_MAX; year++) {
    assert.ok(formal.some(([, { yr }]) => year >= yr[0] && year < yr[1]), 'gap at CE ' + year);
  }
});

test('boundary years 1900/1901, 1925/1926, 1999/2000, 2025/2026 are consistent', () => {
  const eras = (y) => vm.runInContext('eraName(' + y + ')', ctx);
  const at = (y, m, d) => vm.runInContext('eraAt(' + y + ',' + m + ',' + d + ')', ctx);
  // 改元の年は両方を表示し、1901〜1925年をすべて「大正」とはしない
  assert.equal(eras(1900), '明治'); assert.equal(eras(1911), '明治');
  assert.equal(eras(1912), '明治／大正'); assert.equal(eras(1913), '大正');
  assert.equal(eras(1925), '大正'); assert.equal(eras(1926), '大正／昭和');
  assert.equal(eras(1927), '昭和'); assert.equal(eras(1988), '昭和');
  assert.equal(eras(1989), '昭和／平成'); assert.equal(eras(2018), '平成');
  assert.equal(eras(2019), '平成／令和'); assert.equal(eras(2020), '令和'); assert.equal(eras(2025), '令和');
  // 改元日の前日と当日（1912-07-30、1926-12-25、1989-01-08、2019-05-01）
  assert.equal(at(1912, 7, 29), '明治'); assert.equal(at(1912, 7, 30), '大正');
  assert.equal(at(1926, 12, 24), '大正'); assert.equal(at(1926, 12, 25), '昭和');
  assert.equal(at(1989, 1, 7), '昭和'); assert.equal(at(1989, 1, 8), '平成');
  assert.equal(at(2019, 4, 30), '平成'); assert.equal(at(2019, 5, 1), '令和');
  assert.equal(at(2019, 12, 31), '令和'); assert.equal(at(1905, 6, 1), '明治'); assert.equal(at(1920, 6, 1), '大正');
  for (const [a, b] of [[1900, 1901], [1925, 1926], [1999, 2000], [2025, 2026]]) {
    for (const y of [a, b]) {
      ctx.rnd = () => y - 1;
      if (y > BIRTH_MAX) continue; // 2026 is outside the draw.
      const r = pick();
      assert.equal(r.year, y); assert.ok(!r.gap, 'gap at ' + y);
      const [from, until] = ctx.PERSONAS[r.pid].yr;
      assert.ok(y >= from && y < until, r.pid + ' invalid at ' + y);
    }
  }
  // 1900/1901, 1925/1926, 1999/2000 are era-of-data seams: both sides must have formal data.
  const has = (y) => Object.entries(ctx.PERSONAS).some(([k, p]) => !p.testOnly && ctx.RANDW[k] > 0 && y >= p.yr[0] && y < p.yr[1]);
  for (const y of [1900, 1901, 1925, 1926, 1999, 2000, 2025]) assert.ok(has(y), 'no formal persona at ' + y);
  assert.ok(!has(2026), '2026 must stay unsupported until the post-2026 decision');
});

test('a missing-data year is never redrawn and test-only personas never enter formal draws', () => {
  const saved = ctx.PERSONAS;
  const fixtures = { ...saved, tonly: { ...base(), yr: [1, 2026], testOnly: true } };
  const keep = Object.fromEntries(Object.entries(fixtures).map(([k, p]) => [k, p]));
  // Remove every formal persona covering 1950, keep the test-only one.
  for (const k of Object.keys(keep)) {
    if (k !== 'tonly' && 1950 >= keep[k].yr[0] && 1950 < keep[k].yr[1]) keep[k] = { ...keep[k], yr: [1, 1] };
  }
  ctx.PERSONAS = keep; ctx.RANDW.tonly = 100;
  let calls = 0; ctx.rnd = () => { calls++; return 1949; };
  const r = pick();
  ctx.PERSONAS = saved; delete ctx.RANDW.tonly;
  assert.equal(r.year, 1950, 'drawn year must be kept');
  assert.equal(r.gap, true, 'gap must be reported, not hidden');
  assert.equal(r.pid, null);
  assert.equal(calls, 1, 'the year must be drawn exactly once (no redraw)');
});

test('birth-circumstance weights: every 1901-2025 persona has a managed weight with status, basis and the diversity floor', () => {
  const table = vm.runInContext('BIRTH_W_TABLE', ctx), floor = vm.runInContext('BIRTH_FLOOR', ctx);
  assert.ok(floor >= 1);
  for (const [k, p] of Object.entries(ctx.PERSONAS)) {
    if (p.yr[0] < 1901) continue;
    const row = table[k];
    assert.ok(row, k + ': missing from BIRTH_W_TABLE');
    assert.ok(['統計', '仮'].includes(row[1]), k + ': status must be 統計 or 仮');
    assert.ok(typeof row[2] === 'string' && row[2].length > 5, k + ': basis required');
    assert.ok(row[0] >= floor && ctx.RANDW[k] === row[0], k + ': weight below floor or not applied');
  }
});

test('housing and household economy are separate axes for 2000-2025 (share of housing x share of economy)', () => {
  const h = vm.runInContext('HOUSING_2023', ctx), e = vm.runInContext('ECON', ctx);
  assert.ok(Math.abs(h.house + h.mansion + h.apart - 100) < 0.01, 'housing shares must sum to 100');
  assert.ok(Math.abs(e.standard + e.rich - 100) < 0.01, 'economy shares must sum to 100');
  const w = (k) => ctx.RANDW[k];
  for (const k of ['house', 'mansion', 'apart']) {
    assert.ok(Math.abs(w('r_' + k) / w('r_' + k + '_rich') - e.standard / e.rich) < 0.05, k + ': economy ratio');
  }
});

test('names switch to the Reiwa set only for people born in 2019 or later', () => {
  const nf = vm.runInContext('PERSONAS.r_house.nsFrom', ctx);
  assert.deepEqual(Array.from(nf), [2019, 'reiwa']);
});
