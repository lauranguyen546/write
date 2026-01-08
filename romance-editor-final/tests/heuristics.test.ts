import {
  findRepeatedWords,
  findFilterWords,
  findPassiveVoice,
  findAdverbs,
  findCliches,
} from '../lib/analysis/heuristics';

describe('Heuristics Analysis', () => {
  test('findRepeatedWords should detect repeated words', () => {
    const text = 'She walked to the store. She bought some bread. She walked home.';
    const result = findRepeatedWords(text, 100);

    expect(result.count).toBeGreaterThan(0);
    expect(result.type).toBe('repeated-words');
    const matchedWords = result.matches.map(m => m.text.toLowerCase());
    expect(matchedWords).toContain('walked');
  });

  test('findFilterWords should detect filter words', () => {
    const text = 'She just really wanted to go. It was very important.';
    const result = findFilterWords(text);

    expect(result.count).toBeGreaterThan(0);
    const matchedWords = result.matches.map(m => m.text.toLowerCase());
    expect(matchedWords.some(w => ['just', 'really', 'very'].includes(w))).toBe(true);
  });

  test('findPassiveVoice should detect passive constructions', () => {
    const text = 'The ball was thrown by John. The cake was eaten.';
    const result = findPassiveVoice(text);

    expect(result.count).toBeGreaterThan(0);
    expect(result.type).toBe('passive-voice');
  });

  test('findAdverbs should detect -ly adverbs', () => {
    const text = 'She walked quickly. He spoke softly and slowly.';
    const result = findAdverbs(text);

    expect(result.count).toBeGreaterThan(0);
    const matchedWords = result.matches.map(m => m.text.toLowerCase());
    expect(matchedWords).toContain('quickly');
    expect(matchedWords).toContain('softly');
  });

  test('findAdverbs should exclude non-adverb -ly words', () => {
    const text = 'The early bird gets the worm. She is lovely.';
    const result = findAdverbs(text);

    const matchedWords = result.matches.map(m => m.text.toLowerCase());
    expect(matchedWords).not.toContain('early');
    expect(matchedWords).not.toContain('lovely');
  });

  test('findCliches should detect common clichés', () => {
    const text = 'Her heart skipped a beat when she saw him. Time stood still.';
    const result = findCliches(text);

    expect(result.count).toBeGreaterThan(0);
  });

  test('heuristics should include context', () => {
    const text = 'The very quick brown fox jumps over the lazy dog.';
    const result = findFilterWords(text);

    expect(result.matches.length).toBeGreaterThan(0);
    expect(result.matches[0].context).toBeTruthy();
    expect(result.matches[0].context).toContain('very');
  });

  test('should handle empty text', () => {
    const result = findRepeatedWords('');
    expect(result.count).toBe(0);
    expect(result.matches.length).toBe(0);
  });

  test('should handle text with no issues', () => {
    const text = 'The cat sat on the mat.';
    const results = [
      findFilterWords(text),
      findPassiveVoice(text),
      findCliches(text),
    ];

    for (const result of results) {
      expect(result.matches.length).toBe(0);
    }
  });
});
