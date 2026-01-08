/**
 * Integration tests for the full Romance Editor workflow
 * These tests verify end-to-end functionality
 */

import { parseTextManuscript, validateManuscriptSize } from '../lib/processing/text-parser';
import { chunkText } from '../lib/analysis/chunker';
import { detectStructure, assignStructureToChunks } from '../lib/analysis/scene-detector';
import { analyzeTextHeuristics } from '../lib/analysis/heuristics';

describe('Romance Editor Integration Tests', () => {
  const sampleManuscript = `Chapter One

Emma stared at the rejection email. Another publisher, another "not quite right for our list." She'd spent three years on this manuscript, pouring her heart into every word.

"Bad news?" Jake's voice came from behind her. Really bad news, she thought.

She jumped, quickly minimizing the email. "Just work stuff," she said very quietly.

***

The office holiday party was in full swing. Emma found herself cornered by Derek from accounting.

"So, Emma, I was thinking we could—"

"Derek, I really need to—"

Jake appeared. "Emma, we need to discuss the Morrison proposal. Now."

His hand was on her elbow, warm and firm.`;

  describe('Full Analysis Pipeline', () => {
    test('should parse manuscript successfully', () => {
      const parsed = parseTextManuscript(sampleManuscript);
      
      expect(parsed.text).toBeTruthy();
      expect(parsed.metadata.wordCount).toBeGreaterThan(0);
      expect(parsed.metadata.characterCount).toBe(sampleManuscript.length);
    });

    test('should validate manuscript size', () => {
      const parsed = parseTextManuscript(sampleManuscript);
      const validation = validateManuscriptSize(parsed.metadata.wordCount);
      
      expect(validation.valid).toBe(true);
      expect(validation.error).toBeUndefined();
    });

    test('should chunk manuscript', () => {
      const chunks = chunkText(sampleManuscript);
      
      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[0].text).toBeTruthy();
      expect(chunks[0].index).toBe(0);
    });

    test('should detect structure', () => {
      const breaks = detectStructure(sampleManuscript);
      
      // Should find at least the chapter heading and scene break
      expect(breaks.length).toBeGreaterThanOrEqual(2);
      
      const chapters = breaks.filter(b => b.type === 'chapter');
      const scenes = breaks.filter(b => b.type === 'scene');
      
      expect(chapters.length).toBeGreaterThanOrEqual(1);
      expect(scenes.length).toBeGreaterThanOrEqual(1);
    });

    test('should assign structure to chunks', () => {
      const chunks = chunkText(sampleManuscript);
      const breaks = detectStructure(sampleManuscript);
      const chunksWithStructure = assignStructureToChunks(chunks, breaks);
      
      expect(chunksWithStructure[0].chapter).toBeTruthy();
    });

    test('should run heuristics analysis', () => {
      const results = analyzeTextHeuristics(sampleManuscript);
      
      // Should find some issues (filter words, repeated words, etc.)
      expect(results.length).toBeGreaterThan(0);
      
      // Should have filter words ("really", "very")
      const filterWords = results.find(r => r.type === 'filter-words');
      expect(filterWords).toBeTruthy();
      expect(filterWords!.count).toBeGreaterThan(0);
    });
  });

  describe('End-to-End Workflow', () => {
    test('should process manuscript through full pipeline', () => {
      // 1. Parse
      const parsed = parseTextManuscript(sampleManuscript);
      expect(parsed.text).toBeTruthy();

      // 2. Validate
      const validation = validateManuscriptSize(parsed.metadata.wordCount);
      expect(validation.valid).toBe(true);

      // 3. Chunk
      const chunks = chunkText(parsed.text);
      expect(chunks.length).toBeGreaterThan(0);

      // 4. Detect structure
      const breaks = detectStructure(parsed.text);
      expect(breaks.length).toBeGreaterThan(0);

      // 5. Assign structure
      const structuredChunks = assignStructureToChunks(chunks, breaks);
      expect(structuredChunks[0].chapter).toBeTruthy();

      // 6. Run heuristics
      const heuristics = analyzeTextHeuristics(parsed.text);
      expect(heuristics.length).toBeGreaterThan(0);

      // Pipeline complete
      expect(true).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('should handle very short manuscripts', () => {
      const shortText = 'A short story.';
      const parsed = parseTextManuscript(shortText);
      const chunks = chunkText(parsed.text);
      
      expect(chunks.length).toBe(1);
      expect(chunks[0].text).toBe(shortText);
    });

    test('should handle manuscripts with no structure markers', () => {
      const noStructure = 'This is a manuscript with no chapters or scenes. Just plain text that goes on and on.';
      const breaks = detectStructure(noStructure);
      
      expect(breaks.length).toBe(0);
    });

    test('should handle manuscripts with no heuristic issues', () => {
      const cleanText = 'The cat sat on the mat.';
      const results = analyzeTextHeuristics(cleanText);
      
      // Should return empty or minimal results
      expect(results.every(r => r.count === 0)).toBe(true);
    });
  });

  describe('Performance', () => {
    test('should process large manuscripts efficiently', () => {
      // Generate a larger manuscript
      const largeManuscript = sampleManuscript.repeat(50); // ~5000 words
      
      const startTime = Date.now();
      
      const parsed = parseTextManuscript(largeManuscript);
      const chunks = chunkText(parsed.text);
      const breaks = detectStructure(parsed.text);
      const structured = assignStructureToChunks(chunks, breaks);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete in under 5 seconds
      expect(duration).toBeLessThan(5000);
      expect(chunks.length).toBeGreaterThan(1);
    });
  });
});
