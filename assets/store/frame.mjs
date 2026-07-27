import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { shot } from './shot.mjs';

/**
 * Composes the raw x.com captures in `raw/` into the five 1280x800 Chrome Web
 * Store screenshots. Every shot shares one layout: an eyebrow + headline over a
 * framed capture on a dark canvas, so the listing reads as a single set.
 */
const HERE = dirname(fileURLToPath(import.meta.url));

const W = 1280;
const H = 800;

/** Every capture is framed at this width so the five shots stay consistent. */
const PANEL_W = 880;

const SHOTS = [
  {
    out: 'counter.png',
    eyebrow: 'Character counter',
    headline: 'Know how much room is left',
    sub: 'A live count next to X’s progress ring. Appears when you start typing, gone when you clear the box.',
    panels: [
      {
        src: 'raw/counter.png',
        w: 840,
        h: 355,
        cropTop: 8,
        cropRight: 10,
        highlight: { x: 570, y: 321, r: 26 },
      },
    ],
  },
  {
    out: 'tooltip.png',
    eyebrow: 'Word & selection tooltips',
    headline: 'Price every word before you commit',
    sub: 'Hover a word for its character cost. Select a phrase and the tooltip counts the selection instead.',
    panels: [
      { src: 'raw/tooltip.png', w: 598, h: 185, cropBottom: 52, cropRight: 8, width: 800 },
    ],
  },
  {
    out: 'formatter.png',
    eyebrow: 'Code formatter',
    headline: 'Post code that survives plain text',
    sub: 'Two extra buttons in X’s own selection toolbar convert between ASCII and Mathematical Monospace.',
    panels: [
      {
        src: 'raw/formatter-before.png',
        w: 598,
        h: 185,
        cropBottom: 52,
        width: 660,
        caption: 'Select a snippet, hit </>',
      },
      {
        src: 'raw/formatter-after.png',
        w: 598,
        h: 185,
        cropBottom: 52,
        width: 660,
        caption: 'Monospace, and it survives X’s plain-text rendering',
      },
    ],
  },
  {
    out: 'opener.png',
    eyebrow: 'Open in new tab',
    headline: 'Keep your place in the timeline',
    sub: 'A real link next to the More menu, so middle-click and ⌘-click work exactly as you expect.',
    panels: [
      {
        src: 'raw/opener.png',
        w: 1173,
        h: 103,
        width: 1080,
        highlight: { x: 1124, y: 32, r: 26 },
        caption: 'Added to every post header, in the timeline and on profiles',
      },
    ],
  },
  {
    out: 'popup.png',
    eyebrow: 'Settings',
    headline: 'Every feature is a toggle',
    sub: 'Turn off what you don’t want. No account, no tracking, no network requests.',
    panels: [{ src: 'raw/popup.png', w: 560, h: 536, plain: true, width: 420 }],
  },
];

const escapeHtml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function panelHtml(panel) {
  const displayW = panel.width ?? PANEL_W;
  const cropTop = panel.cropTop ?? 0;
  const cropBottom = panel.cropBottom ?? 0;
  const cropRight = panel.cropRight ?? 0;
  const scale = displayW / (panel.w - cropRight);
  const displayH = Math.round((panel.h - cropTop - cropBottom) * scale);
  /** Ring coordinates are given in raw-capture pixels and scaled with the frame. */
  const ring = panel.highlight
    ? `<span class="ring" style="left:${Math.round((panel.highlight.x - panel.highlight.r) * scale)}px;
         top:${Math.round((panel.highlight.y - cropTop - panel.highlight.r) * scale)}px;
         width:${Math.round(panel.highlight.r * 2 * scale)}px;
         height:${Math.round(panel.highlight.r * 2 * scale)}px"></span>`
    : '';
  const frame = `
    <div class="frame${panel.plain ? ' plain' : ''}" style="width:${displayW}px;height:${displayH}px">
      <img src="file://${join(HERE, panel.src)}"
           style="width:${Math.round(panel.w * scale)}px;margin-top:${-Math.round(cropTop * scale)}px">
      ${ring}
    </div>`;
  if (!panel.caption) return frame;
  return `<div class="panel">${frame}<div class="caption">${escapeHtml(panel.caption)}</div></div>`;
}

function buildHtml(spec) {
  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
  html,body{margin:0;padding:0}
  body{
    width:${W}px;height:${H}px;box-sizing:border-box;padding:56px 64px 64px;
    display:flex;flex-direction:column;overflow:hidden;
    background:linear-gradient(160deg,#0f1419 0%,#15202b 100%);
    color:#e7e9ea;
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;
    -webkit-font-smoothing:antialiased;
  }
  .eyebrow{font-size:14px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#1d9bf0}
  h1{margin:12px 0 0;font-size:38px;line-height:1.15;font-weight:800;letter-spacing:-.02em}
  .sub{margin-top:12px;font-size:17px;line-height:1.45;color:#8b98a5;max-width:900px}
  .stage{flex:1;min-height:0;margin-top:36px;display:flex;flex-direction:column;
    align-items:center;justify-content:center;gap:26px}
  .panel{display:flex;flex-direction:column;align-items:center;gap:10px}
  .caption{font-size:14px;color:#71767b}
  .frame{position:relative;overflow:hidden;border:1px solid rgba(231,233,234,.14);border-radius:14px;
    box-shadow:0 18px 44px rgba(0,0,0,.45);background:#000}
  .frame.plain{background:transparent;border-color:rgba(231,233,234,.10)}
  .frame img{display:block}
  .ring{position:absolute;border:2px solid #1d9bf0;border-radius:50%;
    box-shadow:0 0 0 5px rgba(29,155,240,.18)}
</style></head>
<body>
  <div class="eyebrow">${spec.eyebrow}</div>
  <h1>${spec.headline}</h1>
  <div class="sub">${spec.sub}</div>
  <div class="stage">${spec.panels.map(panelHtml).join('')}</div>
</body></html>`;
}

for (const spec of SHOTS) {
  const htmlPath = join(HERE, `.build-${spec.out.replace(/\.png$/, '')}.html`);
  writeFileSync(htmlPath, buildHtml(spec));
  shot(`file://${htmlPath}`, spec.out, W, H);
}
