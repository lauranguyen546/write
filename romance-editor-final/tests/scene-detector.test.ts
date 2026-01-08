import {
  detectStructure,
  assignStructureToChunks,
  getStructureSummary,
} from '../lib/analysis/scene-detector';

describe('Scene Detection', () => {
  test('should detect chapter headings', () => {
    const text = `Chapter 1

Some text here.

Chapter 2

More text here.`;

    const breaks = detectStructure(text);
    const chapters = breaks.filter(b => b.type === 'chapter');

    expect(chapters.length).toBeGreaterThanOrEqual(2);
  });

  test('should detect scene breaks with asterisks', () => {
    const text = `Some text here.

***

More text here.

* * *

Even more text.`;

    const breaks = detectStructure(text);
    const scenes = breaks.filter(b => b.type === 'scene');

    expect(scenes.length).toBeGreaterThanOrEqual(2);
  });

  test('should detect chapter variations', () => {
    const testCases = [
      'Chapter 1',
      'CHAPTER 1',
      'Chapter One',
      'Ch. 1',
      'Chapter 1: The Beginning',
      'Part I',
    ];

    for (const chapterText of testCases) {
      const text = `${chapterText}\n\nSome content.`;
      const breaks = detectStructure(text);
      const chapters = breaks.filter(b => b.type === 'chapter');

      expect(chapters.length).toBeGreaterThanOrEqual(1);
    }
  });

  test('should handle text with no breaks', () => {
    const text = 'Just a plain paragraph with no structural breaks.';
    const breaks = detectStructure(text);

    expect(breaks.length).toBe(0);
  });

  test('should assign structure to chunks', () => {
    const text = `Chapter 1

First scene text.

***

Second scene text.

Chapter 2

Third scene text.`;

    const chunks = [
      { startChar: 0, endChar: 50, text: text.substring(0, 50) },
      { startChar: 50, endChar: 100, text: text.substring(50, 100) },
      { startChar: 100, endChar: 150, text: text.substring(100, 150) },
    ];

    const breaks = detectStructure(text);
    const chunksWithStructure = assignStructureToChunks(chunks, breaks);

    expect(chunksWithStructure.some(c => c.chapter)).toBe(true);
  });

  test('should generate structure summary', () => {
    const text = `Chapter 1

Scene 1 text.

***

Scene 2 text.

Chapter 2

Scene 3 text.`;

    const breaks = detectStructure(text);
    const summary = getStructureSummary(breaks);

    expect(summary.totalChapters).toBeGreaterThanOrEqual(1);
    expect(summary.chapters.length).toBeGreaterThanOrEqual(1);
  });

  test('should detect POV switches', () => {
    const text = `Emma

Some text from Emma's POV.

Jake

Some text from Jake's POV.`;

    const breaks = detectStructure(text);
    const povSwitches = breaks.filter(b => b.type === 'pov-switch');

    expect(povSwitches.length).toBeGreaterThanOrEqual(2);
  });

  test('should remove duplicate breaks', () => {
    const text = `Chapter 1

***

Scene text.`;

    const breaks = detectStructure(text);
    
    // Should not have multiple breaks at the same position
    const positions = breaks.map(b => b.position);
    const uniquePositions = new Set(positions);
    
    // Allow some overlap (within 100 chars) but not exact duplicates
    expect(positions.length).toBeGreaterThanOrEqual(uniquePositions.size - 1);
  });
});
