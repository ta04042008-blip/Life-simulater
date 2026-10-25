// 設計室（kyoto/designer/index.html）の動作確認。公開時と同じ外枠を付け、dist/kyoto.html を game.html として配る小さなサーバーで開く
//  編集 → 変更件数・誤りの表示 → 境遇・名前の編集 → 変更一覧 → 試遊に反映 → まとめて試す（既定との比較）
import { chromium, BUILD } from './lib.mjs';
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const page = '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>' + readFileSync(resolve(here, '../designer/index.html'), 'utf8') + '</body></html>';
const game = readFileSync(BUILD);
const srv = createServer((q, r) => { if (q.url.startsWith('/game.html')) { r.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); r.end(game) } else { r.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); r.end(page) } }).listen(0);
const port = srv.address().port;
const T = []; const ok = (n, c, d = '') => { T.push(c); console.log((c ? 'PASS ' : 'FAIL ') + n + (d ? '  — ' + d : '')) };
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
try {
  await p.goto(`http://localhost:${port}/`); await p.waitForSelector('#g-life', { timeout: 30000 });
  ok('起動：変更0件', (await p.textContent('#st-chg')) === '変更 0件');
  await p.fill('#f-life-0-0', '70');
  ok('数値を変えると変更1件・朱線', (await p.textContent('#st-chg')) === '変更 1件' && (await p.getAttribute('#f-life-0', 'class')).includes('changed'));
  await p.fill('#f-fam-1-0', '50');
  ok('合計100でないと誤り', (await p.textContent('#f-fam-1 .msg')).includes('合計を100') && (await p.textContent('#st-save')).startsWith('誤り'));
  await p.fill('#f-fam-1-0', '35');
  ok('直すと誤りが消える', (await p.textContent('#f-fam-1 .msg')) === '');
  await p.click('[data-tab=per]');
  ok('境遇25・確率の表示', (await p.$$eval('.prow', (e) => e.length)) === 25);
  await p.click('[data-per=farm]'); await p.fill('#p-farm-label', 'テスト農家'); await p.fill('#p-farm-yr-0', '2000');
  ok('生まれ年の逆転は誤り', (await p.textContent('#pf-yr .msg')).includes('小さく'));
  await p.fill('#p-farm-yr-0', '1');
  await p.click('#per-back');
  ok('一覧に新しい名前', (await p.textContent('[data-per=farm] b')) === 'テスト農家');
  await p.click('[data-tab=name]'); await p.fill('#nm-edo-m', 'たろう じろう');
  await p.click('[data-tab=diff]');
  ok('変更一覧に3件', (await p.$$eval('.diff', (e) => e.length)) === 3);
  await p.click('[data-tab=play]'); await p.click('#play-start'); await p.waitForTimeout(2500);
  ok('試遊に設計が入る', (await p.textContent('#play-note')).includes('3件') && (await p.frameLocator('#playframe').locator('#personas .chip[data-p=farm]').textContent()) === 'テスト農家');
  await p.selectOption('#sim-n', '100'); await p.click('#sim-start');
  await p.waitForFunction(() => /計算しました|失敗/.test(document.querySelector('#sim-note').textContent), null, { timeout: 180000 });
  const m = (await p.$$eval('.kv', (e) => e[0].textContent.match(/いちばん長生き(\d+)歳(\d+)歳/)))?.slice(1).map(Number);
  ok('まとめて試す：寿命の上限70が効き、既定と比べられる', m && m[0] <= 70 && m[1] > 70, String(m));
  ok('横にはみ出さない', await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
} finally { await b.close(); srv.close(); }
ok('エラーなし', errs.length === 0, errs.join(' / '));
const all = T.every(Boolean); console.log(all ? `${T.length}/${T.length} PASS` : 'FAIL'); process.exit(all ? 0 : 1);
