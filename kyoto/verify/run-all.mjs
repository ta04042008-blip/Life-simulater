// verify/t_*.mjs をすべて実行し、合否を一覧する。使い方: node kyoto/verify/run-all.mjs [並列数=3]
// 判定: 終了コードが0以外、または出力に失敗の目印（FAIL / PAGEERROR / NG n(n>0) / "fail": [要素あり] / checked N fail n(n>0) / bad n(n>0)）がある場合は失敗。
// ※ 目印による判定はスクリプトごとの出力形式に頼った簡易判定。迷ったら verify/*.out 相当の出力を直接読むこと。
// ※ 外部フォント(Google Fonts)を取りに行けない環境で出る ERR_TUNNEL_CONNECTION_FAILED は無視する。
import { readdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const files = readdirSync(here).filter((f) => /^t_.*\.mjs$/.test(f)).sort();
const par = Number(process.argv[2] ?? 3);
const BAD = [/^FAIL/m, /PAGEERROR/, /\bNG [1-9]/, /"fail":\s*\[\s*[^\s\]]/, /\bfail [1-9]/, /\bbad [1-9]/, /"bad":\s*[1-9]/];
const run = (f) => new Promise((res) => {
  let out = '';
  const p = spawn('node', [resolve(here, f)], { cwd: here });
  p.stdout.on('data', (d) => (out += d)); p.stderr.on('data', (d) => (out += d));
  const to = setTimeout(() => p.kill(), 900000);
  p.on('close', (code) => {
    clearTimeout(to);
    const text = out.replace(/.*ERR_TUNNEL_CONNECTION_FAILED.*\n?/g, '');
    const hit = BAD.find((re) => re.test(text));
    res({ f, code, bad: code !== 0 || !!hit, why: code !== 0 ? `exit ${code}` : hit ? String(hit) : '' });
  });
});
const queue = [...files]; const results = [];
await Promise.all(Array.from({ length: par }, async () => { while (queue.length) { const r = await run(queue.shift()); results.push(r); console.log((r.bad ? 'FAIL ' : 'ok   ') + r.f + (r.why ? '  ← ' + r.why : '')); } }));
const nBad = results.filter((r) => r.bad).length;
console.log(`\n${results.length - nBad}/${results.length} ok`);
process.exit(nBad ? 1 : 0);
