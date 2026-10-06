import { mkdir, copyFile } from 'node:fs/promises';
await mkdir(new URL('../dist/server/', import.meta.url), { recursive: true });
for (const name of ['viteProxy.js', 'viteProxy.d.ts']) {
  await copyFile(new URL(`../src/server/${name}`, import.meta.url), new URL(`../dist/server/${name}`, import.meta.url));
}
