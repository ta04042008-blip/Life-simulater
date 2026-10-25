// JMD（日本版死亡データベース）の期間生命表1x1（総数）から、ゲームに入れる年齢別の年間死亡確率 q(x) の表を作る。
// 使い方: node kyoto/tools/gen-mortality-data.mjs <bltper_1x1.txt>   → kyoto/src/js/01a-mortality-data.js を書き出す
// 出典：国立社会保障・人口問題研究所「日本版死亡データベース」(JMD) 期間生命表 1x1 総数 1947–2024（ver.005_002, 2026-02-20更新）
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const file = process.argv[2]; if (!file) { console.error('usage'); process.exit(2); }
const buf = readFileSync(file), by = new Map();
for (const line of buf.toString('utf8').split(/\r?\n/)) {
  const p = line.trim().split(/\s+/);
  if (p.length === 10 && /^\d{4}$/.test(p[0])) { const y = +p[0]; if (!by.has(y)) by.set(y, []); by.get(y).push(p); }
}
const years = [...by.keys()].sort((a, b) => a - b);
const f = (x) => +(+x).toPrecision(5);
const Q = [], AX0 = [], MX = [], E0 = [];
for (const y of years) { const r = by.get(y); Q.push(r.slice(0, 110).map((p) => f(p[3]))); AX0.push(+r[0][4]); MX.push(+r[110][2]); E0.push(+r[0][9]); }
const out = `// 01a-mortality-data.js — 自動生成（kyoto/tools/gen-mortality-data.mjs）。手で編集しない。
// 【史実統計】国立社会保障・人口問題研究所「日本版死亡データベース」期間生命表(1x1・総数) ${years[0]}–${years[years.length - 1]}年（ver.005_002）。
// 原本 SHA-256: ${createHash('sha256').update(buf).digest('hex')}
// JMD_Q[年−JMD_Y0][年齢0..109]＝年間死亡確率 qx。JMD_AX0＝0歳の ax。JMD_MX110＝110歳以上の死亡率 mx（qx=1.0 は区間の終わりの記号であり、110歳での強制死亡ではない）。JMD_E0＝その年の平均寿命（検算用）。
const JMD_Y0=${years[0]},JMD_Y1=${years[years.length - 1]};
const JMD_Q=${JSON.stringify(Q)};
const JMD_AX0=${JSON.stringify(AX0)};
const JMD_MX110=${JSON.stringify(MX)};
const JMD_E0=${JSON.stringify(E0)};
`;
writeFileSync(new URL('../src/js/01a-mortality-data.js', import.meta.url), out); console.log('wrote', out.length, 'bytes');
