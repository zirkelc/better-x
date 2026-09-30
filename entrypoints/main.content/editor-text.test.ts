import { expect, test } from 'vitest';
import { planEdits } from './editor-text';

test(`should keep an insert only when the character before it is selected`, () => {
  // Arrange
  const edits = [
    { start: 4, end: 4, insert: `|` },
    { start: 8, end: 8, insert: `|` },
  ];

  // Act
  const result = planEdits(edits, 4, 8, [20]);

  // Assert
  expect(result).toEqual([{ start: 8, end: 8, insert: `|` }]);
});

test(`should drop replaces outside the selection`, () => {
  // Arrange
  const edits = [
    { start: 1, end: 2, insert: `X` },
    { start: 5, end: 6, insert: `Y` },
  ];

  // Act
  const result = planEdits(edits, 3, 10, [20]);

  // Assert
  expect(result).toEqual([{ start: 5, end: 6, insert: `Y` }]);
});

test(`should merge neighbouring replaces in the same leaf`, () => {
  // Arrange
  const edits = [
    { start: 0, end: 1, insert: `A` },
    { start: 1, end: 2, insert: `B` },
    { start: 2, end: 3, insert: `C` },
  ];

  // Act
  const result = planEdits(edits, 0, 3, [3]);

  // Assert
  expect(result).toEqual([{ start: 0, end: 3, insert: `ABC` }]);
});

test(`should not merge replaces across a leaf boundary`, () => {
  // Arrange
  const edits = [
    { start: 3, end: 4, insert: `A` },
    { start: 4, end: 5, insert: `B` },
  ];

  // Act
  const result = planEdits(edits, 0, 10, [4, 10]);

  // Assert
  expect(result).toEqual([
    { start: 3, end: 4, insert: `A` },
    { start: 4, end: 5, insert: `B` },
  ]);
});
