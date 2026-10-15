// A minimal DOM adapter checks application wiring without a browser.
// This does not validate layout, accessibility trees, touch behavior or rendering.
import test from 'node:test';
import assert from 'node:assert/strict';

test('application wires birth, pause, decisions, actions, funds, export and title', async () => {
  const handlers = {}, stored = new Map();
  const el = () => ({ innerHTML: '', textContent: '', scrollLeft: 190, classList: { toggle() {}, add() {}, remove() {} }, setAttribute() {}, focus() {}, isConnected: false, querySelectorAll: () => [] });
  const app = el(), sheetRoot = el(), sheet = el(), toast = el(), sceneScroll = el(), main = el();
  let frame, downloaded = false;
  globalThis.document = {
    hidden: false, activeElement: main, body: el(),
    querySelector(selector) { return ({ '#app': app, '#sheet-root': sheetRoot, '.sheet': sheet, '#toast': toast, '.scene-scroll': sceneScroll, main })[selector] || null; },
    addEventListener(name, fn) { handlers[name] = fn; },
    createElement() { return { click() { downloaded = true; } }; },
  };
  globalThis.localStorage = { getItem: k => stored.get(k) ?? null, setItem: (k, v) => stored.set(k, v) };
  globalThis.window = { addEventListener() {}, scrollTo() {}, confirm: () => true };
  Object.defineProperty(globalThis, 'crypto', { configurable: true, value: { getRandomValues(array) { array[0] = 42; return array; } } });
  globalThis.requestAnimationFrame = fn => { frame = fn; };
  await import('../src/app.js');
  const click = (action, extras = {}) => handlers.click({ target: { closest() { return { disabled: false, dataset: { action, ...extras } }; } } });
  const state = () => JSON.parse(stored.get('earth2000.run.v1')).run;
  assert.match(app.innerHTML, /2000/);
  click('new'); assert.equal(state().tick, 0); assert.match(sheetRoot.innerHTML, /あなたの人生が/);
  click('begin'); assert.match(app.innerHTML, /一時停止/);
  for (let t = 0; t <= 1400; t += 200) frame(t);
  assert.ok(state().tick > 0);
  click('play'); const stopped = state().tick;
  for (let t = 1600; t <= 5000; t += 200) frame(t);
  assert.equal(state().tick, stopped);
  click('skip'); assert.ok(state().pending); assert.match(sheetRoot.innerHTML, /世界が少し/);
  click('close'); assert.match(app.innerHTML, /決断が待っています/);
  click('menu', { panel: 'finance' }); assert.match(sheetRoot.innerHTML, /生活点/);
  click('close'); assert.ok(state().pending);
  click('decision'); const p = state().pending; click('choose', { id: p.options[0].id, decision: p.id }); assert.equal(state().pending, null);
  click('menu', { panel: 'focus' }); click('focus', { id: 'learn' }); assert.equal(state().focus, 'learn');
  click('menu', { panel: 'actions' }); const before = state().money;
  click('start', { id: 'study' }); assert.equal(state().actions.length, 1); assert.equal(state().money, before - 15);
  click('start', { id: 'study' }); assert.equal(state().money, before - 15);
  click('menu', { panel: 'settings' }); click('export'); assert.ok(downloaded);
  click('title'); assert.match(app.innerHTML, /つづきの人生へ/);
  click('continue'); assert.match(app.innerHTML, /現在の生活方針/);
  document.hidden = true; handlers.visibilitychange();
  const paused = state().tick; for (let t = 5200; t <= 8000; t += 200) frame(t);
  assert.equal(state().tick, paused);
  document.hidden = false; handlers.visibilitychange(); assert.match(app.innerHTML, /時間は止まっています/);
});
