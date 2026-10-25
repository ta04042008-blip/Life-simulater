// 単位4の設計用プロトタイプの検査。資料の抜粋（日本版死亡データベース 005_002版 男女計・期間1x1/1x10）は、
// 取得時の表示を逐語で書き写したもの。写し間違いは lx・dx・qx の関係で自己検査する。
import test from 'node:test';
import assert from 'node:assert/strict';
import { quarterlyUniform, quarterlyFromShares, infantQuarterShares, extendOpenInterval, survivalByQuarters } from '../tools/mortality-proto.mjs';

// [age, mx, qx, ax, lx, dx]  1947年・男女計（JMD。https://www.ipss.go.jp/p-toukei/JMD/00/STATS/bltper_1x1.txt）
const Y1947 = [[0,.08879,.08354,.29,100000,8354],[1,.03691,.03624,.50,91646,3321],[2,.01739,.01724,.50,88324,1522],[3,.01108,.01102,.50,86802,957],[4,.00726,.00723,.50,85845,621],[5,.00499,.00498,.50,85224,424],[6,.00376,.00376,.50,84800,319],[7,.00310,.00310,.50,84481,262],[8,.00240,.00240,.50,84219,202],[9,.00210,.00210,.50,84018,177],[10,.00190,.00189,.50,83841,159],[11,.00172,.00172,.50,83682,144],[12,.00177,.00177,.50,83539,148],[13,.00187,.00187,.50,83391,156],[14,.00219,.00219,.50,83235,182],[15,.00296,.00296,.50,83053,246],[16,.00343,.00343,.50,82807,284],[17,.00442,.00441,.50,82523,364],[18,.00535,.00533,.50,82159,438],[19,.00661,.00659,.50,81721,539],[20,.00733,.00731,.50,81183,593]];
// 期間平均の抜粋（0歳 ax と 100〜110+）：[期間, mx110+, q109, ax0, q0]
const OPEN = [['1947-1949', .78981, .54558, .25, .06832], ['1950-1959', .80509, .55330, .20, .04458], ['1960-1969', .80133, .55642, .17, .02104]];

test('transcription self-check: lx, dx and qx agree (1947, ages 0-20)', () => {
  for (let i = 0; i < Y1947.length; i++) {
    const [age, , qx, , lx, dx] = Y1947[i];
    assert.ok(Math.abs(lx * qx - dx) <= 1.0, `dx != lx*qx at age ${age}`);
    if (i + 1 < Y1947.length) assert.ok(Math.abs(lx - dx - Y1947[i + 1][4]) <= 1, `lx chain at age ${age}`);   // 表の丸め（各列を別々に四捨五入）で±1ずれる
  }
});

test('four quarterly probabilities multiply back to the annual qx (uniform hazard)', () => {
  for (const [age, , q] of Y1947) {
    const p = quarterlyUniform(q);
    assert.ok(Math.abs((1 - Math.pow(1 - p, 4)) - q) < 1e-12, `age ${age}`);
  }
});

test('infant allocation: shares sum to 1, product equals the annual q0, front-loaded', () => {
  // 1947年：新生児死亡 31.4 ÷ 乳児死亡 76.7（人口動態統計）、JMD 0歳の ax=0.29
  const { shares } = infantQuarterShares({ neonatal: 31.4 / 76.7, ax0: 0.29 });
  assert.ok(Math.abs(shares.reduce((a, b) => a + b, 0) - 1) < 1e-9);
  assert.ok(shares.every((s) => s > 0));
  assert.ok(shares[0] > shares[1] && shares[1] > shares[2] && shares[2] > shares[3], 'monotone decreasing');
  const q0 = 0.08354, ps = quarterlyFromShares(q0, shares);
  const surv = ps.reduce((a, p) => a * (1 - p), 1);
  assert.ok(Math.abs((1 - surv) - q0) < 1e-12, 'quarterly probabilities must reproduce q0');
  // 平均死亡時点が JMD の ax と一致する（配分が資料に合う）
  const mids = [0.125, 0.375, 0.625, 0.875];
  const meanFromQuarters = shares.reduce((a, s, i) => a + s * mids[i], 0);
  assert.ok(Math.abs(meanFromQuarters - 0.29) < 0.05, 'mean time of death ~ ax0 (quarter midpoints, coarse)');
});

test('uniform-in-year allocation would contradict the data (ax0 < 0.5)', () => {
  for (const [, , , ax0] of OPEN) assert.ok(ax0 < 0.5);
});

test('open interval 110+: qx=1.0 is the interval total, not a forced death; the extension is an estimate', () => {
  for (const [name, mx, q109] of OPEN) {
    const ext = extendOpenInterval(mx, 110, 130);
    assert.ok(ext.every((e) => e.estimated === true && e.q < 1), name + ': no age reaches q=1');
    // JMD自身の109歳の値が「mx(110+) を一定のハザードとした場合」とほぼ一致する（延長の根拠）
    assert.ok(Math.abs(ext[0].q - q109) < 0.01, `${name}: plateau q ${ext[0].q.toFixed(4)} vs q109 ${q109}`);
  }
  const s = survivalByQuarters([...Array(110).fill(0), ...extendOpenInterval(0.79, 110, 125).map((e) => e.q)].map((q, i) => (i < 110 ? 0 : q)));
  assert.ok(s[111] > 0 && s[115] > 0 && s[115] < s[111], 'survival continues past 110 and keeps falling');
});

test('survival chain: yearly lx from quarterly steps matches the table (1947, ages 0-20)', () => {
  const qs = Y1947.map((r) => r[2]);
  const s = survivalByQuarters(qs);                       // 一様配分
  const sInfant = survivalByQuarters(qs, infantQuarterShares({ neonatal: 31.4 / 76.7, ax0: 0.29 }).shares);   // 乳児期の配分
  for (let a = 0; a <= 20; a++) {
    const tab = Y1947[a][4] / 100000 * (1 - Y1947[a][2]);   // 年末の生存割合（表）
    assert.ok(Math.abs(s[a + 1] - tab) < 2e-5, `uniform age ${a}`);
    assert.ok(Math.abs(sInfant[a + 1] - tab) < 2e-5, `infant-weighted age ${a}`);
  }
});
