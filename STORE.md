# Chrome Web Store listing

Reference for the CWS developer dashboard submission. Not shipped in the extension.

## Package

- Build: `pnpm zip`
- Artifact: `.output/better-x-<version>-chrome.zip` (currently `better-x-1.1.0-chrome.zip`, 16.3 kB)
- Version lives in `package.json`; WXT copies it into the generated manifest.
- Firefox build (not part of this submission): `pnpm zip:firefox`

The manifest `description` in `wxt.config.ts` is kept identical to the summary below, since
the CWS pre-fills the short description from it. Keep the two in sync.

---

# Store listing tab

**Item name** (max 75 chars) — 8 chars

```
Better X
```

**Summary / short description** (max 132 chars) — 103 chars

```
Character counter, word and selection tooltips, code formatting, and open-in-new-tab buttons for x.com.
```

**Detailed description** (max 16,000 chars)

```
Better X adds five small, self-contained upgrades to x.com. Nothing is replaced, nothing is hidden, and every feature is a toggle you can turn off. A master switch in the popup turns the whole extension off at once.

CHARACTER COUNTER
A live count sits next to X's own progress ring in the composer, so you can see exactly how many characters you have used without decoding a circle. It mounts when you start typing and disappears when you clear the box.

WORD AND SELECTION TOOLTIPS
Hover any word in the composer to see what it costs in characters. Select a phrase and the tooltip switches to counting the selection, which makes trimming a post to fit far less of a guessing game.

CODE FORMATTER
X renders posts as plain text, so code loses its shape. Better X adds two buttons to X's own selection toolbar, next to Bold and Italic: </> converts the selection to Mathematical Monospace Unicode, and Aa converts it back to regular ASCII. The result is real text, so it stays selectable, copyable, and searchable, unlike a screenshot.

NO LINK
X turns every domain it sees, like example.ai, into a link, even when you only want to name it. The No link button in the same selection toolbar stops that: it places an invisible zero-width non-joiner after the dot, so the text looks the same but is not linked. Click it again on the same selection to make the domains linkable again.

OPEN POST IN NEW TAB
Every post header gets a link next to the More menu that opens the post in a background tab, so you keep your place in the timeline. It is a real <a target="_blank"> element, so middle-click and Cmd-click or Ctrl-click behave exactly as you expect. The same action is also available from the right-click menu on any post.

PRIVACY
Better X makes no network requests. It collects no data, has no analytics, and needs no account. The only thing it stores is your on/off toggles, via Chrome's settings sync. All code ships inside the package; nothing is loaded remotely.

Open source: https://github.com/zirkelc/better-x
```

**Category:** Social Networking
_(alternative if you prefer to file it as a utility: Functionality & UI)_

**Language:** English

**Official / Homepage URL:** https://github.com/zirkelc/better-x

**Support URL:** https://github.com/zirkelc/better-x/issues

**Mature content:** No

## Graphic assets

All in `assets/store/`, produced at exact CWS sizes (see `assets/store/README.md` to regenerate).

| Field                 | File           | Size     |
| --------------------- | -------------- | -------- |
| Store icon            | `icon-128.png` | 128×128  |
| Screenshot 1          | `counter.png`  | 1280×800 |
| Screenshot 2          | `tooltip.png`  | 1280×800 |
| Screenshot 3          | `formatter.png`| 1280×800 |
| Screenshot 4          | `opener.png`   | 1280×800 |
| Screenshot 5          | `popup.png`    | 1280×800 |
| Small promo tile      | `tile.png`     | 440×280  |
| Marquee promo tile    | `marquee.png`  | 1400×560 |

The screenshots are real captures from x.com, framed on a shared dark canvas. Upload them
in the order above; the first one is what shows in search results.

---

# Privacy tab

**Single purpose**

```
Add small, optional UI enhancements to x.com: a character counter and word/selection tooltips in the post composer, monospace formatting and link-suppression buttons for the current selection, and a link that opens a post in a new tab.
```

**Permission justifications**

| Permission                                       | Justification |
| ------------------------------------------------ | ------------- |
| `storage`                                         | Persist the user's on/off toggles (a master switch and one per feature) via `chrome.storage.sync`. No other data is stored. |
| `contextMenus`                                    | Add a single "Open Post in New Tab" entry to the right-click menu, shown only on x.com and twitter.com pages and only when the cursor is over a post. |
| Host access to `https://x.com/*`, `https://twitter.com/*` (content script `matches`) | The extension's entire function is drawing UI into the x.com composer and post headers, which requires running a content script on those pages. It is used for nothing else and no data leaves the page. |

Note: the extension declares no `host_permissions` key. The host access comes from the
content script's `matches`, which the review form still asks you to justify.

**Are you using remote code?** No — all code is bundled in the package.

**Data usage disclosures**

- Personally identifiable information: **not collected**
- Health information: **not collected**
- Financial and payment information: **not collected**
- Authentication information: **not collected**
- Personal communications: **not collected**
- Location: **not collected**
- Web history: **not collected**
- User activity: **not collected**
- Website content: **not collected** — the composer text and selection are read in-page to
  render the counter and tooltips, and are never transmitted or stored
- Certifications: tick all three (no unrelated selling, no unrelated use/transfer, no
  creditworthiness/lending use)

**Privacy policy URL**

```
https://github.com/zirkelc/better-x/blob/main/PRIVACY.md
```

---

# Distribution tab

- **Visibility:** Public
- **Distribution:** All regions
- **Pricing:** Free

---

## Known review risks

- **Trademark.** "Better X" plus a stylized X mark sits close to X Corp branding. The
  listing never claims affiliation, and the icon is a two-color X, not X's logo. If the
  reviewer objects, the fallback is a rename plus a plainer mark rather than a code change.
- **`twitter.com` matches.** The content script still matches `twitter.com`, which now
  redirects to `x.com`. Harmless, but it widens the host permission; drop it if the
  reviewer asks why both are needed.

## Submitting (manual — needs your Google login)

1. Sign in at the CWS developer dashboard and create a new item.
2. Upload `.output/better-x-1.1.0-chrome.zip`.
3. Paste the Store listing fields above; upload the graphic assets from `assets/store/`.
4. Fill the Privacy tab: single purpose, permission justifications, data disclosures,
   privacy policy URL.
5. Set the Distribution tab, then submit for review.
