/**
 * Evidence anchoring — locates a quoted passage inside a chunk of
 * manuscript text and returns character offsets. Pure functions, safe
 * to import from both server (analysis pipeline) and client (viewer).
 *
 * LLMs frequently "fix" curly quotes, dashes, and line breaks when
 * quoting, so exact matching alone misses many quotes.
 */

export function normalizeForMatch(text: string): string {
  return text
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/—/g, '--')
    .replace(/…/g, '...')
    .replace(/\s+/g, ' ');
}

/**
 * Locate an evidence quote inside a chunk and return chunk-relative
 * character offsets. Tries exact match, then normalized match, then
 * the quote's opening fragment — so lightly-altered quotes still anchor.
 */
export function locateEvidence(
  chunkText: string,
  evidence?: string | null
): { start: number; end: number } | null {
  if (!evidence || evidence.trim().length < 8) return null;
  const quote = evidence.trim();

  // 1. Exact match
  let idx = chunkText.indexOf(quote);
  if (idx !== -1) return { start: idx, end: idx + quote.length };

  // 2. Normalized match — recover original offset by walking the text
  const normChunk = normalizeForMatch(chunkText);
  const normQuote = normalizeForMatch(quote);
  const normIdx = normChunk.indexOf(normQuote);
  if (normIdx !== -1) {
    let origPos = 0;
    let normPos = 0;
    while (normPos < normIdx && origPos < chunkText.length) {
      if (/\s/.test(chunkText[origPos])) {
        // A whitespace run in the original is one space when normalized
        while (origPos < chunkText.length && /\s/.test(chunkText[origPos])) origPos++;
        normPos++;
      } else {
        origPos++;
        normPos++;
      }
    }
    return { start: origPos, end: Math.min(origPos + quote.length, chunkText.length) };
  }

  // 3. Opening fragment (first ~40 chars of the quote)
  const fragment = quote.slice(0, 40);
  if (fragment.length >= 15) {
    idx = chunkText.indexOf(fragment);
    if (idx !== -1) return { start: idx, end: Math.min(idx + quote.length, chunkText.length) };
    const normFragIdx = normChunk.indexOf(normalizeForMatch(fragment));
    if (normFragIdx !== -1) {
      const start = Math.min(normFragIdx, Math.max(chunkText.length - 1, 0));
      return { start, end: Math.min(start + quote.length, chunkText.length) };
    }
  }

  return null;
}
