import { parseTextManuscript, validateManuscriptSize } from '../lib/processing/text-parser';

describe('Text Parser', () => {
  test('parseTextManuscript should extract text and calculate metadata', () => {
    const input = 'Hello world. This is a test manuscript with some words in it.';
    const result = parseTextManuscript(input);

    expect(result.text).toBe(input);
    expect(result.metadata.wordCount).toBe(11);
    expect(result.metadata.characterCount).toBe(input.length);
    expect(result.metadata.estimatedReadingTime).toBeGreaterThan(0);
  });

  test('parseTextManuscript should normalize line endings', () => {
    const input = 'Line one\r\nLine two\r\nLine three';
    const result = parseTextManuscript(input);

    expect(result.text).toBe('Line one\nLine two\nLine three');
    expect(result.metadata.wordCount).toBe(6);
  });

  test('parseTextManuscript should replace tabs with spaces', () => {
    const input = 'Tab\there\ttest';
    const result = parseTextManuscript(input);

    expect(result.text).toContain('    '); // Tabs converted to 4 spaces
    expect(result.metadata.wordCount).toBe(3);
  });

  test('validateManuscriptSize should reject empty manuscripts', () => {
    const result = validateManuscriptSize(0);

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Manuscript is empty');
  });

  test('validateManuscriptSize should reject manuscripts over 200k words', () => {
    const result = validateManuscriptSize(250000);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('exceeds maximum size');
  });

  test('validateManuscriptSize should accept valid manuscripts', () => {
    const result = validateManuscriptSize(50000);

    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  test('parseTextManuscript should handle large texts', () => {
    const largeText = 'word '.repeat(100000); // 100k words
    const result = parseTextManuscript(largeText);

    expect(result.metadata.wordCount).toBe(100000);
  });
});
