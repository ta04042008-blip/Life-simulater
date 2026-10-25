// 全体仕様書 v1.7 §10A の T01〜T12 を、現行の京都版に対して実行して状態を記録する（監査用・読み取りのみ）。
// 使い方: node kyoto/verify/spec_v17_baseline.mjs   （STRICT=1 で、不合格・ブロックがあると終了コード1）
// 状態: 合格 / 一部合格 / 不合格 / ブロック（前提の機能が未実装で検査できない）/ 未実施
// run-all.mjs は t_*.mjs だけを実行するので、この監査は既存の一括テストを赤くしない。
import { open } from './lib.mjs';

const { browser, page, errs } = await open();
const R = await page.evaluate(() => {
  const out = {};
  const play = (pid, year, stopAge = 200, hook) => {          // 決断は先頭の選択肢で答えて進める
    newGame(pid, year); S.switchAge = 24; let g = 0; const steps = [];
    while (!S.dead && S.age < stopAge && g++ < 9000) {
      if (S.decision) { choose(0); if (S.decision) S.decision = null; continue; }
      const t0 = S.t, a0 = S.age, mo0 = S.mo;
      tick(); steps.push([a0, +(S.t - t0).toFixed(2), S.mo - mo0]);
      if (hook) hook();
    }
    return steps;
  };
  const personaIn = (y) => Object.keys(PERSONAS).filter((k) => y >= PERSONAS[k].yr[0] && y < PERSONAS[k].yr[1]);

  // T01 日本固定で西暦1年と2025年を生成
  out.T01 = { y1: personaIn(1), y2025: personaIn(2025) };
  // T02 20か国版
  out.T02 = { countries: typeof COUNTRY !== 'undefined' };
  const quiet = () => { const sv = { ...HZ }; HZ.scale = 0; HZ.illMult = 1; HZ.sevMult = 1; return () => Object.assign(HZ, sv); };
  // T03 年齢境界の送り幅（死亡確率を止め、決断には先頭の選択肢で答え、境目から始まった1回分だけを測る）
  { const back = quiet(); const at = {};
    for (const [pid, yr] of [['m90c', 1990], ['common', 1000]]) { newGame(pid, yr); let g = 0;
      while (!S.dead && S.age < 63 && g++ < 9000) { if (S.decision) { choose(0); if (S.decision) S.decision = null; continue }
        S.nextSmallT = 1e9; S.nextDecT = 1e9;                                   // 送り幅だけを測るため、この間は選択を止める（選択の検査はT04・T05）
        const a0 = S.age, q0 = S.q, t0 = S.t, k = stepMonths(S.age) / 3; tick();
        if (q0 % k === 0 && !S.decision && !S.dead) (at[a0] ??= new Set()).add(+(S.t - t0).toFixed(2)); } }
    back(); out.T03 = Object.fromEntries([0, 3, 5, 6, 10, 23, 24, 25, 40, 58, 59, 60, 62].map((a) => [a, at[a] ? [...at[a]] : null])); }
  // T04 0〜5歳の1年送り中の出来事を飛ばさない
  { const R4 = {};
    { const back = quiet(); let bad = 0, n = 0;                                  // a. 乳児の1回分=1年で、内部の月が12回すべて処理される
      for (let i = 0; i < 20; i++) { newGame('common', 1000); const mo0 = S.mo; tick(); n++; if (S.mo - mo0 !== 12 || Math.abs(S.t - 1) > 1e-9) bad++; }
      R4.infantYearMonths = { runs: n, bad }; back(); }
    { const back = quiet(); let early = 0;                                        // b. 4歳になる前は選択が出ない
      for (let i = 0; i < 100; i++) { newGame('common', 1000); S.nextSmallT = 0; S.nextDecT = 0; let g = 0; while (!S.dead && S.age < 4 && g++ < 30) { tick(); if (S.decision && S.age < 4) early++ } }
      R4.choiceBeforeAge4 = early; back(); }
    { const back = quiet(); newGame('common', 1000); let g = 0;                    // c. 4〜5歳で期限が来た小さな選択は、年の途中でも時間を止めて出る
      while (S.age < 4 && g++ < 20) tick(); S.nextSmallT = S.t + 0.5; const t0 = S.t; tick();
      R4.smallChoiceMidYear = { appeared: !!S.decision, elapsedYears: +(S.t - t0).toFixed(2), expected: 0.5 }; back(); }
    { newGame('common', 1000); HZ.scale = 1e6; tick();                            // d. 乳児の死亡は、その四半期で確定して止まる（年末まで進めない）
      R4.deathMidYear = { dead: S.dead, t: S.t }; HZ.scale = 1; }
    out.T04 = R4; }
  // T05 選択中の時間停止・保存復元・二重回答
  { newGame('m90c', 1990); let g = 0; while (!S.dead && !S.decision && g++ < 800) tick();
    const before = JSON.stringify(S.decision), tBefore = S.t, qBefore = S.q;
    const blocked = tick() === false && S.t === tBefore && S.q === qBefore;                   // 回答待ちの間は時間が進まない
    const copy = JSON.parse(JSON.stringify(S)); const after = JSON.stringify(copy.decision);
    const snap1 = JSON.stringify(S); choose(0); const snap2 = JSON.stringify(S); choose(0); const snap3 = JSON.stringify(S);
    out.T05 = { hasDecision: !!before && before !== 'null', timeStoppedWhilePending: blocked, sameAfterReload: before === after, answeredOnce: snap2 !== snap1 && snap2 === snap3 };
    // 1回分の途中（乳児の2四半期め）で保存→復元→続行しても、残りの2四半期だけが進む（二重に進まない）
    const back = quiet(); newGame('common', 1000); tickQ(); tickQ(); const mid = JSON.parse(JSON.stringify(S));
    tick(); const t1 = S.t, mo1 = S.mo;
    S = migrate(JSON.parse(JSON.stringify(mid))); tick();
    out.T05.midGaugeResume = { midT: mid.t, afterContinue: S.t, expected: 1, sameAsDirect: S.t === t1 && S.mo === mo1 }; back();
    // 単位2：回答待ちの保存から2回再開して、回答後60ステップまで同じ結果になる（乱数状態が保存対象）
    newGame('m90c', 1990); let g2 = 0; while (!S.dead && !S.decision && g2++ < 2000) { if (S.decision) break; slotsEnsure(); flushSlots(); tick(); }
    const snapD = JSON.stringify(S); const rep = () => { S = migrate(JSON.parse(snapD)); slots = []; choose(0); let k = 0; while (!S.dead && k++ < 60) { if (S.decision) { choose(0); continue } slotsEnsure(); flushSlots(); tick(); } return JSON.stringify(S); };
    out.T05.reproducible = rep() === rep(); }
  // T06 死亡の確定が一度きり
  { newGame('m90c', 1990); HZ.scale = 1e6; let g = 0; while (!S.dead && g++ < 50) { if (S.decision) { choose(0); continue } tick(); }
    const age = S.deathAge, logs = S.log.length; const again = tick(); const logs2 = S.log.length;
    out.T06 = { dead: S.dead, tickAfterDeath: again, deathAgeKept: age === S.deathAge, logUnchanged: logs === logs2, deathLogCount: S.log.filter((l) => /歳で亡くなった。（死因/.test(JSON.stringify(l))).length };
    HZ.scale = 1;
    newGame('common', 1000); let g3 = 0; while (!S.dead && S.age < 30 && g3++ < 2000) { if (S.decision) { choose(0); continue } slotsEnsure(); flushSlots(); tick(); }
    const snapA = JSON.stringify(S); const dd = []; for (let k = 0; k < 3; k++) { S = migrate(JSON.parse(snapA)); slots = []; let h = 0; while (!S.dead && h++ < 3000) { if (S.decision) { choose(0); continue } slotsEnsure(); flushSlots(); tick(); } dd.push([S.deathAge, S.cause]); }
    out.T06.sameDeathFromSameSave = dd.every((x) => JSON.stringify(x) === JSON.stringify(dd[0])); }
  // T07 好感度9↔10の相関図（既存 t_map*.mjs で別途検査。ここでは未実施）
  out.T07 = { note: '既存 t_map.mjs/t_map2.mjs の範囲。T07専用の9↔10境界検査は未作成' };
  // T08 能力・★・気質の生成と保存
  { let ok = true, why = '';
    for (let i = 0; i < 300; i++) { newGame('common', 1000); const j = JSON.parse(JSON.stringify(S));
      if (!(S.stats.length === 4 && S.stats.every((v) => v >= 0 && v <= 1000))) { ok = false; why = 'stats'; break }
      if (!(S.star.length === 4 && S.star.every((v) => v >= 1 && v <= 5))) { ok = false; why = 'star'; break }
      if (!(S.tm.v.length === 5)) { ok = false; why = 'tm'; break }
      if (JSON.stringify(j.stats) !== JSON.stringify(S.stats) || JSON.stringify(j.star) !== JSON.stringify(S.star) || JSON.stringify(j.tm) !== JSON.stringify(S.tm)) { ok = false; why = 'roundtrip'; break } }
    out.T08 = { ok, why }; }
  // T09 成長の芽・追憶・4枠
  out.T09 = { sprouts: typeof SPROUT !== 'undefined' || /成長の芽/.test(document.documentElement.innerHTML) };
  // T10 2025年から2026年以降へ生存
  { let maxYear = 0, aliveAfter2026 = 0;
    for (let i = 0; i < 40; i++) { play('m90c', 1990, 200, () => { maxYear = Math.max(maxYear, S.year); }); if (S.year > 2026) aliveAfter2026++; }
    out.T10 = { maxYear, livesPast2026: aliveAfter2026, futureEstimateLabel: typeof FUTURE !== 'undefined' }; }
  // T11 1年（または四半期）送り中に内部の月が欠けない
  { const steps = play('common', 1000, 40); const bad = steps.filter(([a, d, m]) => Math.round(d * 12) !== m);
    out.T11 = { stepsChecked: steps.length, monthMismatch: bad.length }; }
  // T12 高齢・早世
  { const sv = { ...HZ }; HZ.scale = 0; play('common', 1000, 130); const old = { deathAge: S.dead ? S.deathAge : null, cause: S.cause, ageNow: S.age, dead: S.dead }; Object.assign(HZ, sv);
    HZ.scale = 1e6; newGame('common', 1000); let g = 0; while (!S.dead && g++ < 50) { if (S.decision) { choose(0); continue } tick(); }
    out.T12 = { zeroHazardDeath: old, earlyDeathAge: S.deathAge, chron: Array.isArray(S.chron) }; HZ.scale = 1; }
  return out;
});

const rows = [];
const add = (id, name, status, ev) => rows.push({ id, name, status, ev });
const r = R;
add('T01', '日本版で1年・2025年を出生', r.T01.y2025.length && r.T01.y1.length ? '合格' : '不合格', `1年→${r.T01.y1.join(',') || 'なし'} / 2025年→${r.T01.y2025.join(',') || '境遇なし'}`);
add('T02', '20か国版の出生抽選', r.T02.countries ? '未実施' : 'ブロック', '国別データと抽選が未実装（v1.7どおり日本版合格後）');
{ const t = r.T03, one = (a, v) => t[a] && t[a].length === 1 && t[a][0] === v;
  const ok = one(0, 1) && one(3, 1) && one(5, 1) && one(6, 0.25) && one(10, 0.25) && one(23, 0.25) && one(24, 0.25) && one(25, 0.5) && one(40, 0.5) && one(58, 0.5) && one(59, 0.5) && one(60, 1) && one(62, 1);
  add('T03', '年齢境界の送り幅', ok ? '合格' : '不合格', '年齢→1回分の長さ(年): ' + JSON.stringify(t)); }
{ const t = r.T04, ok = t.infantYearMonths.bad === 0 && t.choiceBeforeAge4 === 0 && t.smallChoiceMidYear.appeared && t.smallChoiceMidYear.elapsedYears === 0.5 && t.deathMidYear.dead && t.deathMidYear.t === 0.25;
  add('T04', '0〜5歳の途中の出来事', ok ? '合格' : '不合格', JSON.stringify(t) + ' ／幼児の選択開始4歳はユーザー決定(A案)'); }
add('T05', '選択中の再読込・二重回答・時間停止', r.T05.hasDecision && r.T05.timeStoppedWhilePending && r.T05.sameAfterReload && r.T05.answeredOnce && r.T05.midGaugeResume.sameAsDirect && r.T05.reproducible ? '合格' : '不合格', JSON.stringify(r.T05) + ' ／詳細な再現性・旧セーブ移行は t_rng.mjs');
add('T06', '死亡の二重確定', r.T06.dead && !r.T06.tickAfterDeath && r.T06.deathLogCount === 1 && r.T06.sameDeathFromSameSave ? '一部合格' : '不合格', JSON.stringify(r.T06) + ' ／死亡の一度きり確定と再現は合格。病気・事故との二重計上は死亡率の再設計（単位4）後に検査');
add('T07', '好感度9↔10の相関図', '未実施', r.T07.note);
add('T08', '能力・★・気質の生成と保存', r.T08.ok ? '合格' : '不合格', JSON.stringify(r.T08) + ' (300人)');
add('T09', '成長の芽と追憶', r.T09.sprouts ? '未実施' : 'ブロック', '成長の芽・実績・追憶・装備枠の実装なし');
add('T10', '2026年以降へ生存', r.T10.livesPast2026 > 0 ? '一部合格' : '不合格', `40人中${r.T10.livesPast2026}人が2026年以降まで生存(最大${r.T10.maxYear}年)。ゲーム内推定の区別・世界データは未実装`);
add('T11', '内部月次の欠落なし', r.T11.monthMismatch === 0 ? '合格' : '不合格', `${r.T11.stepsChecked}ステップで送り幅と月数の不一致=${r.T11.monthMismatch}（季節演出の省略は別途）`);
add('T12', '高齢・早世の終了', !r.T12.zeroHazardDeath.dead && r.T12.zeroHazardDeath.ageNow >= 130 ? '一部合格' : '不合格', `死亡確率ゼロなら130歳でも生存(強制上限なし。現在${r.T12.zeroHazardDeath.ageNow}歳) / 早世${r.T12.earlyDeathAge}歳 ／新しい死亡率の数値は単位4で確定（現在は【仮】）`);

console.log('v1.7 §10A 現行コード検査（京都版）');
for (const x of rows) console.log(`${x.id} [${x.status}] ${x.name} — ${x.ev}`);
if (errs.length) console.log('PAGEERRORS', errs);
await browser.close();
if (process.env.STRICT && rows.some((x) => x.status === '不合格' || x.status === 'ブロック')) process.exit(1);
