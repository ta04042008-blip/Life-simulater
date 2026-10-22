import { canUseOfficeArtwork, drawCharacter } from './characters.js';
// Original, replaceable scenery with layered user-created adult artwork.
export function drawScene(canvas, run, world, appearance) {
  if (!canvas) return;
  const c = canvas.getContext('2d');
  canvas.width = 720; canvas.height = 190;
  c.imageSmoothingEnabled = false;
  const rect = (x, y, w, h, fill) => { c.fillStyle = fill; c.fillRect(x, y, w, h); };
  const year = run ? run.birthYear + Math.floor(run.tick / 4) : 1450;
  const modern = year >= 1850;
  const sand = world?.palette === 'sand' || world?.palette === 'earth';
  rect(0, 0, 720, 190, '#c8dce0');
  rect(0, 73, 720, 48, '#91b5a3');
  for (let i = 0; i < 13; i++) {
    rect(i * 62 - 15, 58 + (i % 3) * 8, 85, 35, i % 2 ? '#aac5b4' : '#b8cbb8');
    rect(i * 60 + 10, 18 + (i % 3) * 7, 32, 8, '#f2f1dd'); rect(i * 60 + 18, 13 + (i % 3) * 7, 18, 6, '#f2f1dd');
  }
  rect(610, 16, 16, 16, '#f6dfa3'); rect(606, 20, 24, 8, '#f6dfa3');
  rect(0, 107, 720, 83, sand ? '#c4b689' : '#9ea976');
  rect(0, 160, 720, 30, '#a4906f'); rect(0, 165, 720, 3, '#b9a280');
  for (let i = 0; i < 85; i++) rect((i * 53) % 720, 111 + (i * 29) % 46, 3, 2, i % 2 ? '#b9c18b' : '#859666');
  const tree = (x, y, k = 1) => {
    rect(x + 10 * k, y + 19 * k, 6 * k, 22 * k, '#78644d');
    rect(x, y + 5 * k, 27 * k, 22 * k, '#567d5e'); rect(x + 5 * k, y, 17 * k, 30 * k, '#6b9369');
    rect(x + 4 * k, y + 7 * k, 10 * k, 7 * k, '#8ca474');
  };
  tree(12, 67, 1.5); tree(636, 64, 1.8); tree(682, 81, 1.2);
  const house = (x, y, w, h, color, roof) => {
    rect(x + 3, y + 5, w, h, '#6c624c'); rect(x, y, w, h, color);
    rect(x - 8, y - 5, w + 16, 9, roof); rect(x - 1, y - 12, w + 2, 8, roof); rect(x + 9, y - 18, w - 18, 7, roof);
    rect(x + 12, y + 13, 19, 20, '#6b725f'); rect(x + 14, y + 15, 15, 16, '#d5c490');
    rect(x + 20, y + 15, 2, 16, '#7e7d60'); rect(x + 14, y + 22, 15, 2, '#7e7d60');
    rect(x + w - 27, y + 14, 17, h - 14, '#77664d'); rect(x + w - 24, y + 17, 11, h - 17, '#8e7855');
    rect(x + w - 18, y + 36, 2, 2, '#cabc8c'); rect(x - 3, y + h - 3, w + 6, 5, '#8d7e63');
  };
  house(67, 86, 78, 61, '#d6c4a0', sand ? '#a07e5d' : '#696e5a');
  // Main home as a cutaway; the room is a horizontal vignette, not a walking map.
  rect(179, 46, 311, 113, '#715d48'); rect(186, 52, 297, 100, '#d8c59d');
  rect(186, 126, 297, 26, '#a98b61');
  for (let i = 0; i < 10; i++) rect(186, 128 + i * 3, 297, 1, i % 2 ? '#b79a71' : '#b1976e');
  rect(171, 37, 327, 13, modern ? '#7b6c62' : '#797651'); rect(180, 28, 309, 10, modern ? '#887766' : '#8b855c');
  rect(193, 59, 3, 69, '#9e8864'); rect(318, 52, 5, 74, '#9e8864'); rect(475, 52, 4, 75, '#9e8864');
  rect(344, 63, 60, 44, '#8b876e'); rect(348, 67, 52, 36, '#abc4bd'); rect(373, 67, 3, 36, '#b09c77');
  rect(348, 84, 52, 3, '#b09c77'); rect(348, 93, 25, 10, '#7fa383'); rect(376, 91, 24, 12, '#78987a');
  // Bed, shelf, books, kitchen and plants.
  rect(201, 115, 57, 25, '#79674f'); rect(201, 114, 55, 9, '#dfd0ac'); rect(217, 117, 40, 13, '#84928a'); rect(204, 113, 14, 7, '#eee4c7');
  rect(266, 70, 37, 60, '#8a7250');
  for (let i = 0; i < 3; i++) { rect(269, 74 + i * 18, 31, 13, '#695d49'); for (let j = 0; j < 5; j++) rect(271 + j * 5, 77 + i * 18, 3, 9, ['#9b7359', '#a39a6b', '#728d85'][j % 3]); }
  rect(420, 104, 46, 25, '#b1976e'); rect(416, 101, 54, 5, '#75684f'); rect(427, 90, 17, 11, '#626654'); rect(431, 86, 9, 4, '#626654');
  if (modern) { rect(451, 65, 17, 33, '#b4b5a2'); rect(452, 80, 15, 2, '#909681'); }
  const pot = (x, y) => { rect(x + 3, y + 10, 10, 8, '#a16e50'); rect(x + 5, y, 6, 12, '#60865e'); rect(x, y + 4, 7, 5, '#78976b'); rect(x + 9, y + 2, 7, 5, '#8aa171'); };
  pot(454, 111); pot(327, 92); pot(154, 131); pot(497, 130);
  rect(325, 119, 76, 7, '#8c6d4a'); rect(330, 126, 5, 18, '#765c42'); rect(390, 126, 5, 18, '#765c42');
  rect(351, 113, 11, 6, '#e5d7ad'); rect(370, 111, 8, 8, '#9f7952'); rect(372, 108, 4, 4, '#63815e');
  rect(304, 141, 112, 7, '#c8ad7e');
  const person = (x, y, shirt, kid = false) => {
    const k = kid ? .75 : 1;
    const r = (a, b, w, h, fill) => rect(x + Math.round(a * k), y + Math.round(b * k), Math.ceil(w * k), Math.ceil(h * k), fill);
    r(2, 0, 12, 6, '#514c40'); r(0, 5, 16, 8, '#514c40'); r(3, 6, 11, 10, '#d8b48b'); r(11, 9, 2, 2, '#504c40');
    r(2, 17, 13, 14, shirt); r(0, 19, 4, 11, shirt); r(14, 21, 5, 4, '#d8b48b');
    r(3, 30, 5, 10, '#665a4a'); r(10, 30, 5, 10, '#665a4a'); r(2, 39, 7, 3, '#4d4f42'); r(10, 39, 7, 3, '#4d4f42');
  };
  const age = run ? run.tick / 4 : 30;
  if (age < 3) { rect(344, 133, 18, 8, '#d9cfad'); rect(347, 129, 8, 7, '#d8b48b'); }
  else if (!canUseOfficeArtwork(run) || !drawCharacter(c, appearance, 283, 84, 2)) person(301, age < 13 ? 115 : 102, '#638e91', age < 13);
  if (!run || run.people.some(p => p.id === 'partner' && p.alive)) person(410, 93, '#b18c70');
  else if (age < 25 && run.people[0]?.alive) person(411, 93, '#b18c70');
  if (run?.hobby) { rect(274, 132, 14, 8, '#c5ad77'); rect(277, 127, 8, 7, '#a4845f'); }
  // The world beyond the home.
  if (modern) {
    house(531, 83, 63, 64, '#bea98c', '#82695d'); rect(577, 52, 9, 24, '#7d7162');
    rect(520, 57, 3, 95, '#6d7462'); rect(513, 57, 17, 3, '#6d7462');
  } else {
    for (let row = 0; row < 4; row++) for (let col = 0; col < 12; col++) {
      rect(526 + col * 7, 110 + row * 10, 5, 7, '#83916a'); rect(528 + col * 7, 107 + row * 10, 2, 7, '#a9b17d');
    }
  }
  for (let i = 0; i < 12; i++) { rect(i * 64 + 8, 177, 25, 1, '#8c7e65'); rect(i * 71, 185, 7, 1, '#c1aa83'); }
}
