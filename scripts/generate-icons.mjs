import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const here = dirname(fileURLToPath(import.meta.url));
const publicDir = join(here, '..', 'public');
const iconDir = join(publicDir, 'icon');

const iconSvg = readFileSync(join(iconDir, 'icon.svg'));
for (const size of [16, 48, 128]) {
  const out = join(iconDir, `${size}.png`);
  const data = await sharp(iconSvg).resize(size, size).png().toBuffer();
  writeFileSync(out, data);
  console.log(`wrote ${out} (${data.length} bytes)`);
}

const ogSvg = readFileSync(join(publicDir, 'og-image.svg'));
const ogOut = join(publicDir, 'og-image.png');
const ogData = await sharp(ogSvg).resize(640, 320).png().toBuffer();
writeFileSync(ogOut, ogData);
console.log(`wrote ${ogOut} (${ogData.length} bytes)`);
