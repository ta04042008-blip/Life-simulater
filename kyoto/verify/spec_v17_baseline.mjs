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
  // T03 年齢境界の送り幅
  { const steps = play('m90c', 1990); const at = {};
    for (const [a, d] of steps) (at[a] ??= new Set()).add(d);
    out.T03 = Object.fromEntries([0, 5, 6, 24, 25, 59, 60].map((a) => [a, at[a] ? [...at[a]] : null])); }
  // T04 0〜5歳の送り幅1年・途中の出来事
  { const steps = play('m90c', 1990, 6); out.T04 = { infantStep: [...new Set(steps.filter(([a]) => a < 6).map((s) => s[1]))], firstChoiceAge: null };
    newGame('m90c', 1990); let g = 0; while (!S.dead && !S.decision && g++ < 400) tick(); out.T04.firstChoiceAge = S.decision ? S.age : null; }
  // T05 選択中の保存・復元・二重回答
  { newGame('m90c', 1990); let g = 0; while (!S.dead && !S.decision && g++ < 800) tick();
    const before = JSON.stringify(S.decision);
    const copy = JSON.parse(JSON.stringify(S)); const after = JSON.stringify(copy.decision);
    const snap1 = JSON.stringify(S); choose(0); const snap2 = JSON.stringify(S); choose(0); const snap3 = JSON.stringify(S);
    out.T05 = { hasDecision: !!before && before !== 'null', sameAfterReload: before === after, answeredOnce: snap2 !== snap1 && snap2 === snap3 }; }
  // T06 死亡の確定が一度きり
  { newGame('m90c', 1990); HZ.child = 5; let g = 0; while (!S.dead && g++ < 50) { if (S.decision) { choose(0); continue } tick(); }
    const age = S.deathAge, logs = S.log.length; const again = tick(); const logs2 = S.log.length;
    out.T06 = { dead: S.dead, tickAfterDeath: again, deathAgeKept: age === S.deathAge, logUnchanged: logs === logs2, deathLogCount: S.log.filter((l) => /亡くなった/.test(JSON.stringify(l))).length };
    HZ.child = 0.03; }
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
  { const sv = { ...HZ }; HZ.B = 0; HZ.child = 0; HZ.acc = 0; play('common', 1000); const old = { deathAge: S.deathAge, cause: S.cause }; Object.assign(HZ, sv);
    HZ.child = 5; newGame('common', 1000); let g = 0; while (!S.dead && g++ < 50) { if (S.decision) { choose(0); continue } tick(); }
    out.T12 = { zeroHazardDeath: old, earlyDeathAge: S.deathAge, chron: Array.isArray(S.chron) }; HZ.child = 0.03; }
  return out;
});

const rows = [];
const add = (id, name, status, ev) => rows.push({ id, name, status, ev });
const r = R;
add('T01', '日本版で1年・2025年を出生', r.T01.y2025.length && r.T01.y1.length ? '合格' : '不合格', `1年→${r.T01.y1.join(',') || 'なし'} / 2025年→${r.T01.y2025.join(',') || '境遇なし'}`);
add('T02', '20か国版の出生抽選', r.T02.countries ? '未実施' : 'ブロック', '国別データと抽選が未実装（v1.7どおり日本版合格後）');
{ const t = r.T03, ok = t[0]?.[0] === 1 && t[5]?.[0] === 1 && t[6]?.[0] === 0.25 && t[24]?.[0] === 0.25 && t[25]?.[0] === 0.5 && t[59]?.[0] === 0.5 && t[60]?.[0] === 1;
  add('T03', '年齢境界の送り幅', ok ? '合格' : '不合格', '年齢→送り幅(年): ' + JSON.stringify(t)); }
add('T04', '0〜5歳の途中の出来事', r.T04.infantStep.length === 1 && r.T04.infantStep[0] === 1 ? '未実施' : 'ブロック', `0〜5歳の送り幅=${r.T04.infantStep} / 最初の選択は${r.T04.firstChoiceAge}歳（単位1で1年送りに変更後に検査）`);
add('T05', '選択中の再読込・二重回答', r.T05.hasDecision && r.T05.sameAfterReload && r.T05.answeredOnce ? '一部合格' : '不合格', JSON.stringify(r.T05) + ' ／乱数状態は保存されず、再開後の未来の再現性は未検証');
add('T06', '死亡の二重確定', r.T06.dead && !r.T06.tickAfterDeath && r.T06.deathLogCount === 1 ? '一部合格' : '不合格', JSON.stringify(r.T06) + ' ／病気・事故との二重計上は死亡率の再設計後に検査');
add('T07', '好感度9↔10の相関図', '未実施', r.T07.note);
add('T08', '能力・★・気質の生成と保存', r.T08.ok ? '合格' : '不合格', JSON.stringify(r.T08) + ' (300人)');
add('T09', '成長の芽と追憶', r.T09.sprouts ? '未実施' : 'ブロック', '成長の芽・実績・追憶・装備枠の実装なし');
add('T10', '2026年以降へ生存', r.T10.livesPast2026 > 0 ? '一部合格' : '不合格', `40人中${r.T10.livesPast2026}人が2026年以降まで生存(最大${r.T10.maxYear}年)。ゲーム内推定の区別・世界データは未実装`);
add('T11', '内部月次の欠落なし', r.T11.monthMismatch === 0 ? '合格' : '不合格', `${r.T11.stepsChecked}ステップで送り幅と月数の不一致=${r.T11.monthMismatch}（季節演出の省略は別途）`);
add('T12', '高齢・早世の終了', r.T12.zeroHazardDeath.deathAge === null || r.T12.zeroHazardDeath.deathAge < 110 ? '合格' : '不合格', `確率ゼロでも${r.T12.zeroHazardDeath.deathAge}歳で「${r.T12.zeroHazardDeath.cause}」(強制上限) / 早世${r.T12.earlyDeathAge}歳`);

console.log('v1.7 §10A 現行コード検査（京都版）');
for (const x of rows) console.log(`${x.id} [${x.status}] ${x.name} — ${x.ev}`);
if (errs.length) console.log('PAGEERRORS', errs);
await browser.close();
if (process.env.STRICT && rows.some((x) => x.status === '不合格' || x.status === 'ブロック')) process.exit(1);
