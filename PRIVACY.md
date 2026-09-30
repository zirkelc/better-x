# Privacy Policy

**Extension:** Better X
**Last updated:** 2026-07-27

## Summary

Better X does not collect, transmit, store, or sell any user data.

## What the extension does

Better X runs only on `x.com` and `twitter.com`. It reads the page you are already
looking at in order to draw its own UI on top of it:

- the text in the post composer, to count characters and measure words
- the current text selection, to count it and to convert it to or from Mathematical
  Monospace Unicode
- the permalink already present in each post, to build an "open in new tab" link

All of this happens locally in your browser. Nothing is sent anywhere.

## What is stored

The only stored data is your feature on/off preferences, saved with
`chrome.storage.sync`. Chrome may sync those preferences between your own signed-in
Chrome profiles. They contain nothing but a few boolean flags (one master switch and one per feature). The extension author
has no access to them.

## What is not done

- No analytics, telemetry, or crash reporting
- No network requests of any kind
- No remote code execution: all code ships inside the extension package
- No accounts, no advertising, no tracking
- No selling or sharing of data with third parties

## Permissions

- `storage` — save your feature toggles
- `contextMenus` — add the "Open Post in New Tab" right-click entry
- Host access to `x.com` / `twitter.com` — required to inject the features into those
  pages, and used for nothing else

## Contact

Questions or issues: https://github.com/zirkelc/better-x/issues
