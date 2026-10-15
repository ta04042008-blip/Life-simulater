import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { DEFAULT_APPEARANCE, FRAME, HAIRS, OUTFITS, assetUrl, canUseOfficeArtwork, characterLayers, drawCharacter, normalizeAppearance, preloadCharacters } from '../src/characters.js';

test('all eight combinations retain base, outfit, hair layer order', () => {
  for (const hair of HAIRS) for (const outfit of OUTFITS) {
    assert.deepEqual(characterLayers({ hair: hair.id, outfit: outfit.id }).map(l => l.id), ['base', outfit.id, hair.id]);
  }
});
test('missing or invalid appearance settings fall back without touching life state', () => {
  for (const invalid of [null, {}, [], 'invalid', { hair: '../../x', outfit: 'unknown' }]) assert.deepEqual(normalizeAppearance(invalid), DEFAULT_APPEARANCE);
  assert.deepEqual(normalizeAppearance({ hair: 'hair-1', outfit: 'office-2' }), { hair: 'hair-1', outfit: 'office-2' });
});
test('all seven original assets are 24x32 RGBA PNGs and resolve relative to the module', () => {
  for (const file of ['base.png', ...HAIRS.map(h => h.file), ...OUTFITS.map(o => o.file)]) {
    const png = fs.readFileSync(new URL(assetUrl(file)));
    assert.equal(png.subarray(1, 4).toString(), 'PNG');
    assert.equal(png.readUInt32BE(16), FRAME.width);
    assert.equal(png.readUInt32BE(20), FRAME.height);
    assert.equal(png[25], 6, 'RGBA color type');
  }
});
test('office artwork applies only to adult near-modern samples', () => {
  assert.equal(canUseOfficeArtwork(null), false);
  assert.equal(canUseOfficeArtwork({ birthYear: 1450, tick: 80 }), false);
  assert.equal(canUseOfficeArtwork({ birthYear: 1900, tick: 63 }), false);
  assert.equal(canUseOfficeArtwork({ birthYear: 1900, tick: 64 }), true);
});
test('canvas compositing draws three aligned layers at integer scale with smoothing off', async () => {
  assert.equal(drawCharacter({}, DEFAULT_APPEARANCE, 1, 1), false);
  class FakeImage {
    naturalWidth = 24; naturalHeight = 32;
    set src(value) { this.url = value; queueMicrotask(() => this.onload()); }
  }
  globalThis.Image = FakeImage;
  assert.equal(await preloadCharacters(), true);
  const calls = [], ctx = { save() {}, restore() {}, drawImage(...args) { calls.push(args); }, imageSmoothingEnabled: true };
  assert.equal(drawCharacter(ctx, { hair: 'hair-4', outfit: 'office-2' }, 10.2, 20.8, 2.2), true);
  assert.equal(ctx.imageSmoothingEnabled, false);
  assert.equal(calls.length, 3);
  assert.deepEqual(calls.map(c => c.slice(1)), [[10, 21, 48, 64], [10, 21, 48, 64], [10, 21, 48, 64]]);
  assert.deepEqual(calls.map(c => c[0].url.split('/').at(-1)), ['base.png', 'office-2.png', 'hair-4.png']);
  delete globalThis.Image;
});
