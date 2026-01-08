/**
 * Local heuristics analysis for manuscript quality
 * Detects common writing issues without LLM calls
 */

export interface HeuristicMatch {
  text: string;
  position: number;
  context: string; // Surrounding text for display
  severity: 'minor' | 'suggestion';
}

export interface HeuristicResult {
  category: string;
  type: string;
  matches: HeuristicMatch[];
  count: number;
}

/**
 * Extract context around a match (50 chars before and after)
 */
function getContext(text: string, position: number, matchLength: number): string {
  const start = Math.max(0, position - 50);
  const end = Math.min(text.length, position + matchLength + 50);
  const context = text.substring(start, end);
  
  // Add ellipsis if truncated
  return (start > 0 ? '...' : '') + context + (end < text.length ? '...' : '');
}

/**
 * Find repeated words within a sliding window
 */
export function findRepeatedWords(
  text: string,
  windowSize: number = 100,
  minWordLength: number = 4
): HeuristicResult {
  const matches: HeuristicMatch[] = [];
  const words = text.match(/\b[a-z]{4,}\b/gi) || [];
  
  // Track word positions
  const wordPositions: { [word: string]: number[] } = {};
  let currentPos = 0;
  
  for (const word of words) {
    const index = text.toLowerCase().indexOf(word.toLowerCase(), currentPos);
    if (index !== -1) {
      const normalizedWord = word.toLowerCase();
      if (!wordPositions[normalizedWord]) {
        wordPositions[normalizedWord] = [];
      }
      wordPositions[normalizedWord].push(index);
      currentPos = index + word.length;
    }
  }
  
  // Find words repeated within window
  const seenCombos = new Set<string>();
  
  for (const [word, positions] of Object.entries(wordPositions)) {
    if (positions.length < 2) continue;
    
    for (let i = 0; i < positions.length - 1; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const distance = positions[j] - positions[i];
        if (distance <= windowSize) {
          const comboKey = `${word}-${positions[i]}-${positions[j]}`;
          if (!seenCombos.has(comboKey)) {
            seenCombos.add(comboKey);
            matches.push({
              text: word,
              position: positions[j], // Second occurrence
              context: getContext(text, positions[j], word.length),
              severity: 'suggestion',
            });
          }
        }
      }
    }
  }
  
  return {
    category: 'repetition',
    type: 'repeated-words',
    matches: matches.slice(0, 50), // Limit to avoid overwhelming
    count: matches.length,
  };
}

/**
 * Find repeated phrases (2-5 words)
 */
export function findRepeatedPhrases(text: string): HeuristicResult {
  const matches: HeuristicMatch[] = [];
  const phrases = new Map<string, number[]>();
  
  // Extract 2-5 word phrases
  const words = text.match(/\b\w+\b/g) || [];
  
  for (let phraseLen = 2; phraseLen <= 5; phraseLen++) {
    for (let i = 0; i <= words.length - phraseLen; i++) {
      const phrase = words.slice(i, i + phraseLen).join(' ').toLowerCase();
      
      // Skip very common phrases and those with common words
      const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
      const phraseWords = phrase.split(' ');
      const hasOnlyCommon = phraseWords.every(w => commonWords.includes(w));
      if (hasOnlyCommon) continue;
      
      // Find position in original text
      const regex = new RegExp(phrase.replace(/\s+/g, '\\s+'), 'gi');
      let match;
      while ((match = regex.exec(text)) !== null) {
        if (!phrases.has(phrase)) {
          phrases.set(phrase, []);
        }
        phrases.get(phrase)!.push(match.index);
      }
    }
  }
  
  // Filter to only repeated phrases
  for (const [phrase, positions] of phrases.entries()) {
    if (positions.length >= 2) {
      // Only report second and later occurrences
      for (let i = 1; i < positions.length; i++) {
        matches.push({
          text: phrase,
          position: positions[i],
          context: getContext(text, positions[i], phrase.length),
          severity: 'suggestion',
        });
      }
    }
  }
  
  return {
    category: 'repetition',
    type: 'repeated-phrases',
    matches: matches.slice(0, 30),
    count: matches.length,
  };
}

/**
 * Find filter words (unnecessary qualifiers)
 */
export function findFilterWords(text: string): HeuristicResult {
  const filterWords = [
    'just', 'really', 'very', 'quite', 'rather', 'somewhat', 'somehow',
    'actually', 'basically', 'literally', 'virtually', 'practically',
    'essentially', 'generally', 'probably', 'possibly', 'maybe',
    'felt like', 'seemed to', 'appeared to', 'looked like', 'sounded like',
    'started to', 'began to', 'tried to', 'decided to',
  ];
  
  const matches: HeuristicMatch[] = [];
  
  for (const filter of filterWords) {
    const regex = new RegExp(`\\b${filter}\\b`, 'gi');
    let match;
    while ((match = regex.exec(text)) !== null) {
      matches.push({
        text: match[0],
        position: match.index,
        context: getContext(text, match.index, match[0].length),
        severity: 'suggestion',
      });
    }
  }
  
  return {
    category: 'line',
    type: 'filter-words',
    matches,
    count: matches.length,
  };
}

/**
 * Find passive voice constructions
 */
export function findPassiveVoice(text: string): HeuristicResult {
  const matches: HeuristicMatch[] = [];
  
  // Pattern: was/were + past participle
  const passivePatterns = [
    /\b(was|were|is|are|been|being)\s+(\w+ed|[a-z]+en)\b/gi,
    /\b(was|were|is|are|been|being)\s+(given|taken|made|done|seen|heard|told|shown)\b/gi,
  ];
  
  for (const pattern of passivePatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      // Filter out some false positives
      const matchedText = match[0].toLowerCase();
      const falsePositives = ['was red', 'were green', 'is open', 'are closed'];
      if (falsePositives.some(fp => matchedText.includes(fp))) continue;
      
      matches.push({
        text: match[0],
        position: match.index,
        context: getContext(text, match.index, match[0].length),
        severity: 'suggestion',
      });
    }
  }
  
  return {
    category: 'line',
    type: 'passive-voice',
    matches: matches.slice(0, 50),
    count: matches.length,
  };
}

/**
 * Find excessive adverbs (-ly words)
 */
export function findAdverbs(text: string): HeuristicResult {
  const matches: HeuristicMatch[] = [];
  
  // Common -ly adverbs that weaken writing
  const adverbPattern = /\b\w+ly\b/gi;
  
  // Exceptions (words ending in -ly that aren't adverbs to avoid)
  const exceptions = [
    'early', 'daily', 'only', 'family', 'likely', 'lonely', 'lovely',
    'lively', 'ugly', 'silly', 'holy', 'jolly', 'belly', 'jelly',
  ];
  
  let match;
  while ((match = adverbPattern.exec(text)) !== null) {
    const word = match[0].toLowerCase();
    if (!exceptions.includes(word)) {
      matches.push({
        text: match[0],
        position: match.index,
        context: getContext(text, match.index, match[0].length),
        severity: 'suggestion',
      });
    }
  }
  
  return {
    category: 'line',
    type: 'adverbs',
    matches: matches.slice(0, 50),
    count: matches.length,
  };
}

/**
 * Find common clichés
 */
export function findCliches(text: string): HeuristicResult {
  const cliches = [
    'at the end of the day',
    'think outside the box',
    'low-hanging fruit',
    'time will tell',
    'only time will tell',
    'it goes without saying',
    'at this point in time',
    'the fact of the matter',
    'last but not least',
    'easier said than done',
    'when all is said and done',
    'took her breath away',
    'butterflies in (her|his|their) stomach',
    'heart skipped a beat',
    'weak in the knees',
    'time stood still',
    'lost in (her|his|their) eyes',
    'electricity between them',
    'chiseled jaw',
    'smoldering gaze',
    'raven hair',
    'porcelain skin',
  ];
  
  const matches: HeuristicMatch[] = [];
  
  for (const cliche of cliches) {
    const regex = new RegExp(cliche, 'gi');
    let match;
    while ((match = regex.exec(text)) !== null) {
      matches.push({
        text: match[0],
        position: match.index,
        context: getContext(text, match.index, match[0].length),
        severity: 'suggestion',
      });
    }
  }
  
  return {
    category: 'line',
    type: 'cliches',
    matches,
    count: matches.length,
  };
}

/**
 * Find dialogue tag issues
 */
export function findDialogueIssues(text: string): HeuristicResult {
  const matches: HeuristicMatch[] = [];
  
  // Find non-standard dialogue tags
  const dialoguePattern = /"[^"]+"\s+(\w+)\s+(said|asked|replied|answered|whispered|shouted|yelled|screamed|muttered|murmured)/gi;
  
  let match;
  while ((match = dialoguePattern.exec(text)) !== null) {
    const adverb = match[1];
    if (adverb.endsWith('ly')) {
      matches.push({
        text: match[0],
        position: match.index,
        context: getContext(text, match.index, match[0].length),
        severity: 'suggestion',
      });
    }
  }
  
  return {
    category: 'line',
    type: 'dialogue-tags',
    matches,
    count: matches.length,
  };
}

/**
 * Run all heuristic analyses on a text chunk
 */
export function analyzeTextHeuristics(text: string): HeuristicResult[] {
  return [
    findRepeatedWords(text),
    findRepeatedPhrases(text),
    findFilterWords(text),
    findPassiveVoice(text),
    findAdverbs(text),
    findCliches(text),
    findDialogueIssues(text),
  ].filter(result => result.count > 0); // Only return results with matches
}
