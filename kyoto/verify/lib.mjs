// ブラウザ検証用の共通部品（Playwright が必要。リポジトリ本体は依存パッケージなし）
//   環境変数 KYOTO_HTML … 検証するHTML（既定: kyoto/dist/kyoto.html。先に node kyoto/tools/build.mjs）
//   環境変数 PLAYWRIGHT_DIR … playwright が入った node_modules の親（既定: /opt/npm-tools/node_modules/）
import { createRequire } from 'module';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const here = dirname(fileURLToPath(import.meta.url));
export const BUILD = process.env.KYOTO_HTML ?? resolve(here, '../dist/kyoto.html');
export const FIXDIR = resolve(here, 'fixtures');
const require = createRequire(process.env.PLAYWRIGHT_DIR ?? '/opt/npm-tools/node_modules/');
export const { chromium } = require('playwright');
export async function open(file = BUILD) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errs = [];
  page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
  await page.goto('file://' + file);
  await page.waitForTimeout(300);
  return { browser, page, errs };
}
