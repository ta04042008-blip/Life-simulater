// 単位4準備：寿命に年齢の上限（旧110歳の強制死亡）が無いことを確認する。新しい死亡率の数値は検査しない（単位4で確定）
import { open } from './lib.mjs';
const { browser, page, errs } = await open();
const out = []; const T = (name, ok, note = '') => { out.push(ok); console.log((ok ? 'PASS ' : 'FAIL ') + name + (note ? '  — ' + note : '')); };

const r = await page.evaluate(() => {
  const sv = { ...HZ }; HZ.scale = 0;       // 死亡確率ゼロ：年齢だけで死なないことを見る
  const go = () => { if (S.decision) { choose(0); if (S.decision) S.decision = null; return } slotsEnsure(); flushSlots(); tick(); };
  newGame('common', 1950); S.switchAge = 24; let g = 0, at110 = null, at111 = null;
  while (!S.dead && S.age < 150 && g++ < 12000) { go(); if (at110 === null && S.age >= 110) at110 = { dead: S.dead, age: S.age }; if (at111 === null && S.age >= 111) at111 = { dead: S.dead, age: S.age }; }
  const res = { dead: S.dead, age: S.age, at110, at111, text: document.body.innerText.length > 0 };
  // 画面描画（高齢の表示）でエラーが出ないこと
  try { render(); res.render = true } catch (e) { res.render = String(e) }
  // 150歳の人生を保存・読み込みできること
  let snapStr = JSON.stringify(S); try { const snap = snapStr; const s2 = migrate(JSON.parse(snap)); saveStateOk(s2); res.save = true } catch (e) { res.save = String(e) }
  // 家族（NPC）も年齢だけでは死なない
  newGame('common', 1950); S.switchAge = 24; const n = S.npc.find((x) => x.off > 0); S.age = 100; n.off = 20; n.dead = false; g = 0;
  const a0 = S.age; while (!S.dead && S.age < 130 && g++ < 6000) go();
  res.npcAlive = !n.dead; res.npcAge = S.age + n.off;
  Object.assign(HZ, sv);
  // 壊れたセーブは今後も除外される
  try { const bad = JSON.parse(JSON.stringify(S)); bad.age = 5000; saveStateOk(bad); res.badRejected = false } catch (e) { res.badRejected = true }
  // 年齢の固定上限ではなく、整合性で壊れたセーブを見分ける
  const base = JSON.parse(snapStr); const rej = (mut) => { const b = JSON.parse(JSON.stringify(base)); mut(b); try { saveStateOk(b); return false } catch (e) { return true } };
  res.rej = { yearAge: rej((b) => { b.year = b.age }), future: rej((b) => { b.year = BIRTH_MAX + b.age + 1 }), t: rej((b) => { b.t = b.age + 3 }), frac: rej((b) => { b.age = 1.5 }), death: rej((b) => { b.dead = true; b.deathAge = b.age + 5 }), neg: rej((b) => { b.age = -1 }) };
  res.accept = (() => { try { saveStateOk(JSON.parse(JSON.stringify(base))); return true } catch (e) { return String(e) } })();
  return res;
});
T('死亡確率ゼロなら110歳で死なない（旧：強制死亡）', r.at110 && r.at110.dead === false && r.at111 && r.at111.dead === false, JSON.stringify({ at110: r.at110, at111: r.at111 }));
T('150歳まで生存でき、画面表示でエラーが出ない', r.dead === false && r.age >= 150 && r.render === true, JSON.stringify({ dead: r.dead, age: r.age, render: r.render }));
T('110歳超の人生を保存・再読み込みできる', r.save === true, String(r.save));
T('家族も年齢だけでは死なない（110歳超）', r.npcAlive === true && r.npcAge > 110, `家族の年齢${r.npcAge}`);
T('壊れたセーブは整合性で除外（出生年と年齢／経過時間／死亡年齢の矛盾）。固定の年齢上限は無い', r.badRejected === true && Object.values(r.rej).every(Boolean) && r.accept === true, JSON.stringify(r.rej) + ' ' + r.accept);
// 既定の（仮の）死亡率でも人生は必ず終わる（上限が無くても無限に生き続けない）
const d = await page.evaluate(() => { let maxAge = 0, n = 0, over110 = 0; for (let i = 0; i < 300; i++) { let a = 0; for (; a < 400; a++) { const h = annualHazard(a, 560, null).tot; if (rand() < 1 - Math.exp(-h)) break } n++; maxAge = Math.max(maxAge, a); if (a > 110) over110++ } return { n, maxAge, over110 } });
T('既定の仮の死亡率でも、全員が有限の年齢で死ぬ', d.maxAge < 400, JSON.stringify(d) + '（数値は仮。単位4で確定）');
T('ページエラーなし', errs.length === 0, JSON.stringify(errs));
await browser.close();
console.log(out.filter(Boolean).length + '/' + out.length + ' PASS'); process.exit(out.every(Boolean) ? 0 : 1);
