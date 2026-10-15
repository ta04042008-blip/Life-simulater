import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
test('static entrypoint has exact title, Japanese locale and local existing assets', () => {
  const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /<title>2000年の地球上の誰か1人。<\/title>/); assert.match(html, /lang="ja"/); assert.match(html, /name="viewport"/);
  for (const [, ref] of html.matchAll(/(?:src|href)="(\.\/[^\"]+)"/g)) assert.ok(fs.existsSync(new URL('../' + ref.slice(2), import.meta.url)), ref);
});
test('ES module relative dependencies are present', () => {
  for (const name of fs.readdirSync(new URL('../src', import.meta.url)).filter(x => x.endsWith('.js'))) {
    const source = fs.readFileSync(new URL('../src/' + name, import.meta.url), 'utf8');
    for (const [, ref] of source.matchAll(/from\s+['"](.+?)['"]/g)) assert.ok(fs.existsSync(new URL('../src/' + ref, import.meta.url)), path.join(name, ref));
  }
});
