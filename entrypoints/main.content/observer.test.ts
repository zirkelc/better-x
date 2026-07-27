import { afterEach, expect, test } from 'vitest';
import { DEFAULT_SETTINGS } from '../../utils/settings';
import { startObserver } from './observer';

let stopObserver: (() => void) | null = null;

afterEach(() => {
  stopObserver?.();
  stopObserver = null;
  document.body.innerHTML = '';
});

/**
 * Wait long enough for a MutationObserver batch to be delivered and for the
 * scan it schedules to run on the next frame.
 */
function flush(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setTimeout(resolve, 0));
    });
  });
}

/** A post as X first inserts it: permalink present, More menu not yet rendered. */
function createArticle(id: string): HTMLElement {
  const article = document.createElement('article');
  article.setAttribute('data-testid', 'tweet');
  article.innerHTML = `
    <div class="header">
      <a href="https://x.com/zirkelc_/status/${id}"><time datetime="2026-05-13T10:00:00Z">May 13</time></a>
      <div class="actions"></div>
    </div>`;
  return article;
}

/** The More menu, which X renders into the header in a later mutation batch. */
function appendCaret(article: Element): void {
  const button = document.createElement('button');
  button.setAttribute('data-testid', 'caret');
  article.querySelector('.actions')!.appendChild(button);
}

test(`should add the open-in-new-tab button when the post renders before its More menu`, async () => {
  // Arrange
  const timeline = document.createElement('div');
  document.body.appendChild(timeline);
  stopObserver = startObserver({ ...DEFAULT_SETTINGS });

  // Act
  const article = createArticle('2054537652595011933');
  timeline.appendChild(article);
  await flush();
  appendCaret(article);
  await flush();

  // Assert
  const opener = article.querySelector('a.better-x-opener');
  expect(article.querySelectorAll('a.better-x-opener').length).toBe(1);
  expect(opener?.getAttribute('href')).toBe(
    'https://x.com/zirkelc_/status/2054537652595011933',
  );
});

test(`should add the open-in-new-tab button when the post is already complete`, async () => {
  // Arrange
  const timeline = document.createElement('div');
  document.body.appendChild(timeline);
  stopObserver = startObserver({ ...DEFAULT_SETTINGS });

  // Act
  const article = createArticle('2029478703701340633');
  appendCaret(article);
  timeline.appendChild(article);
  await flush();

  // Assert
  expect(article.querySelectorAll('a.better-x-opener').length).toBe(1);
});

test(`should not add a second button when the post re-renders`, async () => {
  // Arrange
  const timeline = document.createElement('div');
  document.body.appendChild(timeline);
  stopObserver = startObserver({ ...DEFAULT_SETTINGS });
  const article = createArticle('2054537652595011933');
  timeline.appendChild(article);
  appendCaret(article);
  await flush();

  // Act
  timeline.appendChild(document.createElement('div'));
  await flush();

  // Assert
  expect(article.querySelectorAll('a.better-x-opener').length).toBe(1);
});
