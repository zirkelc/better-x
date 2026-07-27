# Store assets

Art for the Chrome Web Store listing, checked into the repo. See `../../STORE.md` for
which file goes in which dashboard field.

The five screenshots share one layout: a dark 1280×800 canvas with an eyebrow, a headline
and a one-line subhead above a framed capture, so the listing reads as one set. The
captures themselves are real, unretouched crops of x.com with the extension running.

## Files

| File            | Size     | CWS slot                                              |
| --------------- | -------- | ----------------------------------------------------- |
| `counter.png`   | 1280×800 | Screenshot — character counter in the composer        |
| `tooltip.png`   | 1280×800 | Screenshot — hover tooltip on a word                  |
| `formatter.png` | 1280×800 | Screenshot — `</>` in X's selection toolbar, before/after |
| `opener.png`    | 1280×800 | Screenshot — open-in-new-tab link, hovered and at rest |
| `popup.png`     | 1280×800 | Screenshot — the settings popup                       |
| `icon-128.png`  | 128×128  | Store icon (copy of `public/icon/128.png`)            |
| `tile.png`      | 440×280  | Small promo tile                                      |
| `marquee.png`   | 1400×560 | Marquee promo (featured listings)                     |

## Regenerate

```sh
# All five screenshots, from the captures in raw/
node frame.mjs

# Promo art
node shot.mjs "file://$PWD/tile.html"    tile.png    440 280
node shot.mjs "file://$PWD/marquee.html" marquee.png 1400 560

# Settings popup capture (feeds frame.mjs; re-run after changing the popup)
node shot.mjs "file://$PWD/popup.html"   raw/popup.png 560 536

# Store icon
cp ../../public/icon/128.png icon-128.png
```

`shot.mjs` renders any URL to an exact-size PNG with headless Chrome. `frame.mjs` holds the
copy and layout for every screenshot and composes the raw captures into the final canvases;
it writes throwaway `.build-*.html` files next to itself.

## raw/

Source captures, at 1:1 CSS pixels.

| File                    | Size    | How it was taken                                                  |
| ----------------------- | ------- | ----------------------------------------------------------------- |
| `counter.png`           | 840×355 | x.com composer with text, page zoomed 1.4× for extra pixels        |
| `tooltip.png`           | 598×185 | composer at 1× with a word hovered                                 |
| `formatter-before.png`  | 598×185 | a snippet selected, X's toolbar showing `B I </> Aa`               |
| `formatter-after.png`   | 598×185 | the same snippet after clicking `</>`                              |
| `opener.png`            | 1173×103 | header strip of the post announcing the extension, link hovered, page zoomed 2× |
| `popup.png`             | 560×536 | rendered from `popup.html`                                         |

The composer captures with tooltips are taken at 1× on purpose: the tooltip and the word
highlight are absolutely positioned against viewport coordinates, and CSS `zoom` shifts
them out of alignment. Features that sit in normal document flow (the counter, the toolbar
buttons, the header link) are safe to capture zoomed.

For the 2× header strip, X's left nav and its floating Grok/DM buttons were hidden first
(`header[role="banner"]`, `[data-testid="GrokDrawerHeader"]`, `[aria-label="Grok"]`,
`[data-testid="DMDrawerHeader"]`), otherwise the main column overflows the viewport at that
zoom and the floating buttons bleed into the crop.

The post in `opener.png` is https://x.com/zirkelc_/status/2054537652595011933, the one
announcing the extension. It was located by searching `from:zirkelc_ monospace` — a term that
only appears further down the post, so X's search highlighting does not bold anything inside
the cropped strip. Note the button is deliberately not injected on a post's own permalink page,
so a search or timeline view is the only place to capture it.

This capture was taken before the render-order fix in `observer.ts`, when a quiet page could
leave posts without the button until something else mutated the DOM. If you reshoot it, that
workaround is no longer needed.

`popup.html` is a static stand-in for the real popup, because the extension popup cannot be
rendered outside Chrome's extension context. It links the shipped
`entrypoints/popup/style.css` so the styling cannot drift; only the four labels and the hint
line are duplicated. Keep them in sync with `FEATURE_LABELS` in `utils/settings.ts`.

To reshoot the x.com captures: load the unpacked build (`pnpm build`, then Load unpacked on
`.output/chrome-mv3`), sign in to x.com, set up the state you want, and crop the region at
1:1. Then update the crop numbers and the `highlight` ring coordinates in `frame.mjs` — both
are expressed in raw-capture pixels.
