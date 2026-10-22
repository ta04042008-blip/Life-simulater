import test from 'node:test';
import assert from 'node:assert/strict';
import { ACTIONS, FOCUSES, STATS, WORLDS } from '../src/data.js';
import { MAX_AGE, actionAvailability, clone, createRun, nextDecision, relationship, resolveDecision, restore, setFocus, snapshot, startAction, step, summary } from '../src/engine.js';

function chooseFree(r) { const o = r.pending.options.find(o => o.cost <= r.money); assert.ok(o); assert.equal(resolveDecision(r, o.id, r.pending.id).ok, true); }
function reachAge(age, seed = 42) {
  for (let s = seed; s < seed + 1000; s++) {
    const r = createRun(s, 'modern');
    while (r.tick < age * 4 && !r.dead) { if (r.pending) chooseFree(r); else step(r); }
    if (!r.dead) { if (r.pending) chooseFree(r); return r; }
  }
  throw new Error('Could not find fixture');
}
test('birth creates six bounded stats and clear prototype data identity', () => {
  for (const w of WORLDS) { const r = createRun(91, w.id); assert.equal(r.birthYear, w.year); assert.equal(r.tick, 0); assert.equal(r.people.length, 2); assert.equal(r.log.length, 1); for (const s of STATS) assert.ok(r.stats[s.id] >= 0 && r.stats[s.id] <= 300); }
});
test('seed zero is normalized and unknown worlds rejected', () => { assert.equal(createRun(0).seed, 1); assert.throws(() => createRun(12, 'unknown')); });
test('same seed and choices produce the same complete life', () => {
  const a = createRun(117), b = createRun(117);
  for (const r of [a, b]) { while (!r.dead) { nextDecision(r); if (r.pending) chooseFree(r); } }
  assert.deepEqual(a, b);
});
test('decision waiting freezes game time, resources, and RNG', () => {
  const r = reachAge(5); nextDecision(r); assert.ok(r.pending);
  const before = snapshot(r);
  for (let n = 0; n < 20; n++) assert.equal(step(r), false);
  assert.equal(snapshot(r), before);
});
test('invalid and duplicate choices do not charge or apply effects', () => {
  const r = reachAge(24); nextDecision(r); assert.equal(r.pending.age, 25);
  const id = r.pending.id, before = snapshot(r);
  assert.equal(resolveDecision(r, 'missing', id).ok, false); assert.equal(snapshot(r), before);
  const result = resolveDecision(r, 'together', id); assert.equal(result.ok, true);
  const after = snapshot(r); assert.equal(resolveDecision(r, 'together', id).ok, false); assert.equal(snapshot(r), after);
  assert.equal(r.people.filter(p => p.id === 'partner').length, 1);
});
test('insufficient funds keep the decision pending with no partial effects', () => {
  const r = reachAge(24); nextDecision(r); r.money = 0; const before = snapshot(r);
  assert.equal(resolveDecision(r, 'together', r.pending.id).ok, false); assert.equal(snapshot(r), before);
  assert.equal(resolveDecision(r, 'apart', r.pending.id).ok, true);
});
test('new actions and focus changes are blocked while deciding', () => {
  const r = reachAge(5); nextDecision(r); const before = snapshot(r);
  assert.equal(startAction(r, 'study').ok, false); assert.equal(setFocus(r, 'learn').ok, false); assert.equal(snapshot(r), before);
});
test('focus accrues only for future quarter-year intervals', () => {
  const r = reachAge(20); const old = r.focusTime.balance; setFocus(r, 'learn');
  const n = r.focusTime.learn; step(r);
  assert.equal(r.focusTime.balance, old); assert.equal(r.focusTime.learn, n + .25);
});
test('work focus cannot be used before employment', () => { const r = createRun(5); assert.equal(setFocus(r, 'work').ok, false); });
test('action charges once, rejects duplicate, respects duration, and completes once', () => {
  const r = reachAge(20); const start = r.tick, money = r.money;
  assert.equal(startAction(r, 'craft').ok, true); assert.equal(r.money, money - 10);
  const before = snapshot(r); assert.equal(startAction(r, 'craft').ok, false); assert.equal(snapshot(r), before);
  step(r); step(r); assert.equal(r.memories.length, 0); step(r);
  assert.equal(r.tick, start + 3); assert.equal(r.memories.length, 1); assert.equal(r.actions.length, 0);
  step(r); assert.equal(r.memories.length, 1);
});
test('age, target, funds and concurrent action limits are enforced', () => {
  const child = createRun(1); assert.match(actionAvailability(child, 'apply'), /16歳/);
  const r = reachAge(20); const before = snapshot(r);
  assert.equal(startAction(r, 'visit', 'unknown').ok, false); assert.equal(snapshot(r), before);
  assert.equal(startAction(r, 'study').ok, true); assert.equal(startAction(r, 'rest').ok, true); assert.equal(startAction(r, 'craft').ok, false);
  const poor = reachAge(20); poor.money = 0; assert.equal(startAction(poor, 'study').ok, false);
});
test('individual contact affects the chosen person, not everyone', () => {
  const r = reachAge(20); const other = r.people[1].trust; const target = r.people[0].trust;
  startAction(r, 'visit', r.people[0].id); step(r);
  assert.equal(r.people[0].trust, target + 7); assert.equal(r.people[1].trust, other);
});
test('save/load preserves pending choices, running actions and deterministic future', () => {
  const a = reachAge(20); startAction(a, 'study'); step(a);
  const b = restore(snapshot(a)); assert.deepEqual(a, b);
  for (let i = 0; i < 40 && !a.dead; i++) { if (a.pending) { chooseFree(a); chooseFree(b); } else { step(a); step(b); } }
  assert.deepEqual(a, b);
  const c = reachAge(5); nextDecision(c); assert.deepEqual(restore(snapshot(c)), c);
});
test('normal step and skip-to-decision do not change results', () => {
  const a = createRun(24), b = clone(a);
  while (!a.dead && !a.pending) step(a); nextDecision(b); assert.deepEqual(a, b);
});
test('ending freezes all updates and has a reproducible summary', () => {
  const r = createRun(145);
  while (!r.dead) { nextDecision(r); if (r.pending) chooseFree(r); }
  const before = snapshot(r); assert.equal(step(r), false); assert.equal(nextDecision(r), 0); assert.equal(startAction(r, 'study').ok, false); assert.equal(setFocus(r, 'rest').ok, false);
  assert.equal(snapshot(r), before); assert.ok(summary(r).age <= MAX_AGE); assert.deepEqual(restore(snapshot(r)), r);
});
test('all sample worlds complete bounded lives without non-finite stats or money', () => {
  for (const world of WORLDS) for (let seed = 1; seed <= 30; seed++) {
    const r = createRun(seed, world.id);
    let decisions = 0;
    while (!r.dead) { nextDecision(r); if (r.pending) { chooseFree(r); decisions++; assert.ok(decisions <= 12); } }
    assert.ok(r.tick <= MAX_AGE * 4); assert.ok(Number.isFinite(r.money));
    for (const s of STATS) assert.ok(r.stats[s.id] >= 0 && r.stats[s.id] <= 300);
    assert.deepEqual(restore(snapshot(r)), r);
  }
});
test('focus totals match simulated lifetime; no elapsed wall-time is added', () => { const r = reachAge(40); assert.equal(Object.values(r.focusTime).reduce((a, b) => a + b, 0), r.tick / 4); });
test('relationship labels include memories of deceased people', () => { assert.equal(relationship({ alive: false, trust: 99 }), '思い出の中に'); assert.equal(relationship({ alive: true, trust: 75 }), 'とても親しい'); });
test('restoration rejects corrupt versions, NaN-equivalents, arrays and decisions', () => {
  assert.throws(() => restore('not-json')); assert.throws(() => restore('{}'));
  const r = reachAge(20);
  for (const mutate of [x => { x.version = 99; }, x => { x.stats.health = null; }, x => { x.money = '100'; }, x => { x.tick = -1; }, x => { x.rng = 0; }, x => { x.focus = 'fake'; }, x => { x.actions = {}; }, x => { x.people[0].trust = 'x'; }, x => { x.log = [null]; }, x => { x.history = [{}]; }, x => { x.housing = {}; }]) {
    const bad = clone(r); mutate(bad); assert.throws(() => restore(snapshot(bad)));
  }
  const pending = reachAge(5); nextDecision(pending); pending.pending.options[0].focus = 'invalid'; assert.throws(() => restore(snapshot(pending)));
});
test('all action and focus references are unique', () => { for (const defs of [ACTIONS, FOCUSES, WORLDS, STATS]) assert.equal(new Set(defs.map(x => x.id)).size, defs.length); });
