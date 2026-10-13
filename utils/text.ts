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

// X shortens every link with t.co, so each URL counts as this many characters
export const URL_LENGTH = 23;

/**
 * Common TLDs that X links without a scheme. X uses the full IANA list, but
 * a short list keeps file names such as `index.ts` from being counted as URLs.
 */
const BARE_TLDS = [
  'com', 'org', 'net', 'io', 'dev', 'ai', 'app', 'co', 'me', 'xyz', 'gg',
  'sh', 'so', 'tv', 'info', 'biz', 'edu', 'gov', 'us', 'uk', 'de', 'fr',
  'eu', 'ca', 'jp', 'in', 'au', 'nl', 'ch', 'es', 'it', 'be', 'at',
];

/**
 * Matches URLs with an http(s) scheme, and bare domains with a known TLD.
 * The last character must not be punctuation, so `(https://a.com).` keeps
 * the `).` outside the URL, as X does.
 */
const URL_REGEX = new RegExp(
  [
    String.raw`https?:\/\/[^\s]*[^\s.,:;!?'")\]}]`,
    String.raw`(?<![\w@.\/-])(?:[a-z0-9-]+\.)+(?:${BARE_TLDS.join('|')})\b(?:\/[^\s]*[^\s.,:;!?'")\]}])?`,
  ].join('|'),
  'gi',
);

/**
 * Code point ranges that X counts as 1 character: Latin, Greek, Cyrillic and
 * other scripts up to U+10FF, plus general punctuation such as spaces, dashes
 * and typographic quotes. All other code points (CJK, most symbols) count as 2.
 */
const SINGLE_WEIGHT_RANGES: Array<[number, number]> = [
  [0x0000, 0x10ff],
  [0x2000, 0x200d],
  [0x2010, 0x201f],
  [0x2032, 0x2037],
];

// One full emoji, including ZWJ sequences, flags, skin tones and keycaps
const EMOJI_REGEX = new RegExp(String.raw`\p{RGI_Emoji}`, 'gv');

const EMOJI_WEIGHT = 2;

function getCodePointWeight(codePoint: number): number {
  for (const [start, end] of SINGLE_WEIGHT_RANGES) {
    if (codePoint >= start && codePoint <= end) return 1;
  }
  return 2;
}

/**
 * Count text that contains no URLs. X normalizes the text to NFC, counts
 * each emoji as 2, and weights every other code point by its range.
 */
function getWeightedLength(text: string): number {
  const normalized = text.normalize('NFC');
  let count = 0;
  let last = 0;
  const addCodePoints = (part: string) => {
    for (const char of part) {
      count += getCodePointWeight(char.codePointAt(0)!);
    }
  };
  for (const match of normalized.matchAll(EMOJI_REGEX)) {
    addCodePoints(normalized.slice(last, match.index));
    count += EMOJI_WEIGHT;
    last = match.index + match[0].length;
  }
  addCodePoints(normalized.slice(last));
  return count;
}

/**
 * Get character count for a string, the same way X counts it: every URL
 * counts as `URL_LENGTH` characters, no matter how long it is, each emoji
 * counts as 2, and CJK and most symbols count as 2 each.
 */
export function getCharCount(text: string): number {
  let count = 0;
  let last = 0;
  for (const match of text.matchAll(URL_REGEX)) {
    count += getWeightedLength(text.slice(last, match.index)) + URL_LENGTH;
    last = match.index + match[0].length;
  }
  return count + getWeightedLength(text.slice(last));
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
