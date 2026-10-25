// verify/t_*.mjs をすべて実行し、合否を一覧する。使い方: node kyoto/verify/run-all.mjs [並列数=3]
// 判定: 終了コードが0以外、または出力に失敗の目印（FAIL / PAGEERROR / NG n(n>0) / "fail": [要素あり] / checked N fail n(n>0) / bad n(n>0)）がある場合は失敗。
// ※ 目印による判定はスクリプトごとの出力形式に頼った簡易判定。迷ったら verify/*.out 相当の出力を直接読むこと。
// ※ 外部フォント(Google Fonts)を取りに行けない環境で出る ERR_TUNNEL_CONNECTION_FAILED は無視する。
import { readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const files = readdirSync(here).filter((f) => /^t_.*\.mjs$/.test(f)).sort();
// 未解決の不安定な失敗（t_rng が並列実行時に1回だけ失敗。原因不明・再現せず）の継続監視：t_rng を追加で繰り返す。回数は環境変数 MONITOR_RNG（既定2）
const monitorN = Number(process.env.MONITOR_RNG ?? 2);
for (let i = 0; i < monitorN; i++) files.push('t_rng.mjs');
const par = Number(process.argv[2] ?? 3);
// 旧イベント140件に頼る検査は、削除前のイベントを差し戻した検証用ビルドで実行する（出来事の処理そのものの退行を見張るため）
const NEEDS_EVENTS = new Set(['t_double', 't_s5', 't_s5ui', 't_s6', 't_s6ui', 't_s7', 't_s7ui', 't_s8', 't_st2'].map((n) => n + '.mjs'));
const legacyHtml = resolve(tmpdir(), 'kyoto-legacy-events.html');
execFileSync('node', [resolve(here, '../tools/build.mjs'), legacyHtml], { env: { ...process.env, KYOTO_LEGACY_EVENTS: '1' }, stdio: 'ignore' });
const BAD = [/^FAIL/m, /PAGEERROR/, /\bNG [1-9]/, /"fail":\s*\[\s*[^\s\]]/, /\bfail [1-9]/, /\bbad [1-9]/, /"bad":\s*[1-9]/];
const run = (f) => new Promise((res) => {
  let out = '';
  const p = spawn('node', [resolve(here, f)], { cwd: here, env: NEEDS_EVENTS.has(f) ? { ...process.env, KYOTO_HTML: legacyHtml } : process.env });
  p.stdout.on('data', (d) => (out += d)); p.stderr.on('data', (d) => (out += d));
  const to = setTimeout(() => p.kill(), 900000);
  p.on('close', (code) => {
    clearTimeout(to);
    const text = out.replace(/.*ERR_TUNNEL_CONNECTION_FAILED.*\n?/g, '');
    const hit = BAD.find((re) => re.test(text));
    res({ f, code, bad: code !== 0 || !!hit, why: code !== 0 ? `exit ${code}` : hit ? String(hit) : '', tail: text.split('\n').filter((l) => /FAIL|PAGEERROR|Error|NG |fail|bad/.test(l)).slice(0, 8).concat(text.trim().split('\n').slice(-4)).map((l) => '      | ' + l.slice(0, 300)).join('\n') });
  });
});
const queue = [...files]; const results = [];
await Promise.all(Array.from({ length: par }, async () => { while (queue.length) { const r = await run(queue.shift()); results.push(r); console.log((r.bad ? 'FAIL ' : 'ok   ') + r.f + (r.why ? '  ← ' + r.why : '')); if (r.bad) console.log(r.tail); } }));
const nBad = results.filter((r) => r.bad).length;
console.log(`\n${results.length - nBad}/${results.length} ok`);
process.exit(nBad ? 1 : 0);
