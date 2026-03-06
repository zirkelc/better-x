import {
  CHAR_LIMIT,
  CLASS_PREFIX,
  DATA_INITIALIZED,
  SELECTORS,
  WARNING_THRESHOLD,
} from '../utils/constants';
import { getCharCount } from '../utils/text';

const COUNTER_CLASS = `${CLASS_PREFIX}-counter`;

/**
 * Extract text content from the tweet textarea
 */
function getTextFromTextarea(textarea: Element): string {
  return textarea.textContent || '';
}

/**
 * Get counter state based on remaining characters
 */
function getCounterState(used: number): 'normal' | 'warning' | 'over' {
  const remaining = CHAR_LIMIT - used;
  if (remaining < 0) {
    return 'over';
  }
  if (remaining <= WARNING_THRESHOLD) {
    return 'warning';
  }
  return 'normal';
}

/**
 * Create the counter element
 */
function createCounterElement(): HTMLElement {
  const counter = document.createElement('div');
  counter.className = COUNTER_CLASS;
  counter.setAttribute('role', 'status');
  counter.setAttribute('aria-live', 'polite');
  return counter;
}

/**
 * Update counter display with "used / 280" format
 */
function updateCounter(counter: HTMLElement, text: string): void {
  const used = getCharCount(text);
  const state = getCounterState(used);

  counter.textContent = `${used} / ${CHAR_LIMIT}`;
  counter.dataset.state = state;
}

/**
 * Find the unsent (Drafts) button to insert counter before
 */
function findUnsentButton(textarea: Element): Element | null {
  let current = textarea.parentElement;

  while (current) {
    const unsentButton = current.querySelector(SELECTORS.UNSENT_BUTTON);
    if (unsentButton) {
      return unsentButton;
    }
    current = current.parentElement;
  }

  return null;
}

/**
 * Initialize character counter for a textarea
 */
export function initCharacterCounter(textarea: Element): (() => void) | null {
  /** Check if already initialized */
  if (textarea.hasAttribute(DATA_INITIALIZED)) {
    return null;
  }

  const unsentButton = findUnsentButton(textarea);
  if (!unsentButton) {
    console.debug('[Better X] Unsent button not found, trying toolbar fallback');
    return initCharacterCounterFallback(textarea);
  }

  const parent = unsentButton.parentElement;
  if (!parent) {
    return initCharacterCounterFallback(textarea);
  }

  /** Check if counter already exists */
  const existingCounter = parent.querySelector(`.${COUNTER_CLASS}`);
  if (existingCounter) {
    return null;
  }

  /** Create and insert counter before the unsent button */
  const counter = createCounterElement();
  parent.insertBefore(counter, unsentButton);

  /** Initial update */
  updateCounter(counter, getTextFromTextarea(textarea));

  /** Mark as initialized */
  textarea.setAttribute(DATA_INITIALIZED, 'counter');

  /** Set up observers for text changes */
  const observer = new MutationObserver(() => {
    updateCounter(counter, getTextFromTextarea(textarea));
  });

  observer.observe(textarea, {
    childList: true,
    subtree: true,
    characterData: true,
  });

  /** Also listen for input events as a fallback */
  const handleInput = () => {
    updateCounter(counter, getTextFromTextarea(textarea));
  };
  textarea.addEventListener('input', handleInput);

  /** Return cleanup function */
  return () => {
    observer.disconnect();
    textarea.removeEventListener('input', handleInput);
    textarea.removeAttribute(DATA_INITIALIZED);
    counter.remove();
  };
}

/**
 * Fallback: place counter in toolbar if unsent button not found
 */
function initCharacterCounterFallback(textarea: Element): (() => void) | null {
  let current = textarea.parentElement;

  while (current) {
    const toolbar = current.querySelector(SELECTORS.TOOLBAR);
    if (toolbar) {
      const existingCounter = toolbar.querySelector(`.${COUNTER_CLASS}`);
      if (existingCounter) {
        return null;
      }

      const counter = createCounterElement();
      toolbar.insertBefore(counter, toolbar.firstChild);

      updateCounter(counter, getTextFromTextarea(textarea));
      textarea.setAttribute(DATA_INITIALIZED, 'counter');

      const observer = new MutationObserver(() => {
        updateCounter(counter, getTextFromTextarea(textarea));
      });

      observer.observe(textarea, {
        childList: true,
        subtree: true,
        characterData: true,
      });

      const handleInput = () => {
        updateCounter(counter, getTextFromTextarea(textarea));
      };
      textarea.addEventListener('input', handleInput);

      return () => {
        observer.disconnect();
        textarea.removeEventListener('input', handleInput);
        textarea.removeAttribute(DATA_INITIALIZED);
        counter.remove();
      };
    }
    current = current.parentElement;
  }

  console.debug('[Better X] No placement found for counter');
  return null;
}

/**
 * Find and initialize all textareas on the page
 */
export function initAllCounters(): Array<() => void> {
  const cleanups: Array<() => void> = [];

  const textareas = document.querySelectorAll(SELECTORS.TEXTAREA);
  textareas.forEach((textarea) => {
    const cleanup = initCharacterCounter(textarea);
    if (cleanup) {
      cleanups.push(cleanup);
    }
  });

  if (textareas.length === 0) {
    const fallbacks = document.querySelectorAll(SELECTORS.TEXTBOX_FALLBACK);
    fallbacks.forEach((textarea) => {
      const cleanup = initCharacterCounter(textarea);
      if (cleanup) {
        cleanups.push(cleanup);
      }
    });
  }

  return cleanups;
}
