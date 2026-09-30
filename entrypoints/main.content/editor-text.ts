/**
 * Text edits inside X's composer, which is a Draft.js editor.
 *
 * Draft.js keeps its own model of the text and renders every decorated part
 * (a link, a mention, a hashtag) as a separate leaf span. Replacing a range
 * with one native insert desyncs that model when the range crosses leaves, or
 * when the new text adds or removes a decoration: text next to the range gets
 * deleted or duplicated. Small edits stay in sync: an insert at a collapsed
 * caret, a delete, or a replace inside one leaf. So a format is expressed as
 * a list of such edits, and they are applied one at a time.
 *
 * Draft.js re-renders after each edit and can replace the DOM nodes, so
 * positions are kept as (block index, character offset in the block) and
 * mapped to fresh DOM nodes right before each edit.
 */

/** Replace `text[start..end)` with `insert`. `start === end` is a pure insert. */
export interface TextEdit {
  start: number;
  end: number;
  insert: string;
}

interface BlockPoint {
  block: number;
  offset: number;
}

const BLOCK_SELECTOR = '[data-block="true"]';

/** Apply edits to a plain string. Edits must not overlap. */
export function applyEdits(text: string, edits: Array<TextEdit>): string {
  let result = text;
  for (const edit of [...edits].sort((a, b) => b.start - a.start)) {
    result = result.slice(0, edit.start) + edit.insert + result.slice(edit.end);
  }
  return result;
}

/**
 * Keep the edits that fall inside the selection `[from, to)` and inside a
 * single leaf, and merge neighbouring replaces in the same leaf so a run of
 * characters becomes one edit. An insert counts as selected when the
 * character before it is. `leafEnds` holds the end offset of each leaf.
 */
export function planEdits(
  edits: Array<TextEdit>,
  from: number,
  to: number,
  leafEnds: Array<number>,
): Array<TextEdit> {
  const leafOf = (offset: number) => leafEnds.findIndex((end) => offset < end);
  const kept = edits
    .filter((edit) => {
      if (edit.start === edit.end) {
        return edit.start > from && edit.start <= to;
      }
      return (
        edit.start >= from &&
        edit.end <= to &&
        leafOf(edit.start) === leafOf(edit.end - 1)
      );
    })
    .sort((a, b) => a.start - b.start);

  const merged: Array<TextEdit> = [];
  for (const edit of kept) {
    const last = merged.at(-1);
    if (
      last &&
      last.start < last.end &&
      edit.start < edit.end &&
      last.end === edit.start &&
      leafOf(last.start) === leafOf(edit.start)
    ) {
      merged[merged.length - 1] = {
        start: last.start,
        end: edit.end,
        insert: last.insert + edit.insert,
      };
    } else {
      merged.push(edit);
    }
  }
  return merged;
}

/** Draft.js reads the DOM selection from `selectionchange`, which fires as a task. */
function nextTask(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function getBlocks(editor: Element): Array<Element> {
  return Array.from(editor.querySelectorAll(BLOCK_SELECTOR));
}

function getTextNodes(root: Node): Array<Text> {
  const nodes: Array<Text> = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    nodes.push(node as Text);
    node = walker.nextNode();
  }
  return nodes;
}

/** Convert a DOM position to a block index and a character offset in that block. */
function toBlockPoint(
  blocks: Array<Element>,
  node: Node,
  offset: number,
): BlockPoint | null {
  const block = blocks.findIndex((b) => b.contains(node));
  if (block === -1) return null;
  const range = document.createRange();
  range.setStart(blocks[block], 0);
  range.setEnd(node, offset);
  return { block, offset: range.toString().length };
}

/** Convert a block index and a character offset back to a DOM position. */
function toDomPoint(
  editor: Element,
  point: BlockPoint,
): { node: Text; offset: number } | null {
  const block = getBlocks(editor)[point.block];
  if (!block) return null;
  let position = 0;
  for (const node of getTextNodes(block)) {
    const end = position + node.data.length;
    if (point.offset <= end) {
      return { node, offset: point.offset - position };
    }
    position = end;
  }
  return null;
}

function select(editor: Element, start: BlockPoint, end: BlockPoint): boolean {
  const from = toDomPoint(editor, start);
  const to = toDomPoint(editor, end);
  const selection = window.getSelection();
  if (!from || !to || !selection) return false;
  const range = document.createRange();
  range.setStart(from.node, from.offset);
  range.setEnd(to.node, to.offset);
  selection.removeAllRanges();
  selection.addRange(range);
  return true;
}

/**
 * Apply the edits that `getEdits` returns for each selected block, limited to
 * the selection, then select the edited text again so the user can repeat or
 * copy it.
 */
export async function editSelection(
  getEdits: (blockText: string) => Array<TextEdit>,
): Promise<void> {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) return;
  const range = selection.getRangeAt(0);
  const editor = range.startContainer.parentElement?.closest(
    '[contenteditable="true"]',
  );
  if (!editor) return;

  const blocks = getBlocks(editor);
  const start = toBlockPoint(blocks, range.startContainer, range.startOffset);
  const end = toBlockPoint(blocks, range.endContainer, range.endOffset);
  if (!start || !end) return;

  /** Last block first and last edit first, so the earlier offsets stay valid. */
  let endShift = 0;
  for (let block = end.block; block >= start.block; block--) {
    const nodes = getTextNodes(blocks[block]);
    const text = nodes.map((n) => n.data).join('');
    const leafEnds: Array<number> = [];
    for (const node of nodes) {
      leafEnds.push((leafEnds.at(-1) ?? 0) + node.data.length);
    }
    const from = block === start.block ? start.offset : 0;
    const to = block === end.block ? end.offset : text.length;
    const edits = planEdits(getEdits(text), from, to, leafEnds).reverse();

    for (const edit of edits) {
      const selected = select(
        editor,
        { block, offset: edit.start },
        { block, offset: edit.end },
      );
      if (!selected) return;
      await nextTask();
      if (edit.insert) {
        document.execCommand('insertText', false, edit.insert);
      } else {
        document.execCommand('delete');
      }
      await nextTask();
      if (block === end.block) {
        endShift += edit.insert.length - (edit.end - edit.start);
      }
    }
  }

  select(editor, start, { block: end.block, offset: end.offset + endShift });
}
