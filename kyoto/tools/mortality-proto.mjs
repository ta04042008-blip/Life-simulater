// 単位4の設計用プロトタイプ（ゲーム本体には組み込まない・数値の確定ではない）。
// 年間死亡確率 q の表から、3か月ごとの判定確率を作り、4回分の合計が年間 q に一致することなどを確かめる関数群。
// 区分：ここにある定数はすべて「計算方法の検証用」。時代ごとの死亡確率の数値は、利用者の承認前にゲームへ入れない。

/** 期間内一定ハザード仮定：年間確率 q を4等分した3か月の条件付き確率 */
export const quarterlyUniform = (q) => 1 - Math.pow(1 - q, 1 / 4);

/** 年内の死亡の配分 shares（合計1）に従う3か月ごとの条件付き確率。4回を通した生存は必ず 1−q になる */
export function quarterlyFromShares(q, shares) {
  const sum = shares.reduce((a, b) => a + b, 0);
  if (Math.abs(sum - 1) > 1e-9) throw new Error('shares must sum to 1');
  let used = 0; const out = [];
  for (const s of shares) { const d = q * s; out.push(d / (1 - used)); used += d; }
  return out;
}

/**
 * 乳児期の年内配分（4つの3か月）。資料から作れる2つの手がかりを使う：
 *  neonatal … 乳児死亡のうち生後1か月未満の割合（人口動態統計：新生児死亡÷乳児死亡）
 *  ax0 … 生命表の0歳の ax（0歳で死亡する人の平均死亡時点、年）
 * 仮定（ゲーム仮定・要承認）：生後1か月未満の平均死亡時点 t1（既定0.01年）、生後1か月以降は時間とともに直線的に減る密度。
 */
export function infantQuarterShares({ neonatal, ax0, t1 = 0.01 }) {
  const a = 1 / 12, b = 1, L = b - a, mid = (a + b) / 2;
  const m2 = (ax0 - neonatal * t1) / (1 - neonatal);        // 生後1か月以降の死亡の平均時点
  const gamma = (mid - m2) / L;                              // 直線密度の傾き。0〜1/6 の範囲でのみ有効
  if (!(gamma >= 0 && gamma <= 1 / 6)) throw new Error('ax0 と neonatal が直線密度の範囲に合いません: gamma=' + gamma);
  const F = (t) => { const x = t - a; return x / L - (12 * gamma / (L * L)) * (((t - mid) ** 2 - (a - mid) ** 2) / 2); };
  const cut = [0.25, 0.5, 0.75, 1];
  let prev = a, out = [], first = true;
  for (const c of cut) {
    const m = (first ? neonatal : 0) + (1 - neonatal) * (F(c) - F(first ? a : prev));
    out.push(m); prev = c; first = false;
  }
  return { shares: out, m2, gamma };
}

/** 110歳以上（開放年齢区間）の延長：区間全体の死亡率 mx を一定のハザードとみなし、1歳ごとの qx を作る（推定値・強制死亡ではない） */
export const extendOpenInterval = (mx, fromAge = 110, toAge = 130) =>
  Array.from({ length: toAge - fromAge + 1 }, (_, i) => ({ age: fromAge + i, q: 1 - Math.exp(-mx), estimated: true }));

/** q の配列（0歳から）を3か月ずつ回した、各歳の初めの生存割合。infantShares を与えると0歳だけ配分を使う */
export function survivalByQuarters(qs, infantShares) {
  const l = [1]; let alive = 1;
  qs.forEach((q, age) => {
    const ps = age === 0 && infantShares ? quarterlyFromShares(q, infantShares) : Array(4).fill(quarterlyUniform(q));
    for (const p of ps) alive *= 1 - p;
    l.push(alive);
  });
  return l;
}
