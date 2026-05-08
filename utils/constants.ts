/** Character limit for tweets */
export const CHAR_LIMIT = 280;

/** Warning threshold - show yellow when remaining chars <= this */
export const WARNING_THRESHOLD = 20;

/** Selectors for X/Twitter DOM elements */
export const SELECTORS = {
  /** Primary tweet textarea */
  TEXTAREA: '[data-testid="tweetTextarea_0"]',
  /** Fallback: contenteditable textbox */
  TEXTBOX_FALLBACK: '[role="textbox"][contenteditable="true"]',
  /** Toolbar area */
  TOOLBAR: '[data-testid="toolBar"]',
  /** Drafts button in header - counter goes before this */
  UNSENT_BUTTON: '[data-testid="unsentButton"]',
  /** Tweet article in timeline/profile/etc. */
  ARTICLE: 'article[data-testid="tweet"]',
  /** "More" three-dot menu in tweet header */
  CARET: '[data-testid="caret"]',
  /** Compose-bar progress ring next to Add-post / Post buttons */
  COUNTDOWN_CIRCLE: '[data-testid="dual-phase-countdown-circle"]',
} as const;

/** URL pathname pattern for individual post pages: /<user>/status/<id>... */
export const POST_PATH_REGEX = /^\/[^/]+\/status\/\d+/;

/** CSS class prefix for our elements */
export const CLASS_PREFIX = 'better-x';

/** Data attribute to mark initialized elements */
export const DATA_INITIALIZED = 'data-better-x-init';
