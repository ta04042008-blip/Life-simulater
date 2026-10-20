// 二重適用の確認：同じ決断への2度目の回答は、能力・ログ・資源・件・回答待ちのどれにも反映されない。
// 保存→再開（migrate）後も、同じ決断が引き直されずに残る。
import { open } from './lib.mjs';
const { browser, page, errs } = await open();
const r = await page.evaluate(() => {
  render = () => {}; openResult = () => {}; showFx = () => {}; evClose = () => {};
  newGame('farm'); S.age = 25; S.t = 25; S.stats = [500, 500, 500, 500]; S.nextDecT = 999; S.nextSmallT = 999;
  const e = EV.find((x) => x.id === 'E05-07'); S.decision = evBuild(e);
  const id1 = JSON.stringify(S.decision);
  S = migrate(JSON.parse(JSON.stringify(S)));
  const resumedSame = JSON.stringify(S.decision) === id1;
  choose(0);
  const snap = () => JSON.stringify([S.stats, S.log.length, S.res, (S.cases || []).length, S.pending.length]);
  const a = snap();
  choose(0);
  return { resumedSame, closedAfterFirst: !S.decision, unchangedBySecond: a === snap() };
});
const ok = r.resumedSame && r.closedAfterFirst && r.unchangedBySecond && errs.length === 0;
console.log(ok ? 'PASS' : 'FAIL', JSON.stringify(r), errs);
await browser.close();
process.exit(ok ? 0 : 1);
