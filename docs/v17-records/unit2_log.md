# 単位2 実行ログ（乱数状態の保存と旧セーブの安全な移行）
実行日時: 2026-10-25T15:50:32+09:00
ベース: 939fdb9（単位1）／ブランチ feat/v17-baseline-tests／作業ツリー（コミット前）

## npm test（既存43件＋新規2件＝45件）  コマンド: npm test
```
# tests 45
# pass 45
# fail 0
# cancelled 0
```
## ビルド・検査  コマンド: node kyoto/tools/build.mjs && node kyoto/tools/check.mjs
```
OK（JS 22 ファイル、dist 一致）
```
## 単位2 専用の画面テスト  コマンド: PLAYWRIGHT_DIR=/opt/npm-tools/node_modules/ node kyoto/verify/t_rng.mjs
```
PASS 同じ保存状態から再開すると、以後の人生が一致する（再開しない場合とも一致）  — 10/10人生
PASS 回答待ちからの再開：選択肢が同じ・結果が一致・回答は一度だけ反映  — {"same":true,"noDouble":true,"decSame":true,"hadDec":true}
PASS 死亡：同じ保存状態から同じ年齢・死因／再読み込みで二重確定しない  — {"same":true,"res0":[89,"老衰",1089],"deathLogs":1,"noTick":true}
PASS 画面の表示・切替・演出だけでは S.rs もゲーム状態も変わらない  — rs 4051792123→4051792123
PASS step() と手動の進行で、結果が一致する  — {"eq":true,"decision":true}
PASS 途中イベントの予定は保存され、復元しても引き直さない（乱数も進まない）  — {"same":true,"rsSame":true,"n":1}
PASS 旧セーブ legacy_adult.json：移行・原本退避は一度だけ・乱数は一度だけ補完・続きが再現  — {"had":true,"ok1":true,"ok2":true,"okAuto":true,"sameRs":true,"rsInt":true,"sameLid":true,"backupOnce":true,"autoHasRs":true,"advanc
PASS 旧セーブ legacy_child.json：移行・原本退避は一度だけ・乱数は一度だけ補完・続きが再現  — {"had":true,"ok1":true,"ok2":true,"okAuto":true,"sameRs":true,"rsInt":true,"sameLid":true,"backupOnce":true,"autoHasRs":true,"advanc
PASS 旧セーブ legacy_elder.json：移行・原本退避は一度だけ・乱数は一度だけ補完・続きが再現  — {"had":true,"ok1":true,"ok2":true,"okAuto":true,"sameRs":true,"rsInt":true,"sameLid":true,"backupOnce":true,"autoHasRs":true,"advanc
PASS 旧セーブ legacy_pending.json：移行・原本退避は一度だけ・乱数は一度だけ補完・続きが再現  — {"had":true,"ok1":true,"ok2":true,"okAuto":true,"sameRs":true,"rsInt":true,"sameLid":true,"backupOnce":true,"autoHasRs":true,"adva
PASS 旧セーブ legacy_young.json：移行・原本退避は一度だけ・乱数は一度だけ補完・続きが再現  — {"had":true,"ok1":true,"ok2":true,"okAuto":true,"sameRs":true,"rsInt":true,"sameLid":true,"backupOnce":true,"autoHasRs":true,"advanc
PASS 移行に失敗する旧セーブ：人生は変わらず、原本は退避済みで手動の枠へ戻せる  — {"ok":false,"unchanged":true,"kept":true,"restored":true,"savedCurrent":true}
PASS 新しい人生は人生ごとに別の乱数の種を持ち、自動保存に含まれる  — {"distinct":20,"savedRs":true}
page errors: []
13/13 PASS
```
## v1.7 T01〜T12  コマンド: PLAYWRIGHT_DIR=/opt/npm-tools/node_modules/ node kyoto/verify/spec_v17_baseline.mjs
```
v1.7 §10A 現行コード検査（京都版）
T01 [不合格] 日本版で1年・2025年を出生 — 1年→aristocrat,common,farm / 2025年→境遇なし
T02 [ブロック] 20か国版の出生抽選 — 国別データと抽選が未実装（v1.7どおり日本版合格後）
T03 [合格] 年齢境界の送り幅 — 年齢→1回分の長さ(年): {"0":[1],"3":[1],"5":[1],"6":[0.25],"10":[0.25],"23":[0.25],"24":[0.25],"25":[0.5],"40":[0.5],"58":[0.5],"59":[0.5],"60":[1],"
T04 [合格] 0〜5歳の途中の出来事 — {"infantYearMonths":{"runs":20,"bad":0},"choiceBeforeAge4":0,"smallChoiceMidYear":{"appeared":true,"elapsedYears":0.5,"expected":0.5},"deathMidYear":{"de
T05 [合格] 選択中の再読込・二重回答・時間停止 — {"hasDecision":true,"timeStoppedWhilePending":true,"sameAfterReload":true,"answeredOnce":true,"midGaugeResume":{"midT":0.5,"afterCo
T06 [一部合格] 死亡の二重確定 — {"dead":true,"tickAfterDeath":false,"deathAgeKept":true,"logUnchanged":true,"deathLogCount":1,"sameDeathFromSameSave":true} ／死亡の一度きり確定�
T07 [未実施] 好感度9↔10の相関図 — 既存 t_map.mjs/t_map2.mjs の範囲。T07専用の9↔10境界検査は未作成
T08 [合格] 能力・★・気質の生成と保存 — {"ok":true,"why":""} (300人)
T09 [ブロック] 成長の芽と追憶 — 成長の芽・実績・追憶・装備枠の実装なし
T10 [一部合格] 2026年以降へ生存 — 40人中31人が2026年以降まで生存(最大2083年)。ゲーム内推定の区別・世界データは未実装
T11 [合格] 内部月次の欠落なし — 113ステップで送り幅と月数の不一致=0（季節演出の省略は別途）
T12 [不合格] 高齢・早世の終了 — 確率ゼロでも110歳で「老衰」(強制上限) / 早世0歳
```
## 画面テスト一式  コマンド: PLAYWRIGHT_DIR=/opt/npm-tools/node_modules/ node kyoto/verify/run-all.mjs 3
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
ok   t_s6.mjs
ok   t_s5ui.mjs
ok   t_s7.mjs
ok   t_s6ui.mjs
ok   t_s8.mjs
ok   t_s7ui.mjs
ok   t_save.mjs
ok   t_rng.mjs
ok   t_smoke.mjs
ok   t_st0.mjs
ok   t_st1.mjs
ok   t_st2.mjs
ok   t_star.mjs
ok   t_stui.mjs
ok   t_title.mjs
ok   t_st3.mjs
ok   t_ui.mjs

34/34 ok
```
