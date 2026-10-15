// User-created artwork. Keep the original 24×32 pixels and transparent padding.
export const FRAME = Object.freeze({ width: 24, height: 32 });
export const WAIST_Y = 23; // Rows 0–22: top; rows 23–31: trousers and shoes.
export const HAIRS = [1, 2, 3, 4].map(n => ({ id: `hair-${n}`, label: `髪型 ${n}`, file: `hair-${n}.png` }));
export const OUTFITS = [
  ...[1, 2].map(n => ({ id: `office-${n}`, label: `会社員 ${n}`, file: `office-${n}.png` })),
  { id: 'casual-1', label: '生成り・茶', file: 'casual-1.png' },
  { id: 'casual-2', label: '緑・青', file: 'casual-2.png' },
];
export const TOPS = OUTFITS.map(o => ({ ...o, label: o.id === 'casual-1' ? '生成りの上着' : o.id === 'casual-2' ? '緑の上着' : `${o.label}の上着` }));
export const BOTTOMS = OUTFITS.map(o => ({ ...o, label: o.id === 'casual-1' ? '茶のズボン' : o.id === 'casual-2' ? '青のズボン' : `${o.label}のズボン` }));
export const DEFAULT_APPEARANCE = Object.freeze({ hair: 'hair-3', top: 'office-1', bottom: 'office-1' });
const base = { id: 'base', file: 'base.png' };
export const assetUrl = file => new URL(`../assets/characters/${file}`, import.meta.url).href;
export function normalizeAppearance(value) {
  // Old saved outfit selection maps to both halves without changing a life save.
  const legacy = OUTFITS.some(o => o.id === value?.outfit) ? value.outfit : null;
  return { hair: HAIRS.some(h => h.id === value?.hair) ? value.hair : DEFAULT_APPEARANCE.hair,
    top: TOPS.some(o => o.id === value?.top) ? value.top : legacy || DEFAULT_APPEARANCE.top,
    bottom: BOTTOMS.some(o => o.id === value?.bottom) ? value.bottom : legacy || DEFAULT_APPEARANCE.bottom };
}
export function characterLayers(value) {
  const v = normalizeAppearance(value);
  return [
    { ...base, role: 'base', crop: { y: 0, height: FRAME.height } },
    { ...BOTTOMS.find(o => o.id === v.bottom), role: 'bottom', crop: { y: WAIST_Y, height: FRAME.height - WAIST_Y } },
    { ...TOPS.find(o => o.id === v.top), role: 'top', crop: { y: 0, height: WAIST_Y } },
    { ...HAIRS.find(h => h.id === v.hair), role: 'hair', crop: { y: 0, height: FRAME.height } },
  ].map(d => ({ ...d, url: assetUrl(d.file) }));
}
export function layerClip(layer) {
  const top = layer.crop.y / FRAME.height * 100;
  const bottom = (FRAME.height - layer.crop.y - layer.crop.height) / FRAME.height * 100;
  return `inset(${top}% 0 ${bottom}% 0)`;
}
export function canUseOfficeArtwork(run) {
  return Boolean(run && run.tick / 4 >= 16 && run.birthYear + Math.floor(run.tick / 4) >= 1850);
}
const loaded = new Map();
let loading;
export function preloadCharacters() {
  if (loading) return loading;
  if (typeof Image === 'undefined') return Promise.resolve(false);
  const defs = [base, ...OUTFITS, ...HAIRS];
  loading = Promise.all(defs.map(d => new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      if (img.naturalWidth === FRAME.width && img.naturalHeight === FRAME.height) { loaded.set(d.id, img); resolve(true); }
      else resolve(false);
    };
    img.onerror = () => resolve(false);
    img.src = assetUrl(d.file);
  }))).then(values => values.every(Boolean));
  return loading;
}
export function drawCharacter(ctx, value, x, y, scale = 2) {
  const layers = characterLayers(value);
  if (!layers.every(l => loaded.has(l.id))) return false;
  const integerScale = Math.max(1, Math.round(scale));
  ctx.save(); ctx.imageSmoothingEnabled = false;
  for (const l of layers) ctx.drawImage(loaded.get(l.id), 0, l.crop.y, FRAME.width, l.crop.height, Math.round(x), Math.round(y) + l.crop.y * integerScale, FRAME.width * integerScale, l.crop.height * integerScale);
  ctx.restore();
  return true;
}
