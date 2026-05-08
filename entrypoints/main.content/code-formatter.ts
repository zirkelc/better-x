import { CLASS_PREFIX, SELECTORS } from '../../utils/constants';

const FORMAT_GROUP_CLASS = `${CLASS_PREFIX}-format-group`;
const FORMAT_BTN_CLASS = `${CLASS_PREFIX}-format-btn`;

/** Shared format container element */
let formatContainer: HTMLElement | null = null;

/**
 * Convert a character to Mathematical Monospace Unicode
 */
function toMonospace(char: string): string {
  const code = char.charCodeAt(0);
  /** A-Z → U+1D670 - U+1D689 */
  if (code >= 65 && code <= 90) {
    return String.fromCodePoint(0x1d670 + code - 65);
  }
  /** a-z → U+1D68A - U+1D6A3 */
  if (code >= 97 && code <= 122) {
    return String.fromCodePoint(0x1d68a + code - 97);
  }
  /** 0-9 → U+1D7F6 - U+1D7FF */
  if (code >= 48 && code <= 57) {
    return String.fromCodePoint(0x1d7f6 + code - 48);
  }
  return char;
}

/**
 * Convert a Mathematical Monospace character back to regular ASCII
 */
function fromMonospace(char: string): string {
  const code = char.codePointAt(0);
  if (code === undefined) {
    return char;
  }
  /** Mathematical Monospace A-Z: U+1D670 - U+1D689 */
  if (code >= 0x1d670 && code <= 0x1d689) {
    return String.fromCharCode(65 + code - 0x1d670);
  }
  /** Mathematical Monospace a-z: U+1D68A - U+1D6A3 */
  if (code >= 0x1d68a && code <= 0x1d6a3) {
    return String.fromCharCode(97 + code - 0x1d68a);
  }
  /** Mathematical Monospace 0-9: U+1D7F6 - U+1D7FF */
  if (code >= 0x1d7f6 && code <= 0x1d7ff) {
    return String.fromCharCode(48 + code - 0x1d7f6);
  }
  return char;
}

/**
 * Format text as monospace code
 */
function formatAsCode(text: string): string {
  return [...text].map(toMonospace).join('');
}

/**
 * Format monospace text back to normal ASCII
 */
function formatAsNormal(text: string): string {
  return [...text].map(fromMonospace).join('');
}

/**
 * Create a format button element
 */
function createFormatButton(
  format: 'code' | 'normal',
  label: string,
  ariaLabel: string,
): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.className = FORMAT_BTN_CLASS;
  btn.textContent = label;
  btn.setAttribute('type', 'button');
  btn.setAttribute('aria-label', ariaLabel);
  btn.dataset.format = format;
  return btn;
}

/**
 * Get or create the format container with both buttons
 */
function getFormatContainer(): HTMLElement {
  if (!formatContainer) {
    formatContainer = document.createElement('div');
    formatContainer.className = FORMAT_GROUP_CLASS;

    const codeBtn = createFormatButton('code', '</>', 'Format as code');
    const normalBtn = createFormatButton('normal', 'Aa', 'Format as normal text');

    formatContainer.appendChild(codeBtn);
    formatContainer.appendChild(normalBtn);

    formatContainer.addEventListener('click', handleFormatClick);
    formatContainer.addEventListener('mousedown', (e) => {
      /** Prevent losing selection when clicking button */
      e.preventDefault();
    });

    document.body.appendChild(formatContainer);
  }
  return formatContainer;
}

/**
 * Show format container at position
 */
function showFormatContainer(x: number, y: number): void {
  const container = getFormatContainer();
  container.style.left = `${x}px`;
  container.style.top = `${y}px`;
  container.style.display = 'flex';
}

/**
 * Hide format container
 */
function hideFormatContainer(): void {
  if (formatContainer) {
    formatContainer.style.display = 'none';
  }
}

/**
 * Check if selection is within X's textarea
 */
function getTextareaSelection(): { textarea: Element; selection: Selection } | null {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
    return null;
  }

  const anchorNode = selection.anchorNode;
  const focusNode = selection.focusNode;
  if (!anchorNode || !focusNode) {
    return null;
  }

  /** Find textarea containing the selection */
  let textarea = document.querySelector(SELECTORS.TEXTAREA);
  if (!textarea) {
    textarea = document.querySelector(SELECTORS.TEXTBOX_FALLBACK);
  }

  if (!textarea) {
    return null;
  }

  if (!textarea.contains(anchorNode) || !textarea.contains(focusNode)) {
    return null;
  }

  return { textarea, selection };
}

/**
 * Handle format button click
 */
function handleFormatClick(e: Event): void {
  const target = e.target as HTMLElement;
  const format = target.dataset.format as 'code' | 'normal' | undefined;
  if (!format) {
    return;
  }

  const result = getTextareaSelection();
  if (!result) {
    hideFormatContainer();
    return;
  }

  const { selection } = result;
  const selectedText = selection.toString();
  if (!selectedText) {
    hideFormatContainer();
    return;
  }

  const formattedText = format === 'code'
    ? formatAsCode(selectedText)
    : formatAsNormal(selectedText);

  /** Replace selection using execCommand for undo support */
  document.execCommand('insertText', false, formattedText);

  hideFormatContainer();
}

/**
 * Handle selection change
 */
function handleSelectionChange(): void {
  const result = getTextareaSelection();
  if (!result) {
    hideFormatContainer();
    return;
  }

  const { selection } = result;
  const selectedText = selection.toString();
  if (!selectedText) {
    hideFormatContainer();
    return;
  }

  /** Position container below selection */
  const range = selection.getRangeAt(0);
  const rects = range.getClientRects();
  /** Use last rect for multiline selections to position below the end */
  const lastRect = rects[rects.length - 1] || range.getBoundingClientRect();
  const centerX = lastRect.left + lastRect.width / 2;
  const bottomY = lastRect.bottom + 8;

  showFormatContainer(centerX, bottomY);
}

/**
 * Initialize code formatter
 */
export function initCodeFormatter(): () => void {
  document.addEventListener('selectionchange', handleSelectionChange);

  return () => {
    document.removeEventListener('selectionchange', handleSelectionChange);
  };
}

/**
 * Cleanup shared format container
 */
export function cleanupCodeFormatter(): void {
  if (formatContainer) {
    formatContainer.remove();
    formatContainer = null;
  }
}
