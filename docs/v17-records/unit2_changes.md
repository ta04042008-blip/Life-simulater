# 単位2 変更記録（乱数状態の保存と旧セーブの安全な移行）

## 方式
- ゲーム結果に影響する乱数はすべて `rand()`（`01-core-personas.js`）を通す。状態は32bit整数1つで、毎回 `S.rs` に書き戻すので、保存・復元で続きが一致する（`S.rv=1` は乱数方式の版）。
- 新しい人生は人生ごとに別の種（`crypto.getRandomValues`）を持つ。作り終えるまで前の人生の乱数に触れない。
- 画面の演出（歩き回り・紙吹雪）は `Math.random()` のまま。ゲームの乱数に触れない。守るため `verify/rng-source.test.mjs` が、許可した場所以外での `Math.random()` を失敗にする。
- ゲージの途中イベントの予定は `S.slots` に保存（再生・停止・再読み込みで引き直さない）。`tick()` が使い切る。
- 読み込み・移行（`migrate`）は人生の乱数から切り離し、保存の中身から決まる固定の列で補完する（読み込みで今の人生の未来が変わらない）。

## 旧セーブ（乱数状態なし）
- 乱数の種は旧セーブの全内容の指紋から決める。同じ旧セーブは何度開いても同じ種になる（毎回引き直さない）。移行後は自動保存に `rs` が入り、以後はそれを使う。手動セーブの原本は書き換えない。
- 原本は読み込みの前に、内容の指紋つきのキー（`kyoto-kurashi-mihon-v4-premigrate-<指紋>`）へ一度だけ退避。同じ内容は上書きしない。別の内容は別キー。索引は `...-premigrate-index`。退避できない（容量不足）ときは読み込みを中止する。
- 移行に失敗しても、現在の人生は変わらず原本は残る。`saveRestoreOriginal(key)` で原本を手動セーブの枠へ戻せる（元の手動セーブは `...-replaced-by-restore` に退避）。画面のボタンは未追加（関数のみ）。
- 旧版の固定キー `-premigrate`（初回のみ保存）は新規には作らない。既にあるものは触らない。

## 変更したファイル
01-core-personas.js（RNG）／02-abilities-temperament.js（seeded・migrate）／05-birth-era-personas.js（newGame）／13-ui-decisions.js（slots・rand）／17-control.js／18-birth-ceremony.js／18a-save-system.js（検証・原本退避）／07-state-core.js（lid）／06,09,12（rand）／dist／verify: t_rng.mjs・rng-source.test.mjs（新規）、save-compat.test.mjs（原本退避の期待を内容別キーに更新）、spec_v17_baseline.mjs。

## 既知の限界
- 実機スマホでの確認は未実施。原本の復元ボタンは画面に未追加。
- 旧セーブの種を内容から決めるため、同じ旧セーブから始めると同じ未来になる（仕様どおり）。
- 110歳の強制上限・死亡率は未変更（単位4）。
