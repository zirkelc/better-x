import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    name: 'Better X',
    description: 'Enhances X/Twitter post composer with character counting and word/line tooltips',
    permissions: ['contextMenus', 'storage'],
  },
  /** Don't auto-launch a fresh Chrome on `pnpm dev`. Use your existing browser. */
  webExt: {
    disabled: true,
  },
});
