// 単位2：乱数状態の保存・再現性・旧セーブの移行を、実際のページで確認する。
import { open, FIXDIR } from './lib.mjs';
import { readFileSync, readdirSync } from 'node:fs';
const { browser, page, errs } = await open();
const out = []; const T = (name, ok, note = '') => { out.push(ok); console.log((ok ? 'PASS ' : 'FAIL ') + name + (note ? '  — ' + note : '')); };
await page.evaluate(() => {
  window.go1 = () => { if (S.decision) { choose(0); if (S.decision) S.decision = null; return } slotsEnsure(); flushSlots(); tick(); };
  window.runTo = (n) => { let g = 0; while (!S.dead && g++ < n) go1(); };
  window.fin = () => JSON.stringify(S);
  window.load = (s) => { S = migrate(JSON.parse(s)); slots = []; };
});

// 1. 同じ保存状態から再開 → 以後の結果が完全に一致（10人生・途中停止／回答待ち／死亡前を含む）
{ let same = 0, n = 0, sampleNote = '';
  for (let i = 0; i < 10; i++) {
    const r = await page.evaluate((i) => {
      newGame(i % 2 ? 'common' : 'm90c', i % 2 ? 1000 : 1990); S.switchAge = 24;
      runTo(30 + i * 9);
      const snap = fin(), snapDec = !!S.decision, snapQ = S.q;
      runTo(400); const cont = fin();                          // 再読み込みせずに続けた結果
      load(snap); runTo(400); const a = fin();
      load(snap); runTo(400); const b = fin();
      return { cont: cont === a, ab: a === b, snapDec, snapQ, rs: JSON.parse(snap).rs };
    }, i);
    n++; if (r.cont && r.ab) same++; else sampleNote = JSON.stringify(r);
  }
  T('同じ保存状態から再開すると、以後の人生が一致する（再開しない場合とも一致）', same === n, `${same}/${n}人生` + sampleNote);
}
// 2. 回答待ちの保存から：回答の結果が一致し、二重に反映されない
{ const r = await page.evaluate(() => {
    newGame('m90c', 1990); let g = 0; while (!S.dead && !S.decision && g++ < 2000) go1();
    const snap = fin(); const dec = JSON.stringify(S.decision);
    load(snap); choose(0); const a = fin(); runTo(60); const aRun = fin();
    load(snap); choose(0); const b = fin(); runTo(60); const bRun = fin();
    load(a); choose(0); choose(1); const again = fin();        // 回答後に保存→復元→もう一度回答しても変わらない
    load(snap); const dec2 = JSON.stringify(S.decision);
    return { same: a === b && aRun === bRun, noDouble: again === a, decSame: dec === dec2, hadDec: dec !== 'null' };
  });
  T('回答待ちからの再開：選択肢が同じ・結果が一致・回答は一度だけ反映', r.hadDec && r.same && r.noDouble && r.decSame, JSON.stringify(r)); }
// 3. 死亡の確定：同じ保存状態から同じ年齢・死因で死に、再読み込みしても二重に確定しない
{ const r = await page.evaluate(() => {
    newGame('common', 1000); S.switchAge = 24; let g = 0; while (!S.dead && S.age < 40 && g++ < 2000) go1();
    const snap = fin(); const res = [];
    for (let k = 0; k < 3; k++) { load(snap); runTo(2000); res.push([S.deathAge, S.cause, S.year]); }
    const dead = fin(); const deathLogs = S.log.filter((l) => /歳で亡くなった。（死因/.test(JSON.stringify(l))).length;
    load(dead); const r1 = tick(); const dead2 = fin(); load(dead2); const r2 = tick();
    return { same: res.every((x) => JSON.stringify(x) === JSON.stringify(res[0])), res0: res[0], deathLogs, noTick: r1 === false && r2 === false && fin() === dead };
  });
  T('死亡：同じ保存状態から同じ年齢・死因／再読み込みで二重確定しない', r.same && r.deathLogs === 1 && r.noTick, JSON.stringify(r)); }
// 4. 画面表示・情報閲覧だけでは、ゲームの乱数と状態が変わらない
{ const before = await page.evaluate(() => { newGame('m90c', 1990); runTo(120); return { rs: S.rs, s: fin() }; });
  for (const v of ['life', 'map', 'menu', 'life']) { await page.evaluate((v) => { go(v); render(); }, v); await page.waitForTimeout(150); }
  await page.evaluate(() => { for (let i = 0; i < 30; i++) { render(); drawScene(); } if (typeof renderMap === 'function') renderMap(); });
  await page.waitForTimeout(1200);                               // 歩き回りなどの演出が動く時間
  const after = await page.evaluate(() => ({ rs: S.rs, s: fin() }));
  T('画面の表示・切替・演出だけでは S.rs もゲーム状態も変わらない', before.rs === after.rs && before.s === after.s, `rs ${before.rs}→${after.rs}`); }
// 5. 進行操作の経路が違っても結果は同じ（step() と手動の繰り返し／途中の再生成なし）
{ const r = await page.evaluate(() => {
    newGame('common', 1000); S.switchAge = 24; const snap = fin();
    load(snap); stop(); step(24); const viaStep = fin();
    load(snap); for (let i = 0; i < 24; i++) { if (S.decision || S.dead) break; slotsEnsure(); flushSlots(); tick(); } const viaTick = fin();
    return { eq: viaStep === viaTick, decision: !!JSON.parse(viaStep).decision };
  });
  T('step() と手動の進行で、結果が一致する', r.eq, JSON.stringify(r)); }
// 6. 途中イベントの予定は保存され、再読み込みで引き直さない
{ const r = await page.evaluate(() => {
    newGame('m90c', 1990); runTo(30); slotsEnsure(); const s1 = JSON.stringify(S.slots), rs1 = S.rs;
    const snap = fin(); load(snap); slotsEnsure(); const s2 = JSON.stringify(S.slots);
    return { same: s1 === s2, rsSame: rs1 === S.rs, n: S.slots.length };
  });
  T('途中イベントの予定は保存され、復元しても引き直さない（乱数も進まない）', r.same && r.rsSame, JSON.stringify(r)); }
// 7. 旧セーブ5種：移行・原本の退避・乱数の補完（一度だけ）
{ const files = readdirSync(FIXDIR).filter((f) => /^legacy_.*\.json$/.test(f)).sort();
  for (const f of files) {
    const raw = readFileSync(FIXDIR + '/' + f, 'utf8');
    const r = await page.evaluate((raw) => {
      localStorage.clear(); const legacy = JSON.parse(raw);
      const had = legacy.rs == null;
      const ok1 = saveRestore(legacy, 'テスト'); const rs1 = S.rs, lid1 = S.lid;
      const idx1 = JSON.parse(localStorage.getItem(KEY + '-premigrate-index') || '[]');
      const orig1 = idx1.length ? localStorage.getItem(idx1[0].key) : null;
      const ok2 = saveRestore(JSON.parse(raw), 'テスト'); const rs2 = S.rs, lid2 = S.lid;       // 同じ旧セーブをもう一度開く
      const idx2 = JSON.parse(localStorage.getItem(KEY + '-premigrate-index') || '[]');
      const orig2 = idx2.length ? localStorage.getItem(idx2[0].key) : null;
      const auto = JSON.parse(localStorage.getItem(SAVE_AUTO_KEY)); const okAuto = saveLoadKey(SAVE_AUTO_KEY, '自動保存'); const rs3 = S.rs;   // 移行後の自動保存から開く
      runTo(60); const rsAfter = S.rs;
      let end = 0; const sn = fin(); load(sn); runTo(3000); const e1 = fin(); load(sn); runTo(3000); const e2 = fin();
      return { had, ok1, ok2, okAuto, sameRs: rs1 === rs2 && rs1 === rs3, rsInt: Number.isInteger(rs1) && rs1 >= 0, sameLid: lid1 === lid2, backupOnce: idx1.length === 1 && idx2.length === 1 && orig1 === orig2 && orig1 === JSON.stringify(JSON.parse(raw)),
        autoHasRs: Number.isInteger(auto.rs), advanced: S.dead ? true : rsAfter !== rs1, replay: e1 === e2, noErr: true };
    }, raw);
    const ok = r.had && r.ok1 && r.ok2 && r.okAuto && r.sameRs && r.rsInt && r.sameLid && r.backupOnce && r.autoHasRs && r.advanced && r.replay;
    T(`旧セーブ ${f}：移行・原本退避は一度だけ・乱数は一度だけ補完・続きが再現`, ok, JSON.stringify(r));
  } }
// 8. 壊れた旧セーブ：現在の人生を変えず、原本の退避は残る。退避した原本を手動の枠へ戻せる
{ const r = await page.evaluate(() => {
    localStorage.clear(); newGame('common', 1000); const before = fin();
    const bad = { pid: 'common', ver: 5, year: 1000, age: 14, t: 14, mode: 'q', q: 0, stats: [1, 2, 3, 99999], npc: [], log: [], chron: [], pending: [] };
    const ok = saveRestore(bad, '壊れた旧セーブ');
    const idx = JSON.parse(localStorage.getItem(KEY + '-premigrate-index') || '[]');
    const kept = idx.length === 1 && JSON.parse(localStorage.getItem(idx[0].key)).stats[3] === 99999;
    localStorage.setItem(KEY, 'current-manual'); const rest = saveRestoreOriginal(idx[0] && idx[0].key);
    return { ok, unchanged: fin() === before, kept, restored: rest && JSON.parse(localStorage.getItem(KEY)).stats[3] === 99999, savedCurrent: localStorage.getItem(KEY + '-replaced-by-restore') === 'current-manual' };
  });
  T('移行に失敗する旧セーブ：人生は変わらず、原本は退避済みで手動の枠へ戻せる', !r.ok && r.unchanged && r.kept && r.restored && r.savedCurrent, JSON.stringify(r)); }
// 9. 新しい人生は別の種を持ち、生成直後から保存される
{ const r = await page.evaluate(() => { const set = new Set(); for (let i = 0; i < 20; i++) { newGame('common', 1000); set.add(S.rs); } newLife('common', 100, false); const saved = JSON.parse(localStorage.getItem(SAVE_AUTO_KEY)); return { distinct: set.size, savedRs: Number.isInteger(saved.rs) && saved.rv === 1 }; });
  T('新しい人生は人生ごとに別の乱数の種を持ち、自動保存に含まれる', r.distinct >= 19 && r.savedRs, JSON.stringify(r)); }
console.log('page errors:', JSON.stringify(errs.filter((e) => !/ERR_TUNNEL/.test(e))));
await browser.close();
const bad = out.filter((x) => !x).length; console.log(`${out.length - bad}/${out.length} PASS`);
if (bad || errs.length) process.exit(1);
