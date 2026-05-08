import {
  CHAR_LIMIT,
  CLASS_PREFIX,
  SELECTORS,
  WARNING_THRESHOLD,
} from '../../utils/constants';
import { getCharCount } from '../../utils/text';

const COUNTER_CLASS = `${CLASS_PREFIX}-counter`;

type Placement = { container: Element; before: Element | null; circle: Element };

type CounterState = { element: HTMLElement; cleanup: () => void };

/**
 * Per-textarea counter state. Used to dedupe re-init calls and to tear the
 * counter down again when the progress circle disappears (i.e. the user
 * cleared the textarea or closed the composer).
 */
const stateByTextarea = new WeakMap<Element, CounterState>();

function getTextFromTextarea(textarea: Element): string {
  return textarea.textContent || '';
}

function getCounterState(used: number): 'normal' | 'warning' | 'over' {
  const remaining = CHAR_LIMIT - used;
  if (remaining < 0) return 'over';
  if (remaining <= WARNING_THRESHOLD) return 'warning';
  return 'normal';
}

function createCounterElement(): HTMLElement {
  const counter = document.createElement('div');
  counter.className = COUNTER_CLASS;
  counter.setAttribute('role', 'status');
  counter.setAttribute('aria-live', 'polite');
  return counter;
}

function updateCounter(counter: HTMLElement, text: string): void {
  const used = getCharCount(text);
  counter.textContent = String(used);
  counter.dataset.state = getCounterState(used);
}

/**
 * Find the highest ancestor of `textarea` that doesn't yet include another
 * composer's textarea. That ancestor is the textarea's exclusive composer
 * scope — modal vs. inline, separated by the moment one's subtree would
 * absorb the other's textarea on the way up.
 */
function getComposerScope(textarea: Element): Element {
  const otherTextareasSelector = `${SELECTORS.TEXTAREA}, ${SELECTORS.TEXTBOX_FALLBACK}`;
  let scope: Element = textarea;
  let parent: Element | null = textarea.parentElement;
  while (parent) {
    const found = parent.querySelectorAll(otherTextareasSelector);
    let hasOther = false;
    for (let i = 0; i < found.length; i++) {
      if (found[i] !== textarea) {
        hasOther = true;
        break;
      }
    }
    if (hasOther) break;
    scope = parent;
    parent = parent.parentElement;
  }
  return scope;
}

/**
 * Look for `selector` strictly inside the textarea's composer scope. With
 * both modal and inline composers mounted, each scope contains only its own
 * textarea, so a textarea cannot accidentally pair with a foreign circle.
 */
function findScopedTarget(
  textarea: Element,
  selector: string,
): Element | null {
  return getComposerScope(textarea).querySelector(selector);
}

/**
 * Placement: in the action row that holds the countdown circle and the Post
 * button. Walks up from the circle until reaching a row with multiple
 * children, then inserts before the circle's wrapper so the counter sits to
 * its left. Returns null when the circle isn't mounted in the textarea's
 * ancestor tree — keeps the counter from appearing before the user types.
 */
function findPlacement(textarea: Element): Placement | null {
  const circle = findScopedTarget(textarea, SELECTORS.COUNTDOWN_CIRCLE);
  if (!circle) return null;

  let row: Element | null = circle.parentElement;
  while (row && row.children.length === 1) {
    row = row.parentElement;
  }
  if (!row) return null;

  const circleSubtree = Array.from(row.children).find((c) => c.contains(circle));
  if (!circleSubtree) return null;
  return { container: row, before: circleSubtree, circle };
}

export function initCharacterCounter(textarea: Element): (() => void) | null {
  const placement = findPlacement(textarea);
  if (!placement) return null;

  const existing = stateByTextarea.get(textarea);
  if (existing && existing.element.parentElement === placement.container) {
    /** Already in the right row. Keep the existing cleanup. */
    return null;
  }
  if (existing) {
    existing.cleanup();
  }

  const counter = createCounterElement();
  placement.container.insertBefore(counter, placement.before);
  updateCounter(counter, getTextFromTextarea(textarea));

  const textObserver = new MutationObserver(() => {
    updateCounter(counter, getTextFromTextarea(textarea));
  });
  textObserver.observe(textarea, {
    childList: true,
    subtree: true,
    characterData: true,
  });

  const handleInput = () => {
    updateCounter(counter, getTextFromTextarea(textarea));
  };
  textarea.addEventListener('input', handleInput);

  /**
   * Watch the row holding the circle. If X removes the circle (user cleared
   * the textarea, or the composer closed), tear the counter down with it.
   */
  const circleObserver = new MutationObserver(() => {
    if (!placement.container.contains(placement.circle)) {
      cleanup();
    }
  });
  circleObserver.observe(placement.container, {
    childList: true,
    subtree: true,
  });

  const cleanup = () => {
    textObserver.disconnect();
    circleObserver.disconnect();
    textarea.removeEventListener('input', handleInput);
    counter.remove();
    stateByTextarea.delete(textarea);
  };

  stateByTextarea.set(textarea, { element: counter, cleanup });
  return cleanup;
}
