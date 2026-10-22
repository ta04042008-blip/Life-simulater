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
    assert.ok(persona.yr[1] <= 2001, id + ': beyond supported year 2000');
    assert.ok(persona.yr[0] < persona.yr[1], id + ': empty range');
  }
});

test('random births cover CE 1 through CE 1900 without an invalid year or persona', () => {
  for (let offset = 0; offset < 1900; offset++) {
    ctx.rnd = () => offset; // Force every possible result of rnd(1900).
    const { pid, year } = pick();
    assert.equal(year, offset + 1, 'year draw ' + offset);
    assert.ok(Object.hasOwn(ctx.PERSONAS, pid), 'unknown persona for year ' + year);
    const [from, until] = ctx.PERSONAS[pid].yr;
    assert.ok(year >= from && year < until, pid + ' not valid in CE ' + year);
  }
});

test('every CE 1–1900 birth year has at least one valid persona', () => {
  const personas = Object.values(ctx.PERSONAS);
  for (let year = 1; year <= 1900; year++) {
    assert.ok(personas.some(({ yr }) => year >= yr[0] && year < yr[1]), 'gap at CE ' + year);
  }
});
