# 2000年の地球上の誰か1人。 — 京都版

現在の公開対象は **京都版（京都の暮らし 見本）** です。

- 遊ぶ：https://ta04042008-blip.github.io/Life-simulater/
- 最新版のソースと説明：[kyoto/README.md](kyoto/README.md)
- 開発元：develop の `8fa0c3114e21bfe36e2f122f1d0a192f213debd6`。
- 公開ファイル：`kyoto/dist/kyoto.html` と同じ内容を `docs/index.html` に配置。画像とフォントを含む1枚のHTMLです。
- 検証・仕様・既知の問題：[引き継ぎ記録](docs/HANDOFF_kyoto_2026-10-20.md)。末尾の最新追記を優先してください。

## 現在の京都版

17種類の境遇、人物の4能力（0〜1000）、気質、家族、関係、家計、状態システム、自動保存・手動保存・JSON入出力を備えた試作です。旧イベント140件は開発元の指示により削除済みで、元データを `kyoto/legacy/events-140.json` に保持しています。四半期進行の機能ブランチは未統合で、この公開には含めていません。約3時間のプレイ時間や全時代の史実再現は完成していません。

## 検証と公開ファイルの更新

```sh
npm test
npm run check
npm run kyoto:build
npm run kyoto:check
# Playwrightを利用できる環境で
npm run kyoto:verify
# 公開内容を更新する場合
cp kyoto/dist/kyoto.html docs/index.html
```

京都版の素材の出所とフォントのライセンスは [kyoto/assets/README.md](kyoto/assets/README.md) に記載しています。

## 旧試作

ルート直下の `index.html`・`src/`・`test/` は旧試作です。京都版とは別のゲームで、現在の公開対象ではありません。旧試作の就職・出会い・働き方の追加も京都版には含めていません。
