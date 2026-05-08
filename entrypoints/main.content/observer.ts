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

  const observer = new MutationObserver((mutations) => {
    const shouldCheck = mutations.some((mutation) => {
      if (mutation.type !== 'childList' || mutation.addedNodes.length === 0) {
        return false;
      }
      return Array.from(mutation.addedNodes).some((node) => {
        if (node.nodeType !== Node.ELEMENT_NODE) return false;
        const element = node as Element;
        return (
          element.matches?.(SELECTORS.TEXTAREA) ||
          element.matches?.(SELECTORS.TEXTBOX_FALLBACK) ||
          element.matches?.(SELECTORS.ARTICLE) ||
          element.matches?.(SELECTORS.COUNTDOWN_CIRCLE) ||
          element.querySelector?.(SELECTORS.TEXTAREA) ||
          element.querySelector?.(SELECTORS.TEXTBOX_FALLBACK) ||
          element.querySelector?.(SELECTORS.ARTICLE) ||
          element.querySelector?.(SELECTORS.COUNTDOWN_CIRCLE)
        );
      });
    });

    if (shouldCheck) {
      checkForTextareas();
      checkForArticles();
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
    cleanups.forEach((c) => c());
    cleanups.length = 0;
    if (codeFormatterCleanup) {
      codeFormatterCleanup();
      codeFormatterCleanup = null;
    }
  };
}
