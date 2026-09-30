import { CLASS_PREFIX } from '../../utils/constants';
import { editSelection, type TextEdit } from './editor-text';

const FORMAT_BTN_CLASS = `${CLASS_PREFIX}-format-btn`;
const GROUP_INJECTED_ATTR = 'data-better-x-format-injected';

/**
 * Zero-width non-joiner. Placed right after the dot of a domain, it stops X
 * from turning the domain into a link while the text looks unchanged.
 */
const ZWNJ = '\u200C';

/** A dot between a letter or digit and a following letter, e.g. `foo.ai`. */
const DOMAIN_DOT_PATTERN = /(?<=[\p{L}\p{N}])\.(?=\p{L})/gu;

/** A dot followed by the zero-width non-joiner that unlinks it. */
const UNLINKED_DOT_PATTERN = new RegExp(`\\.${ZWNJ}`, 'g');

/** Material Design "link_off" icon. */
const UNLINK_ICON_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 7h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1 0 1.43-.98 2.63-2.31 2.98l1.46 1.46C20.88 15.61 22 13.95 22 12c0-2.76-2.24-5-5-5zm-1 4h-2.19l2 2H16zM2 4.27l3.11 3.11C3.29 8.12 2 9.91 2 12c0 2.76 2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1 0-1.59 1.21-2.9 2.76-3.07L8.73 11H8v2h2.73L13 15.27V17h1.73l4.01 4L20 19.74 3.27 3 2 4.27z"/></svg>';

/** Convert a character to Mathematical Monospace Unicode. */
function toMonospace(char: string): string {
  const code = char.charCodeAt(0);
  if (code >= 65 && code <= 90) return String.fromCodePoint(0x1d670 + code - 65);
  if (code >= 97 && code <= 122) return String.fromCodePoint(0x1d68a + code - 97);
  if (code >= 48 && code <= 57) return String.fromCodePoint(0x1d7f6 + code - 48);
  return char;
}

/** Convert a Mathematical Monospace character back to regular ASCII. */
function fromMonospace(char: string): string {
  const code = char.codePointAt(0);
  if (code === undefined) return char;
  if (code >= 0x1d670 && code <= 0x1d689) return String.fromCharCode(65 + code - 0x1d670);
  if (code >= 0x1d68a && code <= 0x1d6a3) return String.fromCharCode(97 + code - 0x1d68a);
  if (code >= 0x1d7f6 && code <= 0x1d7ff) return String.fromCharCode(48 + code - 0x1d7f6);
  return char;
}

/** One edit per character that `convert` changes. */
function charEdits(
  text: string,
  convert: (char: string) => string,
): Array<TextEdit> {
  const edits: Array<TextEdit> = [];
  let offset = 0;
  for (const char of text) {
    const converted = convert(char);
    if (converted !== char) {
      edits.push({ start: offset, end: offset + char.length, insert: converted });
    }
    offset += char.length;
  }
  return edits;
}

export function codeEdits(text: string): Array<TextEdit> {
  return charEdits(text, toMonospace);
}

/**
 * Make unlinked domains linkable again. The dot and the zero-width
 * non-joiner form one grapheme cluster, and the browser does not allow a
 * selection edge between them, so the pair is replaced as a whole.
 */
function relinkEdits(text: string): Array<TextEdit> {
  return Array.from(text.matchAll(UNLINKED_DOT_PATTERN), (match) => ({
    start: match.index,
    end: match.index + 2,
    insert: '.',
  }));
}

/** Convert monospace back to ASCII and make unlinked domains linkable again. */
export function normalEdits(text: string): Array<TextEdit> {
  return [...charEdits(text, fromMonospace), ...relinkEdits(text)];
}

/** Insert a zero-width non-joiner after each domain dot so X does not link it. */
export function unlinkEdits(text: string): Array<TextEdit> {
  return Array.from(text.matchAll(DOMAIN_DOT_PATTERN), (match) => ({
    start: match.index + 1,
    end: match.index + 1,
    insert: ZWNJ,
  }));
}

/**
 * Pick the direction of the link toggle from the selected text: relink when
 * it already holds an unlinked domain, unlink otherwise.
 */
export function linkToggleEdits(
  selectedText: string,
): (text: string) => Array<TextEdit> {
  return selectedText.includes(`.${ZWNJ}`) ? relinkEdits : unlinkEdits;
}

/**
 * X's floating selection toolbar contains buttons with exact aria-label
 * "Bold" and "Italic" (the toolbar buttons in the composer use
 * "Bold, (⌘+B)" — the parens distinguish them). Returns the group div when
 * both are present.
 */
function findXFormattingGroup(): Element | null {
  const buttons = document.querySelectorAll('button[aria-label="Bold"]');
  for (const bold of buttons) {
    const parent = bold.parentElement;
    if (!parent) continue;
    if (parent.querySelector('button[aria-label="Italic"]')) {
      return parent;
    }
  }
  return null;
}

type ButtonContent = { text: string } | { svg: string };

/**
 * Build a button that visually matches the surrounding Bold/Italic buttons
 * by reusing their classes, but with our own label and click behavior.
 */
function buildFormatButton(
  template: HTMLButtonElement,
  label: string,
  content: ButtonContent,
  onClick: () => void,
  tooltip?: string,
): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.className = template.className;
  btn.classList.add(FORMAT_BTN_CLASS);
  btn.type = 'button';
  btn.setAttribute('role', 'button');
  btn.setAttribute('aria-label', label);
  if (tooltip) btn.title = tooltip;

  const innerTemplate = template.querySelector(':scope > div');
  const inner = document.createElement('div');
  if (innerTemplate) {
    inner.className = innerTemplate.className;
  }
  if ('svg' in content) {
    inner.innerHTML = content.svg;
  } else {
    inner.textContent = content.text;
  }
  btn.appendChild(inner);

  /** Prevent losing the selection when the user mouses down on the button. */
  btn.addEventListener('mousedown', (e) => e.preventDefault());
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    onClick();
  });

  return btn;
}

function injectIntoGroup(group: Element): void {
  if (group.hasAttribute(GROUP_INJECTED_ATTR)) return;
  const template = group.querySelector('button') as HTMLButtonElement | null;
  if (!template) return;

  const codeBtn = buildFormatButton(template, 'Code', { text: '</>' }, () =>
    void editSelection(codeEdits),
  );
  const normalBtn = buildFormatButton(template, 'Normal', { text: 'Aa' }, () =>
    void editSelection(normalEdits),
  );
  const unlinkBtn = buildFormatButton(
    template,
    'No link',
    { svg: UNLINK_ICON_SVG },
    () =>
      void editSelection(
        linkToggleEdits(window.getSelection()?.toString() ?? ''),
      ),
    'No link',
  );

  group.appendChild(codeBtn);
  group.appendChild(normalBtn);
  group.appendChild(unlinkBtn);
  group.setAttribute(GROUP_INJECTED_ATTR, '1');
}

export function initCodeFormatter(): () => void {
  const observer = new MutationObserver(() => {
    const group = findXFormattingGroup();
    if (group) injectIntoGroup(group);
  });
  observer.observe(document.body, { childList: true, subtree: true });

  const initial = findXFormattingGroup();
  if (initial) injectIntoGroup(initial);

  return () => {
    observer.disconnect();
  };
}

export function cleanupCodeFormatter(): void {
  document
    .querySelectorAll(`[${GROUP_INJECTED_ATTR}]`)
    .forEach((group) => {
      group.removeAttribute(GROUP_INJECTED_ATTR);
      group.querySelectorAll(`.${FORMAT_BTN_CLASS}`).forEach((b) => b.remove());
    });
}
