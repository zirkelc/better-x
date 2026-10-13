import { expect, test } from 'vitest';
import { getCharCount } from './text';

test(`should count plain text by its length`, () => {
  // Arrange
  const text = 'Hello world';

  // Act
  const result = getCharCount(text);

  // Assert
  expect(result).toBe(11);
});

test(`should count a URL with a scheme as 23 characters`, () => {
  // Arrange
  const text = 'See https://github.com/zirkelc/agent-history';

  // Act
  const result = getCharCount(text);

  // Assert
  expect(result).toBe(4 + 23);
});

test(`should count a short URL as 23 characters`, () => {
  // Arrange
  const text = 'http://x.co';

  // Act
  const result = getCharCount(text);

  // Assert
  expect(result).toBe(23);
});

test(`should count a bare domain as 23 characters`, () => {
  // Arrange
  const text = 'Go to github.com/zirkelc now';

  // Act
  const result = getCharCount(text);

  // Assert
  expect(result).toBe(6 + 23 + 4);
});

test(`should not count trailing punctuation as part of the URL`, () => {
  // Arrange
  const text = '(https://example.com/a).';

  // Act
  const result = getCharCount(text);

  // Assert
  expect(result).toBe(1 + 23 + 2);
});

test(`should count each URL as 23 characters`, () => {
  // Arrange
  const text = 'https://a.com https://b.com/' + 'x'.repeat(100);

  // Act
  const result = getCharCount(text);

  // Assert
  expect(result).toBe(23 + 1 + 23);
});

test(`should not treat a file name or abbreviation as a URL`, () => {
  // Arrange
  const text = 'Edit index.ts, e.g. now';

  // Act
  const result = getCharCount(text);

  // Assert
  expect(result).toBe(text.length);
});

test(`should match the count X shows for a post with a link`, () => {
  // Arrange
  const text = [
    "The hype around claude code mods seems to have died down, but I'm still very excited",
    '',
    'Rebuilding lots of my internal tools as mods',
    '',
    "Here's agent-history: export each session transcript to a folder, optionally commit and push to a git repo",
    '',
    'https://github.com/zirkelc/agent-history',
  ].join('\n');

  // Act
  const result = getCharCount(text);

  // Assert
  expect(result).toBe(263);
});

test(`should count an emoji as 2 characters`, () => {
  // Arrange
  const text = 'Nice 👍';

  // Act
  const result = getCharCount(text);

  // Assert
  expect(result).toBe(5 + 2);
});

test(`should count an emoji sequence as 2 characters`, () => {
  // Arrange
  const text = '👨‍👩‍👧 🇩🇪 👍🏽 1️⃣';

  // Act
  const result = getCharCount(text);

  // Assert
  expect(result).toBe(2 + 1 + 2 + 1 + 2 + 1 + 2);
});

test(`should count CJK characters as 2 characters each`, () => {
  // Arrange
  const text = '日本語 한국어';

  // Act
  const result = getCharCount(text);

  // Assert
  expect(result).toBe(6 + 1 + 6);
});

test(`should count Latin, Greek and Cyrillic letters as 1 character each`, () => {
  // Arrange
  const text = 'Über αβγ привет';

  // Act
  const result = getCharCount(text);

  // Assert
  expect(result).toBe(text.length);
});

test(`should count a decomposed accented letter as 1 character`, () => {
  // Arrange
  const text = 'é';

  // Act
  const result = getCharCount(text);

  // Assert
  expect(result).toBe(1);
});

test(`should count typographic quotes and dashes as 1 character`, () => {
  // Arrange
  const text = '“quoted” – ‘single’';

  // Act
  const result = getCharCount(text);

  // Assert
  expect(result).toBe(text.length);
});
