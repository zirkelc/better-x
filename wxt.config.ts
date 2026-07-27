import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    name: 'Better X',
    description:
      'Character counter, word and selection tooltips, code formatting, and open-in-new-tab buttons for x.com.',
    permissions: ['contextMenus', 'storage'],
  },
  /** Don't auto-launch a fresh Chrome on `pnpm dev`. Use your existing browser. */
  webExt: {
    disabled: true,
  },
});
