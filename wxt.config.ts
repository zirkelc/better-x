import { join } from 'node:path';
import { defineConfig } from 'wxt';

/**
 * Orange variant of the icon, swapped in for `pnpm dev` so the dev build and
 * the store build can be installed side by side and told apart.
 */
const DEV_ICON_DIR = join(import.meta.dirname, 'assets', 'icon-dev');

export default defineConfig({
  manifest: ({ command }) => ({
    name: command === 'serve' ? 'Better X (Dev)' : 'Better X',
    description:
      'Character counter, word and selection tooltips, code formatting, and open-in-new-tab buttons for x.com.',
    permissions: ['contextMenus', 'storage'],
  }),
  hooks: {
    'build:publicAssets': (wxt, files) => {
      if (wxt.config.command !== 'serve') return;
      for (const file of files) {
        const match = /^icon\/(\d+\.png)$/.exec(file.relativeDest);
        if (match && 'absoluteSrc' in file) {
          file.absoluteSrc = join(DEV_ICON_DIR, match[1]);
        }
      }
    },
  },
  /** Don't auto-launch a fresh Chrome on `pnpm dev`. Use your existing browser. */
  webExt: {
    disabled: true,
  },
});
