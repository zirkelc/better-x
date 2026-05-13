import { CLASS_PREFIX } from '../../utils/constants';

const FORMAT_BTN_CLASS = `${CLASS_PREFIX}-format-btn`;
const GROUP_INJECTED_ATTR = 'data-better-x-format-injected';

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

function formatAsCode(text: string): string {
  return [...text].map(toMonospace).join('');
}

function formatAsNormal(text: string): string {
  return [...text].map(fromMonospace).join('');
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

/**
 * Build a button that visually matches the surrounding Bold/Italic buttons
 * by reusing their classes, but with our own label and click behavior.
 */
function buildFormatButton(
  template: HTMLButtonElement,
  label: string,
  text: string,
  onClick: () => void,
): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.className = template.className;
  btn.classList.add(FORMAT_BTN_CLASS);
  btn.type = 'button';
  btn.setAttribute('role', 'button');
  btn.setAttribute('aria-label', label);

  const innerTemplate = template.querySelector(':scope > div');
  const inner = document.createElement('div');
  if (innerTemplate) {
    inner.className = innerTemplate.className;
  }
  inner.textContent = text;
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

function applyFormat(transform: (text: string) => string): void {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || sel.rangeCount === 0) return;
  const text = sel.toString();
  if (!text) return;

  const formatted = transform(text);
  document.execCommand('insertText', false, formatted);

  /**
   * execCommand collapses the selection at the end of the inserted text.
   * Re-extend it backward by the formatted string's length (in UTF-16 code
   * units — same units DOM offsets use, so surrogate-pair monospace chars
   * work) so the user can immediately re-apply or copy the result.
   */
  const after = window.getSelection();
  if (!after || after.rangeCount === 0) return;
  const range = after.getRangeAt(0);
  const endContainer = range.endContainer;
  const endOffset = range.endOffset;
  const newStart = endOffset - formatted.length;
  if (newStart < 0) return;
  const newRange = document.createRange();
  newRange.setStart(endContainer, newStart);
  newRange.setEnd(endContainer, endOffset);
  after.removeAllRanges();
  after.addRange(newRange);
}

function injectIntoGroup(group: Element): void {
  if (group.hasAttribute(GROUP_INJECTED_ATTR)) return;
  const template = group.querySelector('button') as HTMLButtonElement | null;
  if (!template) return;

  const codeBtn = buildFormatButton(template, 'Code', '</>', () =>
    applyFormat(formatAsCode),
  );
  const normalBtn = buildFormatButton(template, 'Normal', 'Aa', () =>
    applyFormat(formatAsNormal),
  );

  group.appendChild(codeBtn);
  group.appendChild(normalBtn);
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
