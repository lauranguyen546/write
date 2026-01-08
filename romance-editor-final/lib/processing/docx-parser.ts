/**
 * DOCX parser using mammoth
 */

import mammoth from 'mammoth';
import { ParsedManuscript } from './text-parser';

/**
 * Parse .docx file and extract text
 */
export async function parseDocxManuscript(buffer: Buffer): Promise<ParsedManuscript> {
  try {
    // Extract text from DOCX
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value
      .replace(/\r\n/g, '\n')
      .trim();

    // Calculate metadata
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;
    const characterCount = text.length;
    const estimatedReadingTime = Math.ceil(wordCount / 250);

    return {
      text,
      metadata: {
        wordCount,
        characterCount,
        estimatedReadingTime,
      },
    };
  } catch (error) {
    throw new Error(`Failed to parse DOCX file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if file is a valid DOCX based on magic bytes
 */
export function isValidDocx(buffer: Buffer): boolean {
  // DOCX files are ZIP archives, check for PK signature
  return buffer.length > 4 && buffer[0] === 0x50 && buffer[1] === 0x4b;
}
