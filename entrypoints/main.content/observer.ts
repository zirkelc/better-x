import { SELECTORS } from '../../utils/constants';
import type { Settings } from '../../utils/settings';
import { initCharacterCounter } from './character-counter';
import { initCodeFormatter } from './code-formatter';
import { initAllPostOpenButtons } from './post-opener';
import { initWordOverlay } from './word-overlay';

type Cleanup = () => void;

export function startObserver(settings: Settings): () => void {
  const cleanups: Array<Cleanup> = [];
  let codeFormatterCleanup: Cleanup | null = null;

  const wantsTextareaFeatures = settings.characterCounter || settings.wordOverlay;

  function initializeTextarea(textarea: Element): void {
    if (settings.characterCounter) {
      const c = initCharacterCounter(textarea);
      if (c) cleanups.push(c);
    }
    if (settings.wordOverlay) {
      const c = initWordOverlay(textarea);
      if (c) cleanups.push(c);
    }
  }

  function checkForTextareas(): void {
    if (!wantsTextareaFeatures) return;
    const textareas = document.querySelectorAll(SELECTORS.TEXTAREA);
    textareas.forEach(initializeTextarea);
    if (textareas.length === 0) {
      const fallbacks = document.querySelectorAll(SELECTORS.TEXTBOX_FALLBACK);
      fallbacks.forEach(initializeTextarea);
    }
  }

  function checkForArticles(): void {
    if (!settings.openInNewTabButton) return;
    initAllPostOpenButtons();
  }

  let scanHandle: number | null = null;

  /**
   * Coalesce the scans to one pass per frame. Both scans are idempotent —
   * every element they touch carries an init marker — so running one more
   * often than strictly needed costs three selector queries.
   */
  function scheduleScan(): void {
    if (scanHandle !== null) return;
    scanHandle = requestAnimationFrame(() => {
      scanHandle = null;
      checkForTextareas();
      checkForArticles();
    });
  }

  const observer = new MutationObserver((mutations) => {
    /**
     * Any inserted element is a reason to rescan. Matching the inserted node
     * against the elements we mount onto would miss the common case: a post
     * arrives in one batch and the parts we attach to (its More menu, the
     * compose progress ring) arrive in a later one, so the batch that
     * completes the post carries no node we would recognise, and the post is
     * never picked up again.
     */
    const hasAddedElements = mutations.some(
      (mutation) =>
        mutation.type === 'childList' &&
        Array.from(mutation.addedNodes).some(
          (node) => node.nodeType === Node.ELEMENT_NODE,
        ),
    );

    if (hasAddedElements) {
      scheduleScan();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  checkForTextareas();
  checkForArticles();

  if (settings.codeFormatter) {
    codeFormatterCleanup = initCodeFormatter();
  }

  return () => {
    observer.disconnect();
    if (scanHandle !== null) {
      cancelAnimationFrame(scanHandle);
      scanHandle = null;
    }
    cleanups.forEach((c) => c());
    cleanups.length = 0;
    if (codeFormatterCleanup) {
      codeFormatterCleanup();
      codeFormatterCleanup = null;
    }
  };
}
