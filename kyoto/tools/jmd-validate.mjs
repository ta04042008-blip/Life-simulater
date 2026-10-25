// 日本版死亡データベース（JMD, IPSS）の期間生命表テキスト（1x1）の取り込み検査。ゲーム本体には組み込まない。
// 使い方: node kyoto/tools/jmd-validate.mjs <bltper_1x1.txt> [--csv 出力.csv]
// 検査：年・年齢の並び、l0=100000、dx≈lx×qx、lx−dx≈次のlx（丸め±1）、110+の qx=1.0（区間の終わりの記号）、
//       3か月に分けて4回掛けた生存が表の次の lx に一致、平均寿命（0歳のex）。結果とSHA-256を表示する。
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const [, , file, flag, out] = process.argv;
if (!file) { console.error('usage: node jmd-validate.mjs <file> [--csv out.csv]'); process.exit(2); }
const buf = readFileSync(file), text = buf.toString('utf8');
const sha = createHash('sha256').update(buf).digest('hex');
const header = text.split(/\r?\n/)[0];
const by = new Map();
for (const line of text.split(/\r?\n/)) {
  const p = line.trim().split(/\s+/);
  if (p.length === 10 && /^\d{4}$/.test(p[0])) { const y = +p[0]; if (!by.has(y)) by.set(y, []); by.get(y).push({ age: p[1], mx: +p[2], qx: +p[3], ax: +p[4], lx: +p[5], dx: +p[6], Lx: +p[7], Tx: +p[8], ex: +p[9] }); }
}
const problems = []; const years = [...by.keys()].sort((a, b) => a - b);
let maxChain = 0;
for (const y of years) {
  const rs = by.get(y), ages = rs.map((r) => r.age).join(',');
  if (ages !== [...Array(110).keys(), '110+'].join(',')) problems.push(`${y}: 年齢の並びが 0..109,110+ ではありません`);
  if (rs[0].lx !== 100000) problems.push(`${y}: l0 が 100000 ではありません`);
  let alive = 1;
  rs.forEach((r, i) => {
    if (r.age === '110+') { if (r.qx !== 1) problems.push(`${y}: 110+ の qx が 1.0 ではありません`); return; }
    if (!(r.qx >= 0 && r.qx <= 1)) problems.push(`${y} ${r.age}: qx が範囲外`);
    if (Math.abs(r.lx * r.qx - r.dx) > 1) problems.push(`${y} ${r.age}: dx が lx×qx と合いません`);
    if (Math.abs(r.lx - r.dx - rs[i + 1].lx) > 1) problems.push(`${y} ${r.age}: lx の連鎖が合いません`);
    const p = 1 - Math.pow(1 - r.qx, 0.25); for (let k = 0; k < 4; k++) alive *= 1 - p;
    maxChain = Math.max(maxChain, Math.abs(alive - rs[i + 1].lx / 1e5));
  });
}
console.log(JSON.stringify({ file, sha256: sha, bytes: buf.length, header: header.trim(), years: [years[0], years[years.length - 1], years.length], problems: problems.length, maxQuarterlyChainDiff: +maxChain.toExponential(2) }));
problems.slice(0, 10).forEach((p) => console.log('問題:', p));
if (flag === '--csv' && out) {
  const lines = ['year,e0,q0,ax0,q109,mx110plus,ax110plus,l110'];
  for (const y of years) { const rs = by.get(y), last = rs[110]; lines.push([y, rs[0].ex, rs[0].qx, rs[0].ax, rs[109].qx, last.mx, last.ax, rs[110].lx].join(',')); }
  writeFileSync(out, lines.join('\n') + '\n'); console.log('wrote', out);
}
process.exit(problems.length ? 1 : 0);
