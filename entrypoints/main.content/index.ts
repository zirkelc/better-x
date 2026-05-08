import { getSettings } from '../../utils/settings';
import { cleanupCodeFormatter } from './code-formatter';
import { startObserver } from './observer';
import { initPostContextMenu } from './post-context-menu';
import './style.css';
import { cleanupWordOverlayTooltip } from './word-overlay';

export default defineContentScript({
  matches: ['https://x.com/*', 'https://twitter.com/*'],
  runAt: 'document_idle',
  cssInjectionMode: 'manifest',
  async main() {
    const settings = await getSettings();
    console.log('[Better X] Content script loaded', settings);

    const stopObserver = startObserver(settings);
    const stopPostContextMenu = settings.contextMenu ? initPostContextMenu() : null;

    window.addEventListener('unload', () => {
      stopObserver();
      stopPostContextMenu?.();
      cleanupWordOverlayTooltip();
      cleanupCodeFormatter();
    });
  },
});
