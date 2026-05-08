import { CLASS_PREFIX, POST_PATH_REGEX, SELECTORS } from '../../utils/constants';

const OPENER_CLASS = `${CLASS_PREFIX}-opener`;
const OPENER_INIT_ATTR = 'data-better-x-opener-init';

/** Material "open in new" icon, fits X's icon set at 18px. */
const ICON_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7zM5 5h6V3H3v18h18v-8h-2v6H5V5z"/></svg>';

function isPostPage(): boolean {
  return POST_PATH_REGEX.test(location.pathname);
}

/**
 * Read the canonical post URL from the article. The timestamp link (parent of
 * <time>) is the stable per-post anchor that X renders in every tweet card.
 */
function getPostUrl(article: Element): string | null {
  const time = article.querySelector('time');
  const link = time?.parentElement;
  if (link instanceof HTMLAnchorElement && link.href) {
    return link.href;
  }
  return null;
}

/**
 * Insert the opener as the immediate next sibling of the caret button so the
 * visual order is [More][opener]. The caret's direct parent is X's icon-button
 * wrapper, already a flex container.
 */
function findInsertionPoint(
  caret: Element,
): { container: Element; before: Element | null } | null {
  const container = caret.parentElement;
  if (!container) return null;
  return { container, before: caret.nextElementSibling };
}

function createOpenerButton(url: string): HTMLAnchorElement {
  const a = document.createElement('a');
  a.className = OPENER_CLASS;
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.setAttribute('aria-label', 'Open post in new tab');
  a.title = 'Open post in new tab';
  a.innerHTML = ICON_SVG;
  /** Block X's article-level click handler so it doesn't navigate the current tab. */
  const stop = (e: Event) => e.stopPropagation();
  a.addEventListener('click', stop);
  a.addEventListener('mousedown', stop);
  a.addEventListener('mouseup', stop);
  return a;
}

export function initPostOpenButton(article: Element): void {
  if (article.hasAttribute(OPENER_INIT_ATTR)) return;
  const url = getPostUrl(article);
  if (!url) return;
  const caret = article.querySelector(SELECTORS.CARET);
  if (!caret) return;
  const placement = findInsertionPoint(caret);
  if (!placement) return;

  const button = createOpenerButton(url);
  placement.container.insertBefore(button, placement.before);
  article.setAttribute(OPENER_INIT_ATTR, '1');
}

export function initAllPostOpenButtons(): void {
  if (isPostPage()) return;
  const articles = document.querySelectorAll(SELECTORS.ARTICLE);
  articles.forEach(initPostOpenButton);
}
