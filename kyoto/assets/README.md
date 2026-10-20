# 素材一覧と権利の状況

ゲームは素材を `assets/` のPNG/woffファイルから読み、`tools/build.mjs` が1枚のHTMLへデータとして埋め込みます。ソース中の `@@ASSET:パス@@` が、このフォルダのファイルの位置を指します。

## 内容

| 場所 | 点数 | 寸法 | 内容 | 出所 |
|---|---|---|---|---|
| `backgrounds/` 元の4境遇 | 16 | 288×96 | aristocrat / common / farm / artisan × 春夏秋冬 | ユーザー作成（AI生成を含む） |
| `backgrounds/` 追加の13境遇 | 52 | 288×96 | mer_m, edo_farm, edo_machiya, edo_shop, edo_nagaya, sh_rent, sh_sal, sh_rich, m70, m80a, m80d, m90c, m90w × 春夏秋冬 | ユーザー作成（AI生成を含む）。「背景17種」のzip（2026-10-20）から13種を採用 |
| `sprites/` | 45 | 64×64 | 体・髪・白髪（4境遇 × 各1）、赤ん坊2、子ども7×3組（nb）、髪5×2組（nh） | ユーザー制作の人物ドット絵 |
| `fonts/PixelMplus10-Bold.subset.woff` / `-Regular.subset.woff` | 2 | — | 画面の文字。ゲームで使う文字（＋JIS第1水準漢字）だけを抜き出した部分集合 | PixelMplus10（itouhiro、M+ FONTS PROJECT）https://github.com/itouhiro/PixelMplus |

## 権利について

- **背景68点**：ユーザー（リポジトリの作成者）が作成した素材（AI生成を含む）で、使用・登録・公開に問題ないことをユーザーが 2026-10-20 に確認しました。ファイル名・寸法・SHA-256 は `backgrounds-MANIFEST.txt` にあります。
- **人物の絵45点**：ユーザー制作。
- **フォント**：PixelMplus は M+ FONT LICENSE（改変・再配布・商用を含め自由、保証なし）。ライセンス文を `fonts/LICENSE_M+FONTS_E.txt`（英）・`_J.txt`（日）に同梱しています。部分集合化（改変）して配布しており、同ライセンスで許されています。

## 更新方法

- 絵を差し替える：同名のPNGを置き換え → `node kyoto/tools/build.mjs`。
- フォントを作り直す：`python3 kyoto/tools/mkfont.py <PixelMplusのttfがあるフォルダ>`（先に build しておく）。
- 背景を差し替えるときは、同名・同寸法（288×96、春夏秋冬）で置き換えれば、コードの変更は要りません。
- 未使用だった旧フォントのデータ（以前の版の残り）は引き継いでいません。

## 背景素材の整合を確かめる

`cd kyoto/assets/backgrounds && sha256sum *.png` の出力が、`backgrounds-MANIFEST.txt` の1列目（SHA-256）とファイル名ごとに一致し、ソースが参照する68件のファイル名（`src/js/*.js` の `@@ASSET:backgrounds/…@@`）に過不足がないこと。
