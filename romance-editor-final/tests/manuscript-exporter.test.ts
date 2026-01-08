import {
  generateCleanManuscript,
  generateTrackedChangesMarkdown,
  applyRevisionsToManuscript,
  Chunk,
  AcceptedRevision,
} from '../lib/export/manuscript-exporter';

describe('Manuscript Exporter', () => {
  const sampleText = 'Chapter One\n\nThe quick brown fox jumped over the lazy dog. This is the original sentence.';
  
  const sampleChunks: Chunk[] = [
    {
      index: 0,
      text: sampleText,
      startChar: 0,
      endChar: sampleText.length,
      chapter: 'Chapter One',
    },
  ];

  const sampleRevisions: AcceptedRevision[] = [
    {
      chunkId: '0',
      startChar: 43,
      endChar: 77,
      originalText: 'This is the original sentence.',
      suggestedText: 'This is the revised sentence.',
    },
  ];

  test('applyRevisionsToManuscript should replace text correctly', () => {
    const result = applyRevisionsToManuscript(sampleText, sampleChunks, sampleRevisions);
    
    expect(result).toContain('This is the revised sentence.');
    expect(result).not.toContain('This is the original sentence.');
    expect(result).toContain('The quick brown fox');
  });

  test('generateCleanManuscript should produce clean text', () => {
    const result = generateCleanManuscript(sampleText, sampleChunks, sampleRevisions);
    
    expect(result).toBeTruthy();
    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain('revised sentence');
  });

  test('generateTrackedChangesMarkdown should include strikethrough and bold', () => {
    const result = generateTrackedChangesMarkdown(sampleText, sampleChunks, sampleRevisions);
    
    expect(result).toContain('~~');
    expect(result).toContain('**');
    expect(result).toContain('Revised Manuscript with Tracked Changes');
  });

  test('should handle empty revisions', () => {
    const result = applyRevisionsToManuscript(sampleText, sampleChunks, []);
    
    expect(result).toBe(sampleText);
  });

  test('should handle multiple revisions', () => {
    const multipleRevisions: AcceptedRevision[] = [
      {
        chunkId: '0',
        startChar: 14,
        endChar: 19,
        originalText: 'quick',
        suggestedText: 'fast',
      },
      {
        chunkId: '0',
        startChar: 43,
        endChar: 77,
        originalText: 'This is the original sentence.',
        suggestedText: 'This is the revised sentence.',
      },
    ];

    const result = applyRevisionsToManuscript(sampleText, sampleChunks, multipleRevisions);
    
    expect(result).toContain('fast');
    expect(result).toContain('revised sentence');
  });

  test('should preserve text outside revisions', () => {
    const result = applyRevisionsToManuscript(sampleText, sampleChunks, sampleRevisions);
    
    expect(result).toContain('Chapter One');
    expect(result).toContain('The quick brown fox');
  });
});
