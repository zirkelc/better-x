import { CLASS_PREFIX, DATA_INITIALIZED } from '../utils/constants';
import { getCharCount } from '../utils/text';

const OVERLAY_CLASS = `${CLASS_PREFIX}-overlay`;
const WORD_CLASS = `${CLASS_PREFIX}-word`;
const HIGHLIGHTED_CLASS = 'highlighted';

interface DOMToken {
  text: string;
  node: Text;
  startOffset: number;
  endOffset: number;
}

interface PositionedDOMToken extends DOMToken {
  rects: Array<DOMRect>;
}

/** Shared tooltip element */
let tooltipElement: HTMLElement | null = null;

/** Shared canvas context for text measurement */
let measureCanvas: CanvasRenderingContext2D | null = null;

/**
 * Get or create a canvas context for text measurement
 */
function getMeasureContext(): CanvasRenderingContext2D {
  if (!measureCanvas) {
    const canvas = document.createElement('canvas');
    measureCanvas = canvas.getContext('2d')!;
  }
  return measureCanvas;
}

/**
 * Measure text width using canvas
 */
function measureTextWidth(text: string, font: string): number {
  const ctx = getMeasureContext();
  ctx.font = font;
  return ctx.measureText(text).width;
}

/**
 * Get or create the shared tooltip element
 */
function getTooltip(): HTMLElement {
  if (!tooltipElement) {
    tooltipElement = document.createElement('div');
    tooltipElement.className = `${CLASS_PREFIX}-tooltip`;
    tooltipElement.setAttribute('role', 'tooltip');
    document.body.appendChild(tooltipElement);
  }
  return tooltipElement;
}

/**
 * Show tooltip at position
 */
function showTooltip(x: number, y: number, content: string): void {
  const tooltip = getTooltip();
  tooltip.textContent = content;
  tooltip.style.left = `${x}px`;
  tooltip.style.top = `${y}px`;
  tooltip.classList.add('visible');
}

/**
 * Hide tooltip
 */
function hideTooltip(): void {
  if (tooltipElement) {
    tooltipElement.classList.remove('visible');
  }
}

/**
 * Extract tokens directly from DOM text nodes
 * Each token stores a reference to its text node and offsets within that node
 */
function extractTokensFromDOM(container: Element): Array<DOMToken> {
  const tokens: Array<DOMToken> = [];

  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    null,
  );

  let node = walker.nextNode() as Text | null;

  while (node) {
    const text = node.textContent || '';
    let i = 0;

    while (i < text.length) {
      const char = text[i];

      if (/\s/.test(char)) {
        /** Skip whitespace */
        i++;
      } else {
        /** Collect word characters */
        let j = i;
        while (j < text.length && !/\s/.test(text[j])) {
          j++;
        }
        tokens.push({
          text: text.slice(i, j),
          node,
          startOffset: i,
          endOffset: j,
        });
        i = j;
      }
    }

    node = walker.nextNode() as Text | null;
  }

  return tokens;
}

/**
 * Measure token position using Range API
 * Token already contains its text node reference and offsets
 */
function measureTokenRects(
  token: DOMToken,
  textarea: Element,
): Array<DOMRect> | null {
  try {
    const range = document.createRange();
    range.setStart(token.node, token.startOffset);
    range.setEnd(token.node, token.endOffset);
    const rects = range.getClientRects();

    /** Get computed font for accurate text measurement */
    const computedStyle = window.getComputedStyle(textarea);
    const font = `${computedStyle.fontWeight} ${computedStyle.fontSize} ${computedStyle.fontFamily}`;
    const textWidth = measureTextWidth(token.text, font);

    /** Filter out phantom rects - only keep rects with width close to measured text */
    const tolerance = 4;
    return Array.from(rects)
      .filter((r) => r.width > 0 && r.height > 0)
      .filter((r) => {
        /** Reject rects way wider than the text (phantom rects spanning line breaks) */
        if (r.width > textWidth + tolerance) return false;
        /** Reject very narrow rects that are likely phantom fragments */
        if (r.width < textWidth * 0.5 && textWidth > 10) return false;
        return true;
      })
      .map((rect) => {
        /** Clamp width to measured text width */
        if (rect.width > textWidth) {
          return new DOMRect(rect.left, rect.top, textWidth, rect.height);
        }
        return rect;
      });
  } catch {
    return null;
  }
}

/**
 * Create overlay container
 */
function createOverlayElement(): HTMLElement {
  const overlay = document.createElement('div');
  overlay.className = OVERLAY_CLASS;
  return overlay;
}

/**
 * Create word box elements (multiple for multiline words)
 */
function createTokenElements(
  token: PositionedDOMToken,
  index: number,
): Array<HTMLElement> {
  const elements: Array<HTMLElement> = [];

  for (const rect of token.rects) {
    const el = document.createElement('div');
    el.className = WORD_CLASS;

    el.style.left = `${rect.left}px`;
    el.style.top = `${rect.top}px`;
    el.style.width = `${rect.width}px`;
    el.style.height = `${rect.height}px`;

    el.dataset.text = token.text;
    el.dataset.chars = String(getCharCount(token.text));
    el.dataset.index = String(index);

    elements.push(el);
  }

  return elements;
}

/**
 * Find which token contains a given text node and offset
 */
function findTokenAtNodePosition(
  tokens: Array<DOMToken>,
  node: Text,
  offset: number,
): number | null {
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (
      token.node === node &&
      offset >= token.startOffset &&
      offset < token.endOffset
    ) {
      return i;
    }
  }
  return null;
}

/**
 * Get text node and offset from mouse coordinates
 */
function getNodePositionFromPoint(
  x: number,
  y: number,
  textarea: Element,
): { node: Text; offset: number } | null {
  /** Use caretRangeFromPoint to find the text position */
  const range = document.caretRangeFromPoint(x, y);
  if (!range) {
    return null;
  }

  /** Check if the range is within the textarea */
  if (!textarea.contains(range.startContainer)) {
    return null;
  }

  /** Verify it's a text node */
  if (range.startContainer.nodeType !== Node.TEXT_NODE) {
    return null;
  }

  return {
    node: range.startContainer as Text,
    offset: range.startOffset,
  };
}

/**
 * Initialize word overlay for a textarea
 */
export function initWordOverlay(textarea: Element): (() => void) | null {
  const initAttr = textarea.getAttribute(DATA_INITIALIZED);
  if (initAttr?.includes('wordoverlay')) {
    return null;
  }

  const overlay = createOverlayElement();
  document.body.appendChild(overlay);

  /** Map of token index to box elements (multiple for multiline) */
  const tokenBoxes: Map<number, Array<HTMLElement>> = new Map();

  /** Current tokens */
  let currentTokens: Array<DOMToken> = [];

  /** Currently highlighted box index */
  let highlightedIndex: number | null = null;

  /**
   * Get selected text within the textarea
   */
  function getSelectionInTextarea(): string | null {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
      return null;
    }

    const range = selection.getRangeAt(0);

    /** Check if selection intersects with the textarea (handles complete selections) */
    if (!range.intersectsNode(textarea)) {
      return null;
    }

    const selectedText = selection.toString();
    return selectedText || null;
  }

  /**
   * Clear any existing highlight
   */
  function clearHighlight(): void {
    if (highlightedIndex !== null) {
      const boxes = tokenBoxes.get(highlightedIndex);
      if (boxes) {
        for (const box of boxes) {
          box.classList.remove(HIGHLIGHTED_CLASS);
        }
      }
      highlightedIndex = null;
    }
    hideTooltip();
  }

  /**
   * Highlight a specific box by index
   */
  function highlightBox(index: number): void {
    if (index === highlightedIndex) {
      return;
    }

    clearHighlight();

    const boxes = tokenBoxes.get(index);
    const token = currentTokens[index];

    if (boxes && boxes.length > 0 && token) {
      for (const box of boxes) {
        box.classList.add(HIGHLIGHTED_CLASS);
      }
      highlightedIndex = index;

      /** Position tooltip at first box (topmost) */
      const firstBox = boxes[0];
      const rect = firstBox.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const topY = rect.top - 35;

      const charCount = firstBox.dataset.chars || '0';
      showTooltip(centerX, topY, `Word: ${charCount} chars`);
    }
  }

  /**
   * Show selection tooltip if there's a selection (no bounding boxes)
   */
  function showSelectionTooltip(): boolean {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
      return false;
    }

    const selectedText = getSelectionInTextarea();
    if (!selectedText) {
      return false;
    }

    const range = selection.getRangeAt(0);
    const rects = range.getClientRects();
    /** Use first rect for tooltip position (topmost line) */
    const firstRect = rects[0] || range.getBoundingClientRect();
    const centerX = firstRect.left + firstRect.width / 2;
    const topY = firstRect.top - 35;

    const charCount = getCharCount(selectedText);
    clearHighlight();
    showTooltip(centerX, topY, `Selection: ${charCount} chars`);
    return true;
  }

  /**
   * Handle mousemove on textarea
   */
  function handleMouseMove(e: MouseEvent): void {
    /** Check for selection first - takes precedence */
    if (showSelectionTooltip()) {
      return;
    }

    const nodePosition = getNodePositionFromPoint(e.clientX, e.clientY, textarea);
    if (nodePosition === null) {
      clearHighlight();
      return;
    }

    const tokenIndex = findTokenAtNodePosition(
      currentTokens,
      nodePosition.node,
      nodePosition.offset,
    );
    if (tokenIndex === null) {
      clearHighlight();
      return;
    }

    highlightBox(tokenIndex);
  }

  /**
   * Handle selection change
   */
  function handleSelectionChange(): void {
    showSelectionTooltip();
  }

  /**
   * Handle mouseleave on textarea
   */
  function handleMouseLeave(): void {
    clearHighlight();
  }

  /**
   * Update overlay with current tokens
   */
  function updateOverlay(): void {
    currentTokens = extractTokensFromDOM(textarea);

    /** Clear existing boxes */
    overlay.innerHTML = '';
    tokenBoxes.clear();
    highlightedIndex = null;

    /** Create word boxes */
    for (let i = 0; i < currentTokens.length; i++) {
      const token = currentTokens[i];

      const rects = measureTokenRects(token, textarea);
      if (!rects || rects.length === 0) {
        continue;
      }

      const positionedToken: PositionedDOMToken = { ...token, rects };
      const elements = createTokenElements(positionedToken, i);
      for (const el of elements) {
        overlay.appendChild(el);
      }
      tokenBoxes.set(i, elements);
    }
  }

  /** Initial render */
  updateOverlay();

  /** Add mouse event listeners to textarea */
  textarea.addEventListener('mousemove', handleMouseMove as EventListener);
  textarea.addEventListener('mouseleave', handleMouseLeave);

  /** Listen for selection changes */
  document.addEventListener('selectionchange', handleSelectionChange);

  /** Update on text changes */
  const textObserver = new MutationObserver(() => {
    requestAnimationFrame(updateOverlay);
  });

  textObserver.observe(textarea, {
    childList: true,
    subtree: true,
    characterData: true,
  });

  /** Update on scroll/resize */
  const handleScrollResize = () => {
    requestAnimationFrame(updateOverlay);
  };

  window.addEventListener('scroll', handleScrollResize, true);
  window.addEventListener('resize', handleScrollResize);

  /** Use ResizeObserver for textarea size changes */
  const resizeObserver = new ResizeObserver(() => {
    requestAnimationFrame(updateOverlay);
  });
  resizeObserver.observe(textarea);

  /** Mark as initialized */
  const currentAttr = textarea.getAttribute(DATA_INITIALIZED) || '';
  textarea.setAttribute(
    DATA_INITIALIZED,
    currentAttr ? `${currentAttr},wordoverlay` : 'wordoverlay',
  );

  return () => {
    textarea.removeEventListener('mousemove', handleMouseMove as EventListener);
    textarea.removeEventListener('mouseleave', handleMouseLeave);
    document.removeEventListener('selectionchange', handleSelectionChange);
    textObserver.disconnect();
    resizeObserver.disconnect();
    window.removeEventListener('scroll', handleScrollResize, true);
    window.removeEventListener('resize', handleScrollResize);
    overlay.remove();

    const attr = textarea.getAttribute(DATA_INITIALIZED) || '';
    const newAttr = attr
      .split(',')
      .filter((v) => v !== 'wordoverlay')
      .join(',');
    if (newAttr) {
      textarea.setAttribute(DATA_INITIALIZED, newAttr);
    } else {
      textarea.removeAttribute(DATA_INITIALIZED);
    }
  };
}

/**
 * Cleanup shared tooltip
 */
export function cleanupWordOverlayTooltip(): void {
  if (tooltipElement) {
    tooltipElement.remove();
    tooltipElement = null;
  }
}
