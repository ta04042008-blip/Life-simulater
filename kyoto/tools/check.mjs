// 構文・組み立ての検査（依存なし）。使い方: node kyoto/tools/check.mjs
//  1) src/js の各ファイルと、結合したJS全体が文法的に正しいこと
//  2) order.json に載っていないJSファイルや、無いファイルがないこと
//  3) 素材と dist があるときは、組み立てた結果が dist/kyoto.html と一致すること（更新忘れ防止）
import { readFileSync, readdirSync, mkdtempSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import vm from 'node:vm';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const order = JSON.parse(readFileSync(resolve(root, 'src/js/order.json'), 'utf8'));
const onDisk = readdirSync(resolve(root, 'src/js')).filter((f) => f.endsWith('.js')).sort();
let bad = 0; const fail = (m) => { console.error('NG ' + m); bad++; };
if (JSON.stringify([...order].sort()) !== JSON.stringify(onDisk)) fail('order.json と src/js のファイルが一致しません');
let all = '';
for (const f of order) {
  const body = readFileSync(resolve(root, 'src/js', f), 'utf8').split('\n').slice(1).join('\n');
  all += body.replace(/@@ASSET:[^@]+@@/g, 'x');
  try { new vm.Script(body.replace(/@@ASSET:[^@]+@@/g, 'x'), { filename: f }); } catch (e) { fail(`${f}: ${e.message}`); }
}
try { new vm.Script(all, { filename: 'all.js' }); } catch (e) { fail('結合したJS: ' + e.message); }
let distNote = 'dist 比較は省略（素材または dist が無い）';
const hasDist = existsSync(resolve(root, 'dist/kyoto.html'));
const nBg = existsSync(resolve(root, 'assets/backgrounds')) ? readdirSync(resolve(root, 'assets/backgrounds')).filter((f) => f.endsWith('.png')).length : 0;
if (hasDist && nBg >= 68) {
  const tmp = join(mkdtempSync(join(tmpdir(), 'kyoto-')), 'out.html');
  execFileSync('node', [resolve(root, 'tools/build.mjs'), tmp], { stdio: 'pipe' });
  if (!readFileSync(tmp).equals(readFileSync(resolve(root, 'dist/kyoto.html')))) fail('dist/kyoto.html が最新のソースと一致しません（node kyoto/tools/build.mjs で作り直してください）');
  distNote = 'dist 一致';
}
console.log(bad ? `${bad} 件の問題` : `OK（JS ${order.length} ファイル、${distNote}）`);
process.exit(bad ? 1 : 0);
