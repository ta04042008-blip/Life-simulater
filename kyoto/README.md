# kyoto/ — 最新版（Claudeで開発中の「京都の暮らし 見本」）

「2000年の地球上の誰か1人。」日本版プロトタイプの **最新版** です。リポジトリ直下の `index.html`・`src/`・`test/`（旧試作。`main` に保存されたもの）とは別物で、互いに影響しません。旧試作は一切変更していません。

2026-10-20 に、Claude上で開発していた単一HTML（約3.8MB・素材埋め込み）を、**動作を1バイトも変えずに**機能別ファイルへ分けて登録しました。登録時（コミット `24145a0`）の組み立て結果は、分割前の最新版と完全一致しました（SHA-256 `1f1a823d7f48a0c54510750e644582eb65758260c189231e6d5cd49b5087cc95`）。その後の修正（出生年を西暦1〜1900年へ、`0d465d8`）により、現在の `dist` は別の値です。

> **背景素材**：背景PNG 68点（ユーザー作成。AI生成を含む）は 2026-10-20 に正式登録しました。ファイルの一覧と照合は `assets/backgrounds-MANIFEST.txt`、出所は `assets/README.md`。

## 使い方（依存パッケージなし・Node.js 22以降）

```sh
node kyoto/tools/build.mjs        # → kyoto/dist/kyoto.html を作る（素材を埋め込んだ1枚のHTML）
node kyoto/tools/check.mjs        # 構文・組み立て・dist の一致を検査（dist が無い環境では構文検査のみ）
```

`kyoto/dist/kyoto.html` をブラウザで開くとそのまま遊べます（HTTP不要。スマホ縦画面向け、×1〜×30の自動再生）。セーブはメニューの手動操作のみで、`localStorage`（キー `kyoto-kurashi-mihon-v4`）に保存します。

画面確認のテスト（Playwright が必要。本体には含めていません）:

```sh
# playwright の入った node_modules の親フォルダを指定（既定 /opt/npm-tools/node_modules/）
PLAYWRIGHT_DIR=/path/to/dir/ node kyoto/verify/run-all.mjs      # 28本を一括実行
PLAYWRIGHT_DIR=/path/to/dir/ node kyoto/verify/t_double.mjs     # 1本だけ
```

## 構成

```
kyoto/
├─ src/
│  ├─ template.html        画面の骨組み（HTML）。CSS・JS・素材は組み立て時に差し込む
│  ├─ css/style.css        見た目
│  └─ js/                  ゲームのコード（番号順に結合。順序は order.json）
│     ├─ 00-assets.js            素材の対応表
│     ├─ 01-core-personas.js     基本定数・死亡率・元の4境遇
│     ├─ 02-abilities-temperament.js   能力4項目・★・気質（5軸/32タイプ）・小さな選択・人物の毎年の暮らし・旧セーブ移行
│     ├─ 03-family-learning-events.js  家族・学び・仕事の出来事
│     ├─ 04-names-family.js      人物の名前と家族の生成
│     ├─ 05-birth-era-personas.js 生まれ年と時代・新しい13境遇・ランダム出生
│     ├─ 06-event-spec-engine.js イベント140件の処理（自動／小さな選択／大きな選択・後日談）
│     ├─ 07〜11-state-*.js, 11-monthly-progress.js   状態システム（段階1〜8）・月の進行
│     ├─ 12-ui-household.js      家計画面
│     ├─ 13-ui-decisions.js      決断の演出
│     ├─ 14-ui-scene.js          生活画面の描画
│     ├─ 15-ui-faces-relation-map.js 相関図
│     ├─ 16-ui-profile-text.js   人物シート
│     ├─ 17-control.js           再生・画面切替・制御
│     ├─ 18-birth-ceremony.js    誕生の演出
│     └─ 19-title-screen.js      タイトル画面・セーブ／ロード
├─ assets/                 人物の絵(64×64)45点・背景(288×96)68点・フォント2点（詳細は assets/README.md）
├─ dist/kyoto.html         組み立て済みの完成品（ソースから作り直せる。ソースを変えたら作り直してコミット）
├─ tools/                  build.mjs / check.mjs / mkfont.py
└─ verify/                 画面テスト（t_*.mjs）・旧セーブの見本(fixtures/)・使わなくなった旧テスト(archive/)
```

JSファイルは classic script として **1つのスクリプトに結合**して動きます（ファイルをまたいで同じ変数・関数を共有します）。ES Modules ではないので、ファイルの順序（`order.json`）を変えないでください。各JSの1行目は見出しの注釈で、組み立て時に除かれます。

## 編集の流れ

1. `src/` を編集 → 2. `node kyoto/tools/build.mjs` → 3. `node kyoto/tools/check.mjs` → 4. 画面テスト → 5. `dist/kyoto.html` ごとコミット。
`check.mjs` は dist がソースと一致しないと失敗します（更新忘れ防止）。

## 状態・既知の問題・仕様との照合

`docs/HANDOFF_kyoto_2026-10-20.md` を参照してください（実装済み／未実装／未検証／既知の問題／仕様書との整合）。
仕様記録は `docs/kyoto-spec/`。
