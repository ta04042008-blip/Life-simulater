import { cp, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('..', import.meta.url));
await mkdir(path.join(root, 'dist'), { recursive: true });
for (const name of ['src', 'assets']) {
  await rm(path.join(root, 'dist', name), { recursive: true, force: true });
  await cp(path.join(root, name), path.join(root, 'dist', name), { recursive: true });
}
await cp(path.join(root, 'index.html'), path.join(root, 'dist', 'index.html'));
console.log('Static files prepared in dist/.');
