const POST_PATH_REGEX = /^\/[^/]+\/status\/\d+/;

/**
 * True when the current pathname is a post detail page like /<user>/status/<id>.
 */
function isPostPage(): boolean {
  return POST_PATH_REGEX.test(location.pathname);
}

/**
 * Find the canonical post URL for the article enclosing the given event target.
 * The timestamp link (the parent of <time>) is the stable per-post anchor.
 */
function findTweetUrl(target: EventTarget | null): string | null {
  if (!(target instanceof Element)) return null;
  const article = target.closest('article[data-testid="tweet"]');
  if (!article) return null;
  const time = article.querySelector('time');
  const link = time?.parentElement;
  if (link instanceof HTMLAnchorElement && link.href) {
    return link.href;
  }
  return null;
}

function handleContextMenu(event: MouseEvent): void {
  const url = isPostPage() ? null : findTweetUrl(event.target);
  void browser.runtime
    .sendMessage({ type: 'better-x:tweet-url', url })
    .catch(() => {
      /** Service worker may be unavailable on some pages; ignore. */
    });
}

export function initPostContextMenu(): () => void {
  document.addEventListener('contextmenu', handleContextMenu, true);
  return () => {
    document.removeEventListener('contextmenu', handleContextMenu, true);
  };
}
