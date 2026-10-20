// 京都の暮らし 見本：分割したソースから、1枚のHTMLを組み立てる（依存パッケージなし）
//   使い方:  node kyoto/tools/build.mjs [出力先]   既定: kyoto/dist/kyoto.html
// 手順: template.html の @@INCLUDE_CSS@@ / @@INCLUDE_JS@@ を差し込み、@@ASSET:パス@@ を assets/ のファイルのデータ(Base64)に置き換える。
// JSファイルの1行目は見出し用の注釈なので、組み立て時に除く。
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(process.argv[2] ?? resolve(root, 'dist/kyoto.html'));
const rd = (p) => readFileSync(resolve(root, p), 'utf8');
const mime = { '.png': 'image/png', '.woff': 'font/woff' };

const trimEnd1 = (s) => (s.endsWith('\n') ? s.slice(0, -1) : s);
const css = trimEnd1(rd('src/css/style.css'));
const order = JSON.parse(rd('src/js/order.json'));
const js = trimEnd1(order.map((f) => rd('src/js/' + f).split('\n').slice(1).join('\n')).join(''));

let html = rd('src/template.html')
  .replace('@@INCLUDE_CSS@@', () => css)
  .replace('@@INCLUDE_JS@@', () => js);

const used = new Set();
const missing = [...new Set([...html.matchAll(/@@ASSET:([^@]+)@@/g)].map((m) => m[1]))].filter((p) => !existsSync(resolve(root, 'assets', p)));
if (missing.length) {
  console.error(`素材ファイルが ${missing.length} 点見つかりません（例: assets/${missing[0]}）。`);
  console.error('背景素材は権利確認までGitHubに置いていません。assets/README.md の「背景素材を戻す」を見てください。');
  process.exit(2);
}
html = html.replace(/@@ASSET:([^@]+)@@/g, (_, p) => {
  used.add(p);
  const m = mime[extname(p)];
  if (!m) throw new Error('未対応の素材形式: ' + p);
  return `data:${m};base64,` + readFileSync(resolve(root, 'assets', p)).toString('base64');
});
if (html.includes('@@')) throw new Error('未解決の @@ マーカーが残っています');

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, html);
console.log(`built ${out} (${html.length} 文字, 素材 ${used.size} 点, JS ${order.length} ファイル)`);
