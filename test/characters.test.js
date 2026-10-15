import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { DEFAULT_APPEARANCE, FRAME, HAIRS, OUTFITS, TOPS, BOTTOMS, WAIST_Y, assetUrl, canUseOfficeArtwork, characterLayers, drawCharacter, normalizeAppearance, preloadCharacters } from '../src/characters.js';

test('all 64 combinations retain aligned base, trousers, top and hair layers', () => {
  for (const hair of HAIRS) for (const top of TOPS) for (const bottom of BOTTOMS) {
    const layers = characterLayers({ hair: hair.id, top: top.id, bottom: bottom.id });
    assert.deepEqual(layers.map(l => l.id), ['base', bottom.id, top.id, hair.id]);
    assert.deepEqual(layers.map(l => l.role), ['base', 'bottom', 'top', 'hair']);
    for (let y = 0; y < FRAME.height; y++) assert.equal(layers.filter(l => ['top', 'bottom'].includes(l.role) && y >= l.crop.y && y < l.crop.y + l.crop.height).length, 1);
  }
});
test('missing or invalid appearance settings fall back without touching life state', () => {
  for (const invalid of [null, {}, [], 'invalid', { hair: '../../x', outfit: 'unknown' }]) assert.deepEqual(normalizeAppearance(invalid), DEFAULT_APPEARANCE);
  assert.deepEqual(normalizeAppearance({ hair: 'hair-1', outfit: 'office-2' }), { hair: 'hair-1', top: 'office-2', bottom: 'office-2' });
});
test('all nine original assets are 24x32 RGBA PNGs and resolve relative to the module', () => {
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
test('canvas compositing draws four aligned layers at integer scale with smoothing off', async () => {
  assert.equal(drawCharacter({}, DEFAULT_APPEARANCE, 1, 1), false);
  class FakeImage {
    naturalWidth = 24; naturalHeight = 32;
    set src(value) { this.url = value; queueMicrotask(() => this.onload()); }
  }
  globalThis.Image = FakeImage;
  assert.equal(await preloadCharacters(), true);
  const calls = [], ctx = { save() {}, restore() {}, drawImage(...args) { calls.push(args); }, imageSmoothingEnabled: true };
  assert.equal(drawCharacter(ctx, { hair: 'hair-4', top: 'casual-1', bottom: 'casual-2' }, 10.2, 20.8, 2.2), true);
  assert.equal(ctx.imageSmoothingEnabled, false);
  assert.equal(calls.length, 4);
  assert.equal(WAIST_Y, 23);
  assert.deepEqual(calls.map(c => c.slice(1)), [[0, 0, 24, 32, 10, 21, 48, 64], [0, 23, 24, 9, 10, 67, 48, 18], [0, 0, 24, 23, 10, 21, 48, 46], [0, 0, 24, 32, 10, 21, 48, 64]]);
  assert.deepEqual(calls.map(c => c[0].url.split('/').at(-1)), ['base.png', 'casual-2.png', 'casual-1.png', 'hair-4.png']);
  delete globalThis.Image;
});

test('old outfit settings migrate both halves; invalid one-sided selections fall back', () => {
  assert.deepEqual(normalizeAppearance({ hair: 'hair-2', outfit: 'office-2' }), { hair: 'hair-2', top: 'office-2', bottom: 'office-2' });
  assert.deepEqual(normalizeAppearance({ hair: 'hair-1', top: 'casual-1', bottom: 'missing' }), { hair: 'hair-1', top: 'casual-1', bottom: 'office-1' });
});
