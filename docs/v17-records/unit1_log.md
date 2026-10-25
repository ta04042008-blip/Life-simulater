# 単位1 実行ログ（年齢別の時間送り幅）
実行日時: 2026-10-25T15:27:43+09:00
ベース: c118fe2（単位0）／ブランチ feat/v17-baseline-tests／作業ツリー（コミット前）

## npm test（既存43件）
```
# tests 43
# pass 43
# fail 0
# cancelled 0
```
## ビルド・検査
```
OK（JS 22 ファイル、dist 一致）
```
## v1.7 T01〜T12 検査（コマンド: PLAYWRIGHT_DIR=/opt/npm-tools/node_modules/ node kyoto/verify/spec_v17_baseline.mjs）
```
v1.7 §10A 現行コード検査（京都版）
T01 [不合格] 日本版で1年・2025年を出生 — 1年→aristocrat,common,farm / 2025年→境遇なし
T02 [ブロック] 20か国版の出生抽選 — 国別データと抽選が未実装（v1.7どおり日本版合格後）
T03 [合格] 年齢境界の送り幅 — 年齢→1回分の長さ(年): {"0":[1],"3":[1],"5":[1],"6":[0.25],"10":[0.25],"23":[0.25],"24":[0.25],"25":[0.5],"40":[0.5],"58":[0.5],"59":[0.5],"60":[1],"62":[1]}
T04 [合格] 0〜5歳の途中の出来事 — {"infantYearMonths":{"runs":20,"bad":0},"choiceBeforeAge4":0,"smallChoiceMidYear":{"appeared":true,"elapsedYears":0.5,"expected":0.5},"deathMidYear":{"dead":true,"t":0.25}} ／幼児の選択開始4歳はユーザー決定(A案)
T05 [一部合格] 選択中の再読込・二重回答・時間停止 — {"hasDecision":true,"timeStoppedWhilePending":true,"sameAfterReload":true,"answeredOnce":true,"midGaugeResume":{"midT":0.5,"afterContinue":1,"expected":1,"sameAsDirect":true}} ／乱数状態は保存されないため、再開後の未来を完全に同一にする検査は単位2
T06 [一部合格] 死亡の二重確定 — {"dead":true,"tickAfterDeath":false,"deathAgeKept":true,"logUnchanged":true,"deathLogCount":1} ／病気・事故との二重計上は死亡率の再設計後に検査
T07 [未実施] 好感度9↔10の相関図 — 既存 t_map.mjs/t_map2.mjs の範囲。T07専用の9↔10境界検査は未作成
T08 [合格] 能力・★・気質の生成と保存 — {"ok":true,"why":""} (300人)
T09 [ブロック] 成長の芽と追憶 — 成長の芽・実績・追憶・装備枠の実装なし
T10 [一部合格] 2026年以降へ生存 — 40人中39人が2026年以降まで生存(最大2087年)。ゲーム内推定の区別・世界データは未実装
T11 [合格] 内部月次の欠落なし — 113ステップで送り幅と月数の不一致=0（季節演出の省略は別途）
T12 [不合格] 高齢・早世の終了 — 確率ゼロでも110歳で「老衰」(強制上限) / 早世0歳
```
## 画面テスト一式（コマンド: PLAYWRIGHT_DIR=/opt/npm-tools/node_modules/ node kyoto/verify/run-all.mjs 3）
```
ok   t_design.mjs
ok   t_all.mjs
ok   t_designer_filter.mjs
ok   t_designer.mjs
ok   t_double.mjs
ok   t_dyn.mjs
ok   t_keep2.mjs
ok   t_later.mjs
ok   t_birth.mjs
ok   t_keep.mjs
ok   t_names.mjs
ok   t_npc.mjs
ok   t_map.mjs
ok   t_map2.mjs
ok   t_npc2.mjs
ok   t_pers.mjs
ok   t_s5.mjs
ok   t_s5ui.mjs
ok   t_s6.mjs
ok   t_s6ui.mjs
ok   t_s7.mjs
ok   t_s8.mjs
ok   t_s7ui.mjs
ok   t_save.mjs
ok   t_st0.mjs
ok   t_smoke.mjs
ok   t_st2.mjs
ok   t_st1.mjs
ok   t_star.mjs
ok   t_stui.mjs
ok   t_st3.mjs
ok   t_title.mjs
ok   t_ui.mjs

33/33 ok
```
