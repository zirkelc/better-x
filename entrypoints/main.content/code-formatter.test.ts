import { expect, test } from 'vitest';
import {
  codeEdits,
  linkToggleEdits,
  normalEdits,
  unlinkEdits,
} from './code-formatter';
import { applyEdits } from './editor-text';

const ZWNJ = '\u200C';

test(`should insert a zero-width non-joiner after the dot of a domain`, () => {
  // Arrange
  const text = `try tryblurgh.ai today`;

  // Act
  const result = applyEdits(text, unlinkEdits(text));

  // Assert
  expect(result).toBe(`try tryblurgh.${ZWNJ}ai today`);
});

test(`should unlink every dot of a domain with a path`, () => {
  // Arrange
  const text = `docs.vercel.com/docs`;

  // Act
  const result = applyEdits(text, unlinkEdits(text));

  // Assert
  expect(result).toBe(`docs.${ZWNJ}vercel.${ZWNJ}com/docs`);
});

test(`should not change sentence ends or numbers`, () => {
  // Arrange
  const text = `Pi is 3.14. Next sentence.`;

  // Act
  const result = applyEdits(text, unlinkEdits(text));

  // Assert
  expect(result).toBe(text);
});

test(`should not insert a second zero-width non-joiner`, () => {
  // Arrange
  const text = `tryblurgh.${ZWNJ}ai`;

  // Act
  const result = applyEdits(text, unlinkEdits(text));

  // Assert
  expect(result).toBe(text);
});

test(`should remove the zero-width non-joiner when formatting as normal`, () => {
  // Arrange
  const text = `docs.${ZWNJ}vercel.${ZWNJ}com`;

  // Act
  const result = applyEdits(text, normalEdits(text));

  // Assert
  expect(result).toBe(`docs.vercel.com`);
});

test(`should keep a zero-width non-joiner that does not follow a dot`, () => {
  // Arrange
  const text = `می${ZWNJ}خواهم`;

  // Act
  const result = applyEdits(text, normalEdits(text));

  // Assert
  expect(result).toBe(text);
});

test(`should convert code text back to normal`, () => {
  // Arrange
  const text = `let x = 1`;
  const code = applyEdits(text, codeEdits(text));

  // Act
  const result = applyEdits(code, normalEdits(code));

  // Assert
  expect(code).not.toBe(text);
  expect(result).toBe(text);
});

test(`should unlink when the selection has no unlinked domain`, () => {
  // Arrange
  const text = `try tryblurgh.ai today`;

  // Act
  const result = applyEdits(text, linkToggleEdits(text)(text));

  // Assert
  expect(result).toBe(`try tryblurgh.${ZWNJ}ai today`);
});

test(`should relink when the selection has an unlinked domain`, () => {
  // Arrange
  const text = `tryblurgh.${ZWNJ}ai and vercel.com`;

  // Act
  const result = applyEdits(text, linkToggleEdits(text)(text));

  // Assert
  expect(result).toBe(`tryblurgh.ai and vercel.com`);
});
