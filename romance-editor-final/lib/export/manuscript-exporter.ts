/**
 * Generate revised manuscript with accepted changes
 */

export interface Chunk {
  index: number;
  text: string;
  startChar: number;
  endChar: number;
  chapter?: string;
  scene?: string;
}

export interface AcceptedRevision {
  chunkId: string;
  startChar: number;
  endChar: number;
  originalText: string;
  suggestedText: string;
}

/**
 * Apply accepted revisions to manuscript text
 */
export function applyRevisionsToManuscript(
  originalText: string,
  chunks: Chunk[],
  revisions: AcceptedRevision[]
): string {
  // Sort revisions by position (descending) to avoid offset issues
  const sortedRevisions = [...revisions].sort((a, b) => {
    const chunkA = chunks.find(c => c.index.toString() === a.chunkId);
    const chunkB = chunks.find(c => c.index.toString() === b.chunkId);
    
    if (!chunkA || !chunkB) return 0;
    
    const posA = chunkA.startChar + a.startChar;
    const posB = chunkB.startChar + b.startChar;
    
    return posB - posA; // Descending order
  });

  let revisedText = originalText;

  for (const revision of sortedRevisions) {
    const chunk = chunks.find(c => c.index.toString() === revision.chunkId);
    if (!chunk) continue;

    // Calculate absolute position in manuscript
    const absoluteStart = chunk.startChar + revision.startChar;
    const absoluteEnd = chunk.startChar + revision.endChar;

    // Replace the text
    revisedText =
      revisedText.substring(0, absoluteStart) +
      revision.suggestedText +
      revisedText.substring(absoluteEnd);
  }

  return revisedText;
}

/**
 * Generate markdown with tracked changes notes
 */
export function generateTrackedChangesMarkdown(
  originalText: string,
  chunks: Chunk[],
  revisions: AcceptedRevision[]
): string {
  let output = '# Revised Manuscript with Tracked Changes\n\n';
  output += `**Note:** This document shows accepted revisions. Original text is in strikethrough, new text is in bold.\n\n`;
  output += '---\n\n';

  // Create a map of positions to revisions
  const revisionMap = new Map<number, AcceptedRevision>();
  
  for (const revision of revisions) {
    const chunk = chunks.find(c => c.index.toString() === revision.chunkId);
    if (!chunk) continue;
    
    const absoluteStart = chunk.startChar + revision.startChar;
    revisionMap.set(absoluteStart, revision);
  }

  // Sort positions
  const positions = Array.from(revisionMap.keys()).sort((a, b) => a - b);

  let lastPos = 0;
  let currentChapter = '';

  for (const pos of positions) {
    const revision = revisionMap.get(pos)!;
    const chunk = chunks.find(c => c.index.toString() === revision.chunkId);
    if (!chunk) continue;

    const absoluteEnd = chunk.startChar + revision.endChar;

    // Add chapter heading if changed
    if (chunk.chapter && chunk.chapter !== currentChapter) {
      output += `\n## ${chunk.chapter}\n\n`;
      currentChapter = chunk.chapter;
    }

    // Add unchanged text before this revision
    output += originalText.substring(lastPos, pos);

    // Add the tracked change
    output += `~~${revision.originalText}~~ **${revision.suggestedText}**`;

    lastPos = absoluteEnd;
  }

  // Add remaining text
  output += originalText.substring(lastPos);

  return output;
}

/**
 * Generate clean revised manuscript
 */
export function generateCleanManuscript(
  originalText: string,
  chunks: Chunk[],
  revisions: AcceptedRevision[]
): string {
  return applyRevisionsToManuscript(originalText, chunks, revisions);
}
