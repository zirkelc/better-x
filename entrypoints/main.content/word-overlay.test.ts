import { expect, test } from 'vitest';
import { mergeLineRects } from './word-overlay';

test(`should merge touching rects on the same line into one`, () => {
  // Arrange
  const rects = [new DOMRect(536, 10, 88, 20), new DOMRect(624, 10, 16, 20)];

  // Act
  const result = mergeLineRects(rects);

  // Assert
  expect(result.map((r) => [r.left, r.top, r.width, r.height])).toEqual([
    [536, 10, 104, 20],
  ]);
});

test(`should keep rects on different lines apart`, () => {
  // Arrange
  const rects = [new DOMRect(600, 10, 40, 20), new DOMRect(100, 30, 30, 20)];

  // Act
  const result = mergeLineRects(rects);

  // Assert
  expect(result.length).toBe(2);
});

test(`should keep rects apart when there is a gap between them`, () => {
  // Arrange
  const rects = [new DOMRect(100, 10, 40, 20), new DOMRect(300, 10, 40, 20)];

  // Act
  const result = mergeLineRects(rects);

  // Assert
  expect(result.length).toBe(2);
});
