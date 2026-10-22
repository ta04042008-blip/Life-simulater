// 設計室の検索・絞り込み（数値タブ・変更一覧タブ）の動作確認。公開時と同じ外枠を付け、dist/kyoto.html を game.html として配る小さなサーバーで開く
//  検索（語のAND・全角半角・カナ/かな）→ グループ絞り込み → 変えた項目だけ・誤りだけ → クリア → 変更一覧 → 画面切替後も条件を保つ
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
  const vis = () => p.$$eval('#main .fld:not([hidden])', (e) => e.length);
  const total = await p.$$eval('#main section.grp[data-g] .fld', (e) => e.length);
  ok('検索欄がある・全件表示', (await p.$('#fq')) && (await vis()) === total && (await p.textContent('#fcnt')) === `全${total}件`, String(total));
  await p.fill('#fq', '家計');
  const n1 = await vis();
  ok('語で絞れる', n1 > 0 && n1 < total && (await p.textContent('#fcnt')) === `${n1}件 / 全${total}件`, String(n1));
  await p.fill('#fq', '家計 乳幼児');
  ok('複数語はAND（0件で案内）', (await vis()) === 0 && !(await p.$eval('#fempty', (e) => e.hidden)));
  await p.fill('#fq', '');
  ok('空に戻すと全件', (await vis()) === total && (await p.$eval('#fempty', (e) => e.hidden)));
  await p.fill('#fq', '０歳'); const nz = await vis();
  await p.fill('#fq', '0歳'); const nh = await vis();
  ok('全角・半角・大小を区別しない', nz === nh && nz > 0, `${nz}/${nh}`);
  await p.fill('#fq', '');
  await p.selectOption('#fsel', 'life');
  const nl = await vis();
  ok('グループで絞れる・他グループの見出しも隠れる', nl > 0 && nl < total && (await p.$$eval('#main section.grp[data-g]:not([hidden])', (e) => e.length)) === 1);
  await p.selectOption('#fsel', '');
  ok('変えた項目だけ：最初は0件', (await p.check('#fchg'), (await vis()) === 0));
  await p.uncheck('#fchg');
  await p.fill('#f-life-0-0', '70');
  await p.check('#fchg');
  ok('変えた項目だけ：変えた1件', (await vis()) === 1);
  await p.uncheck('#fchg'); await p.fill('#f-fam-1-0', '50'); await p.check('#fbad');
  ok('誤りだけ：合計が合わない項目', (await vis()) === 1 && (await p.$eval('#main .fld:not([hidden])', (e) => e.id)) === 'f-fam-1');
  await p.uncheck('#fbad'); await p.fill('#f-fam-1-0', '35');
  await p.fill('#fq', '寿命'); await p.check('#fchg');
  
  ok('検索と絞り込みを重ねられる', (await vis()) === 1);
  await p.click('#fclr');
  ok('条件をクリア：全件・入力も空', (await vis()) === total && (await p.inputValue('#fq')) === '' && !(await p.isChecked('#fchg')));
  
  await p.fill('#fq', '寿命');
  await p.click('[data-tab=name]'); await p.fill('#nm-edo-m', 'たろう じろう');
  await p.click('[data-tab=diff]');
  const rows = await p.$$eval('.diff', (e) => e.length);
  ok('変更一覧：検索欄と件数', rows === 2 && (await p.$('#fq')) && (await p.textContent('#fcnt')) === `全${rows}件`, String(rows));
  await p.fill('#fq', '江戸');
  ok('変更一覧：項目名の語で探せる', (await p.$$eval('.diff:not([hidden])', (e) => e.length)) === 1);
  await p.fill('#fq', '');
  await p.selectOption('#fsel', 'name');
  ok('変更一覧：種類で絞れる（名前）', (await p.$$eval('.diff:not([hidden])', (e) => e.length)) === 1 && !(await p.$eval('#undo-note', (e) => e.hidden)));
  await p.selectOption('#fsel', 'num');
  ok('変更一覧：数値は他を除く', (await p.$$eval('.diff:not([hidden])', (e) => e.length)) === rows - 1);
  await p.click('.diff:not([hidden]) [data-undo]');
  ok('絞り込み中の「戻す」が正しい行に効く・条件は保たれる', (await p.$$eval('.diff', (e) => e.length)) === rows - 1 && (await p.inputValue('#fsel')) === 'num');
  await p.click('[data-tab=num]');
  ok('タブを往復しても数値の条件を保つ', (await p.inputValue('#fq')) === '寿命');
  ok('横にはみ出さない', await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
} finally { await b.close(); srv.close(); }
ok('エラーなし', errs.length === 0, errs.join(' / '));
const all = T.every(Boolean); console.log(all ? `${T.length}/${T.length} PASS` : 'FAIL'); process.exit(all ? 0 : 1);
