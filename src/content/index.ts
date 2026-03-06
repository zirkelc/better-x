import { cleanupCodeFormatter } from './code-formatter';
import { startObserver } from './observer';
import { cleanupWordOverlayTooltip } from './word-overlay';

console.log('[Better X] Content script loaded');

/** Start observing for tweet compose areas */
const stopObserver = startObserver();

/** Cleanup on page unload */
window.addEventListener('unload', () => {
  stopObserver();
  cleanupWordOverlayTooltip();
  cleanupCodeFormatter();
});
