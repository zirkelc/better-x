import { SELECTORS } from '../utils/constants';
import { initCharacterCounter } from './character-counter';
import { initCodeFormatter } from './code-formatter';
import { initWordOverlay } from './word-overlay';

type Cleanup = () => void;

const cleanups: Array<Cleanup> = [];

/** Global features (not per-textarea) */
let codeFormatterCleanup: Cleanup | null = null;

/**
 * Initialize features for a new textarea
 */
function initializeTextarea(textarea: Element): void {
  const counterCleanup = initCharacterCounter(textarea);
  if (counterCleanup) {
    cleanups.push(counterCleanup);
  }

  const wordOverlayCleanup = initWordOverlay(textarea);
  if (wordOverlayCleanup) {
    cleanups.push(wordOverlayCleanup);
  }
}

/**
 * Check for new textareas and initialize them
 */
function checkForTextareas(): void {
  /** Try primary selector */
  const textareas = document.querySelectorAll(SELECTORS.TEXTAREA);
  textareas.forEach(initializeTextarea);

  /** Fallback selector if primary not found */
  if (textareas.length === 0) {
    const fallbacks = document.querySelectorAll(SELECTORS.TEXTBOX_FALLBACK);
    fallbacks.forEach(initializeTextarea);
  }
}

/**
 * Create MutationObserver to watch for DOM changes
 */
export function createObserver(): MutationObserver {
  const observer = new MutationObserver((mutations) => {
    /** Check if any mutation added nodes that might contain our target */
    const shouldCheck = mutations.some((mutation) => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        return Array.from(mutation.addedNodes).some((node) => {
          if (node.nodeType !== Node.ELEMENT_NODE) {
            return false;
          }
          const element = node as Element;
          /** Check if the node itself or any children match our selectors */
          return (
            element.matches?.(SELECTORS.TEXTAREA) ||
            element.matches?.(SELECTORS.TEXTBOX_FALLBACK) ||
            element.querySelector?.(SELECTORS.TEXTAREA) ||
            element.querySelector?.(SELECTORS.TEXTBOX_FALLBACK)
          );
        });
      }
      return false;
    });

    if (shouldCheck) {
      checkForTextareas();
    }
  });

  return observer;
}

/**
 * Start observing the document
 */
export function startObserver(): () => void {
  const observer = createObserver();

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  /** Initial check */
  checkForTextareas();

  /** Initialize global features */
  codeFormatterCleanup = initCodeFormatter();

  /** Return cleanup function */
  return () => {
    observer.disconnect();
    cleanups.forEach((cleanup) => cleanup());
    cleanups.length = 0;
    if (codeFormatterCleanup) {
      codeFormatterCleanup();
      codeFormatterCleanup = null;
    }
  };
}
