// 大正9年国勢調査 表7（京都市）の手動転記CSV（暫定・原画像との照合は未了）の内部整合を確かめる。
// これは原表との照合の代わりではない。転記の取り違えを見つけるための自己検査（男+女=計、分母、割合）。
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const csv = readFileSync(new URL('../../docs/v17-records/data/kyoto_1920_occupation_table7_draft.csv', import.meta.url), 'utf8').replace(/^﻿/, '');
const lines = csv.trim().split(/\r?\n/);
const rows = lines.slice(1).map((l) => { const c = l.match(/("[^"]*"|[^,]*)(,|$)/g).map((x) => x.replace(/,$/, '').replace(/^"|"$/g, '')); return { no: +c[2], name: c[3], m: +c[4], f: +c[5], t: +c[6], pct: c[7] === '' ? null : +c[7], quality: c[9] }; });
test('ten rows; male + female = total for every row', () => {
  assert.equal(rows.length, 10);
  for (const r of rows) assert.equal(r.m + r.f, r.t, r.name);
});
test('classes 1-8 sum to the stated denominator 249,902 and the percentages follow', () => {
  const main = rows.filter((r) => r.no <= 8), tot = main.reduce((a, r) => a + r.t, 0);
  assert.equal(tot, 249902);
  for (const r of main) assert.ok(Math.abs(r.t / tot * 100 - r.pct) < 0.001, r.name);
});
test('every row is still flagged as an unverified manual transcription', () => {
  assert.ok(rows.every((r) => /要原本照合/.test(r.quality)));
});
