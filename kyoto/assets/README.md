# 素材一覧と権利の状況

ゲームは素材を `assets/` のPNG/woffファイルから読み、`tools/build.mjs` が1枚のHTMLへデータとして埋め込みます。ソース中の `@@ASSET:パス@@` が、このフォルダのファイルの位置を指します。

## 内容

| 場所 | 点数 | 寸法 | 内容 | 出所 |
|---|---|---|---|---|
| `backgrounds/`（GitHub未登録）元の4境遇 | 16 | 288×96 | aristocrat / common / farm / artisan × 春夏秋冬 | ユーザー提供（開発初期から使用。パック名・作者などの記録は会話内に無い） |
| `backgrounds/`（GitHub未登録）追加の13境遇 | 52 | 288×96 | mer_m, edo_farm, edo_machiya, edo_shop, edo_nagaya, sh_rent, sh_sal, sh_rich, m70, m80a, m80d, m90c, m90w × 春夏秋冬 | ユーザーがアップロードした「背景17種」のzip（2026-10-20）から13種を採用 |
| `sprites/` | 45 | 64×64 | 体・髪・白髪（4境遇 × 各1）、赤ん坊2、子ども7×3組（nb）、髪5×2組（nh） | ユーザー提供の人物ドット絵（「スキン・髪パック」等。ユーザー制作と記録されているが、パック名・作者などの詳細記録は無い） |
| `fonts/PixelMplus10-Bold.subset.woff` / `-Regular.subset.woff` | 2 | — | 画面の文字。ゲームで使う文字（＋JIS第1水準漢字）だけを抜き出した部分集合 | PixelMplus10（itouhiro、M+ FONTS PROJECT）https://github.com/itouhiro/PixelMplus |

## 権利について（要確認・公開リポジトリです）

- **フォント**：PixelMplus は M+ FONT LICENSE（改変・再配布・商用を含め自由、保証なし）。ライセンス文を `fonts/LICENSE_M+FONTS_E.txt`（英）・`_J.txt`（日）に同梱しています。部分集合化（改変）して配布しており、同ライセンスで許されています。
- **背景・人物の絵**：ユーザーから提供された素材で、このリポジトリの作成者（ユーザー）が公開・再配布してよいものかを、**Claudeは確認できていません**。第三者が作者の素材（例：配布パックの再配布禁止条件があるもの）が含まれる場合は、公開前に `docs/DEVELOPMENT_WORKFLOW.md` の指示どおり、権利と再配布条件を確認してください。背景68点は、このため **GitHubには登録していません**（人物の絵45点は「ユーザー制作」と記録があるため登録しました。それでも出所の確認はお願いします）。
- 追加の13境遇用の背景52点の出所（パック名・作者・利用条件）は、会話内に記録がありません。**ユーザーが元のzipの同梱文書で確認してください。**

## 更新方法

- 絵を差し替える：同名のPNGを置き換え → `node kyoto/tools/build.mjs`。
- フォントを作り直す：`python3 kyoto/tools/mkfont.py <PixelMplusのttfがあるフォルダ>`（先に build しておく）。
- 未使用だった旧フォントのデータ（以前の版の残り）は引き継いでいません。

## 背景素材を戻す（権利確認後）

背景PNG 68点は、権利確認が取れるまで GitHub に置いていません（`.gitignore` で誤コミットを防止）。ファイル名・寸法・SHA-256 の一覧は `backgrounds-MANIFEST.txt` にあります。

1. 完全版ZIP（`kyoto-full-2026-10-20.zip`）の `kyoto/assets/backgrounds/*.png` を、同じ場所へ置く。
2. 照合する：`cd kyoto/assets/backgrounds && sha256sum *.png` の出力が、`backgrounds-MANIFEST.txt` の1列目（SHA-256）とファイル名ごとに一致すること。
3. 公開してよいと確認できたら、リポジトリ直下の `.gitignore` から `kyoto/assets/backgrounds/*.png`・`kyoto/dist/`・`kyoto/verify/shots/` の行を消し、`git add` してコミットする。
4. 公開できない場合は、同名・同寸法（288×96、春夏秋冬）の差し替え素材を用意すれば、コードの変更なしで置き換えられる。
