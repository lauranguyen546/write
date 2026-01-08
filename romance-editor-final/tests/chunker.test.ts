import { chunkText, getChunkWindow, mergeChunks } from '../lib/analysis/chunker';

describe('Text Chunker', () => {
  test('chunkText should split text into chunks', () => {
    const text = 'This is a test. '.repeat(500); // ~2000 words
    const chunks = chunkText(text, 1000, 200);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].index).toBe(0);
    expect(chunks[0].startChar).toBe(0);
    expect(chunks[0].text).toBeTruthy();
  });

  test('chunks should have proper indices', () => {
    const text = 'Word '.repeat(2000);
    const chunks = chunkText(text);

    for (let i = 0; i < chunks.length; i++) {
      expect(chunks[i].index).toBe(i);
    }
  });

  test('chunks should overlap', () => {
    const text = 'The quick brown fox. '.repeat(500);
    const chunks = chunkText(text, 1000, 200);

    if (chunks.length > 1) {
      const firstEnd = chunks[0].endChar;
      const secondStart = chunks[1].startChar;
      expect(secondStart).toBeLessThan(firstEnd); // Overlap exists
    }
  });

  test('getChunkWindow should return chunks around position', () => {
    const text = 'Sentence. '.repeat(1000);
    const chunks = chunkText(text);
    const window = getChunkWindow(chunks, chunks[2].startChar, 1);

    expect(window.length).toBeGreaterThan(0);
    expect(window.length).toBeLessThanOrEqual(3); // Center + 1 before + 1 after
  });

  test('mergeChunks should reconstruct text', () => {
    const text = 'This is a test sentence. '.repeat(100);
    const chunks = chunkText(text, 500, 100);
    const merged = mergeChunks(chunks);

    // Should be close to original (some minor differences due to splitting)
    expect(merged.length).toBeGreaterThan(text.length * 0.9);
    expect(merged).toContain('This is a test sentence.');
  });

  test('should handle small texts', () => {
    const text = 'Just a small text.';
    const chunks = chunkText(text);

    expect(chunks.length).toBe(1);
    expect(chunks[0].text).toBe(text);
  });

  test('should split at sentence boundaries', () => {
    const text = 'First sentence. Second sentence. Third sentence. Fourth sentence.';
    const chunks = chunkText(text, 100, 20);

    // Chunks should end near sentence boundaries, not mid-word
    for (const chunk of chunks) {
      const lastChar = chunk.text[chunk.text.length - 1];
      expect(['.', '!', '?', ' ', '\n']).toContain(lastChar);
    }
  });
});
