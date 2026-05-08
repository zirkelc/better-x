<div align='center'>

<img src="public/icon/128.png" width="96" height="96" alt="Better X icon" />

# Better X

<p align="center">A Chrome extension that adds small but useful enhancements to <a href="https://www.x.com/" alt="X">X.com</a>
</p>

</div>

## Features

- **Character counter** in the post composer, placed next to X's progress circle. Mounts only when you start typing and disappears when you clear the text.
- **Word and selection tooltips** when hovering or selecting text inside the composer. Shows the character count of the hovered word or current selection.
- **Code formatter** buttons that pop up over a text selection, converting between regular ASCII and Mathematical Monospace Unicode (so code-style text survives X's plain-text rendering).
- **Open-in-new-tab button** added to every tweet header, right next to the More menu. Real `<a target="_blank">` so middle-click and Cmd-click also work.

## Requirements

- [pnpm](https://pnpm.io/) (the project pins a version via `packageManager`)
- Node.js 18+

## Build

```bash
pnpm install
pnpm build
```

Output: `.output/chrome-mv3/`.

For Firefox: `pnpm build:firefox` (output `.output/firefox-mv2/`).

To produce a distributable zip: `pnpm zip`.

## Develop

```bash
pnpm dev
```

Watches the source and re-emits `.output/chrome-mv3-dev/` on every change. Connected extension instances hot-reload automatically:

- Content script and CSS edits: HMR, no extension reload.
- `background.ts`, manifest, or permission changes: full extension reload.

The dev server does not auto-launch a browser (`webExt.disabled` is set in `wxt.config.ts`), so you can use your existing logged-in Chrome.

## Load the unpacked extension

1. Open `chrome://extensions`.
2. Toggle **Developer mode** on (top-right).
3. Click **Load unpacked**.
4. Select the build output directory:
   - For `pnpm dev`: `.output/chrome-mv3-dev`
   - For `pnpm build`: `.output/chrome-mv3`
5. Visit [x.com](https://x.com).

When you change source files, the dev workflow auto-reloads. For production builds, click the reload icon on the extension card after each `pnpm build`.

## Project layout

```
entrypoints/
  background.ts                  service worker (context menu)
  popup/                         settings popup (HTML, TS, CSS)
  main.content/                  content script and submodules
utils/                           shared helpers (selectors, settings, text)
public/icon/                     icons (PNG sizes + source SVG)
scripts/generate-icons.mjs       SVG to PNG, run via `pnpm icons`
wxt.config.ts                    manifest config and dev options
```

The extension is built with [WXT](https://wxt.dev/). The `manifest.json` is generated from `wxt.config.ts` plus the entrypoint exports; do not edit a manifest by hand.

## Regenerating the icon

Edit `public/icon/icon.svg`, then:

```bash
pnpm icons
```

This rasterizes the SVG to `16.png`, `48.png`, and `128.png` in the same folder.

## License

MIT
