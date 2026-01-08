/**
 * Text chunking for manuscript analysis
 * Splits text into manageable segments with overlap for continuity
 */

export interface ChunkData {
  index: number;
  text: string;
  startChar: number;
  endChar: number;
  tokenEstimate: number;
  chapter?: string;
  scene?: string;
}

/**
 * Estimate token count (rough approximation: 1 token ≈ 4 characters)
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Split text at sentence boundaries
 */
function splitAtSentence(text: string, maxChars: number): string {
  // Find the last sentence boundary before maxChars
  const searchText = text.substring(0, maxChars + 200); // Look ahead a bit
  
  // Look for sentence endings: . ! ? followed by space/newline/quote
  const sentenceEndings = [
    /[.!?]["']?\s+(?=[A-Z])/g,  // Period/!/? + optional quote + space + capital letter
    /[.!?]["']?\n/g,             // Period/!/? + optional quote + newline
    /[.!?]$/g,                   // Period/!/? at end
  ];
  
  let bestSplit = -1;
  
  for (const regex of sentenceEndings) {
    let match;
    regex.lastIndex = 0;
    while ((match = regex.exec(searchText)) !== null) {
      if (match.index >= maxChars - 200 && match.index <= maxChars + 200) {
        bestSplit = match.index + match[0].length;
        break;
      }
    }
    if (bestSplit > -1) break;
  }
  
  // Fallback to space boundary if no sentence boundary found
  if (bestSplit === -1) {
    const spaceIndex = text.substring(0, maxChars).lastIndexOf(' ');
    bestSplit = spaceIndex > maxChars / 2 ? spaceIndex : maxChars;
  }
  
  return text.substring(0, bestSplit);
}

/**
 * Chunk manuscript text with overlap for continuity
 * 
 * @param text - Full manuscript text
 * @param targetTokens - Target tokens per chunk (default: 1000)
 * @param overlapTokens - Overlap between chunks (default: 200)
 * @returns Array of chunk data
 */
export function chunkText(
  text: string,
  targetTokens: number = 1000,
  overlapTokens: number = 200
): ChunkData[] {
  const chunks: ChunkData[] = [];
  const targetChars = targetTokens * 4; // Rough character estimate
  const overlapChars = overlapTokens * 4;
  
  let currentPos = 0;
  let chunkIndex = 0;
  
  while (currentPos < text.length) {
    const remainingText = text.substring(currentPos);
    
    // Determine chunk size
    let chunkText: string;
    if (remainingText.length <= targetChars) {
      // Last chunk - take everything
      chunkText = remainingText;
    } else {
      // Split at sentence boundary near target size
      chunkText = splitAtSentence(remainingText, targetChars);
    }
    
    const startChar = currentPos;
    const endChar = currentPos + chunkText.length;
    
    chunks.push({
      index: chunkIndex,
      text: chunkText,
      startChar,
      endChar,
      tokenEstimate: estimateTokens(chunkText),
    });
    
    // Move position forward, accounting for overlap
    if (remainingText.length > targetChars) {
      currentPos = endChar - overlapChars;
      // Make sure we move forward
      if (currentPos <= startChar) {
        currentPos = startChar + Math.floor(chunkText.length / 2);
      }
    } else {
      currentPos = endChar;
    }
    
    chunkIndex++;
  }
  
  return chunks;
}

/**
 * Get a window of chunks around a specific position
 * Useful for context when analyzing issues
 */
export function getChunkWindow(
  chunks: ChunkData[],
  position: number,
  windowSize: number = 1
): ChunkData[] {
  const targetChunk = chunks.findIndex(
    (c) => c.startChar <= position && c.endChar > position
  );
  
  if (targetChunk === -1) return [];
  
  const start = Math.max(0, targetChunk - windowSize);
  const end = Math.min(chunks.length, targetChunk + windowSize + 1);
  
  return chunks.slice(start, end);
}

/**
 * Merge overlapping chunks back into continuous text
 * Used for display or export
 */
export function mergeChunks(chunks: ChunkData[]): string {
  if (chunks.length === 0) return '';
  if (chunks.length === 1) return chunks[0].text;
  
  // Sort by start position
  const sorted = [...chunks].sort((a, b) => a.startChar - b.startChar);
  
  let result = sorted[0].text;
  
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    
    if (curr.startChar >= prev.endChar) {
      // No overlap, just concatenate
      result += curr.text;
    } else {
      // There's overlap, skip the overlapping part
      const overlapLength = prev.endChar - curr.startChar;
      result += curr.text.substring(overlapLength);
    }
  }
  
  return result;
}
