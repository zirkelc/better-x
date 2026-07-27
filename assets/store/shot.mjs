import { execFileSync } from 'node:child_process';
import { dirname, isAbsolute, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

/** Background used for the transparent margins of every render. */
export const CANVAS_BG = '#0f1419';

/**
 * Render a URL to an exact-size PNG via headless Chrome.
 * Sizes are CSS pixels; the PNG comes out at the same pixel size.
 */
export function shot(url, out, w = 1280, h = 800) {
  const target = isAbsolute(out) ? out : join(HERE, out);
  execFileSync(
    CHROME,
    [
      '--headless=new',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
      `--default-background-color=${CANVAS_BG.replace('#', '')}ff`,
      `--screenshot=${target}`,
      `--window-size=${w},${h}`,
      url,
    ],
    { stdio: 'ignore' },
  );
  console.log('wrote', target, `${w}x${h}`);
  return target;
}

/** CLI: node shot.mjs <url> <out.png> [width] [height] */
const [, , url, out, w, h] = process.argv;
if (url && out) {
  shot(url, out, w ? Number(w) : 1280, h ? Number(h) : 800);
}
