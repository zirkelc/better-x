/**
 * Parse text into lines (split by explicit newlines)
 */
export function parseLines(text: string): Array<string> {
  return text.split('\n');
}

/**
 * Parse text into words (split by whitespace)
 */
export function parseWords(text: string): Array<string> {
  return text.split(/\s+/).filter((word) => word.length > 0);
}

/**
 * Get character count for a string
 */
export function getCharCount(text: string): number {
  return text.length;
}

/**
 * Get word at a specific position in text
 */
export function getWordAtPosition(
  text: string,
  position: number,
): { word: string; start: number; end: number } | null {
  if (position < 0 || position > text.length) {
    return null;
  }

  /** Find word boundaries */
  let start = position;
  let end = position;

  /** Move start backwards to find word beginning */
  while (start > 0 && !/\s/.test(text[start - 1])) {
    start--;
  }

  /** Move end forwards to find word end */
  while (end < text.length && !/\s/.test(text[end])) {
    end++;
  }

  const word = text.slice(start, end);
  if (word.length === 0) {
    return null;
  }

  return { word, start, end };
}

/**
 * Get line at a specific position in text
 */
export function getLineAtPosition(
  text: string,
  position: number,
): { line: string; lineNumber: number; start: number; end: number } | null {
  if (position < 0 || position > text.length) {
    return null;
  }

  const lines = parseLines(text);
  let currentPos = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineStart = currentPos;
    const lineEnd = currentPos + line.length;

    if (position >= lineStart && position <= lineEnd) {
      return {
        line,
        lineNumber: i + 1,
        start: lineStart,
        end: lineEnd,
      };
    }

    /** +1 for newline character */
    currentPos = lineEnd + 1;
  }

  return null;
}
