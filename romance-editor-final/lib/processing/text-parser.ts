/**
 * Text parser for .txt and .md files
 */

export interface ParsedManuscript {
  text: string;
  metadata: {
    wordCount: number;
    characterCount: number;
    estimatedReadingTime: number; // minutes
  };
}

/**
 * Parse plain text or markdown manuscript
 */
export function parseTextManuscript(content: string): ParsedManuscript {
  // Clean up the text
  const text = content
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\t/g, '    ') // Replace tabs with spaces
    .trim();

  // Calculate metadata
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;
  const characterCount = text.length;
  const estimatedReadingTime = Math.ceil(wordCount / 250); // 250 words per minute

  return {
    text,
    metadata: {
      wordCount,
      characterCount,
      estimatedReadingTime,
    },
  };
}

/**
 * Validate manuscript size (max 200k words)
 */
export function validateManuscriptSize(wordCount: number): { valid: boolean; error?: string } {
  const MAX_WORDS = 200_000;
  
  if (wordCount === 0) {
    return { valid: false, error: 'Manuscript is empty' };
  }
  
  if (wordCount > MAX_WORDS) {
    return {
      valid: false,
      error: `Manuscript exceeds maximum size of ${MAX_WORDS.toLocaleString()} words (${wordCount.toLocaleString()} words)`,
    };
  }
  
  return { valid: true };
}
