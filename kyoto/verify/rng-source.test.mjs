// ゲーム結果に影響する乱数が、すべて保存対象の rand() を通っていることを守る（単位2）。
// Math.random() を使ってよいのは、画面の演出・識別子・設計室のシミュレーションだけ。新しい場所で使うとここで失敗する。
// Run: node --test kyoto/verify/rng-source.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = resolve(dirname(fileURLToPath(import.meta.url)), '../src/js');
const ALLOWED = {
  '01-core-personas.js': '乱数の実装そのもの（rand の種・フォールバック）',
  '07-state-core.js': '人生IDの一意化（結果に影響しない）',
  '14-ui-scene.js': '人物の歩き回りの演出',
  '17-control.js': '誕生の抽選（人生の乱数から切り離して使う）',
  '18-birth-ceremony.js': '誕生演出の紙吹雪',
  '18b-design-hook.js': '設計室の自動シミュレーション（実際の人生ではない）',
};
test('Math.random is only used in cosmetic / detached places', () => {
  const bad = [];
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.js'))) {
    const n = (readFileSync(resolve(dir, f), 'utf8').match(/Math\.random\(/g) || []).length;
    if (n && !ALLOWED[f]) bad.push(`${f}: ${n}`);
  }
  assert.deepEqual(bad, [], 'ゲーム結果に関わる場所で Math.random() が使われている。rand() を使うこと');
});
test('game-logic files draw every random number through rand()', () => {
  for (const f of ['02-abilities-temperament.js', '05-birth-era-personas.js', '06-event-spec-engine.js', '09-state-cases-aftermath.js', '12-ui-household.js', '13-ui-decisions.js']) {
    assert.ok(!/Math\.random/.test(readFileSync(resolve(dir, f), 'utf8')), f);
  }
});
