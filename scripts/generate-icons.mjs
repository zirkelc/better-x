import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const here = dirname(fileURLToPath(import.meta.url));
const iconDir = join(here, '..', 'public', 'icon');
const svg = readFileSync(join(iconDir, 'icon.svg'));

for (const size of [16, 48, 128]) {
  const out = join(iconDir, `${size}.png`);
  const data = await sharp(svg).resize(size, size).png().toBuffer();
  writeFileSync(out, data);
  console.log(`wrote ${out} (${data.length} bytes)`);
}
