import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, nextDecision, resolveDecision, restore, snapshot, step, clone } from '../src/engine.js';

const choose = (r, id = r.pending.options[0].id) => assert.equal(resolveDecision(r, id, r.pending.id).ok, true);
function employed() {
  for (let seed = 1; seed < 100; seed++) {
    const r = createRun(seed, 'modern');
    while (!r.dead && !r.job) { nextDecision(r); if (r.pending) choose(r); }
    if (!r.dead) return r;
  }
  throw Error('No living fixture');
}
function storyChoice(r, stage, id) {
  while (!r.dead) {
    nextDecision(r);
    if (r.pending?.story === 'work' && r.pending.stage === stage) {
      assert.deepEqual(restore(snapshot(r)), r);
      if (id) choose(r, id);
      return;
    }
    if (r.pending) choose(r);
  }
  throw Error('Fixture died before story');
}
test('employment connects one colleague, two choices and a three-year consequence', () => {
  const r = employed();
  assert.equal(r.people.filter(p => p.id === 'coworker').length, 1);
  storyChoice(r, 'meeting', 'talk');
  storyChoice(r, 'priority', 'people');
  const start = r.tick, money = r.money;
  const resumed = restore(snapshot(r));
  for (const life of [r, resumed]) storyChoice(life, 'reflection');
  assert.deepEqual(r, resumed);
  assert.equal(r.tick, start + 12);
  assert.ok(r.money > money);
  assert.match(r.pending.text, /仕事以外のことも話せる/);
  const before = snapshot(r);
  assert.equal(step(r), false); assert.equal(snapshot(r), before);
  const decision = r.pending.id;
  choose(r); assert.equal(r.workStory.stage, 'complete');
  assert.equal(r.memories.length, 1);
  assert.match(r.log.at(-2).text, /収入の一部/);
  const after = snapshot(r);
  assert.equal(resolveDecision(r, 'continue', decision).ok, false);
  assert.equal(snapshot(r), after);
});
test('working more and protecting time produce different money, fatigue, experience and trust', () => {
  const base = employed(); storyChoice(base, 'meeting', 'talk'); storyChoice(base, 'priority');
  const work = clone(base), people = clone(base), balanced = clone(base);
  choose(work, 'work'); choose(people, 'people'); choose(balanced, 'balance');
  for (const r of [work, people, balanced]) storyChoice(r, 'reflection');
  assert.ok(work.money > balanced.money && balanced.money > people.money);
  assert.ok(work.fatigue > balanced.fatigue && work.fatigue > people.fatigue);
  assert.ok(work.experience > people.experience);
  const trust = r => r.people.find(p => p.id === 'coworker').trust;
  assert.ok(trust(people) > trust(balanced) && trust(balanced) > trust(work));
  assert.notEqual(work.pending.text, people.pending.text);
});
test('milestones take precedence and the delayed story resumes next quarter', () => {
  const r = employed(); storyChoice(r, 'meeting', 'help');
  nextDecision(r);
  assert.equal(r.pending.age, 18); assert.equal(r.pending.story, undefined);
  choose(r); step(r);
  assert.equal(r.pending.stage, 'priority'); assert.equal(r.tick, 73);
  assert.deepEqual(restore(snapshot(r)), r);
});
test('old saves and other worlds keep their original progression', () => {
  const legacy = createRun(42, 'modern'); delete legacy.workStory;
  const restored = restore(snapshot(legacy));
  while (!restored.dead && restored.tick < 100) {
    nextDecision(restored);
    if (restored.pending) { assert.equal(restored.pending.story, undefined); choose(restored); }
  }
  assert.equal(restored.people.some(p => p.id === 'coworker'), false);
  assert.equal(createRun(42, 'river').workStory, undefined);
});
test('corrupt story state and forged story choices are rejected on import', () => {
  const r = employed(); storyChoice(r, 'meeting');
  for (const mutate of [x => x.workStory.stage = 'fake', x => x.workStory.due = 'soon', x => x.workStory.approach = 'fake', x => x.pending.options[0].cost = 999, x => x.pending.stage = 'reflection']) {
    const bad = clone(r); mutate(bad); assert.throws(() => restore(snapshot(bad)));
  }
});
test('a deceased colleague stays in memories without gaining trust', () => {
  const r = employed(); const p = r.people.find(p => p.id === 'coworker');
  p.alive = false; const before = p.trust;
  storyChoice(r, 'meeting', 'talk'); storyChoice(r, 'priority', 'people'); storyChoice(r, 'reflection');
  assert.equal(p.trust, before); assert.match(r.pending.text, /思い出の中/);
});
