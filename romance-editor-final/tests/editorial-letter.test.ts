import { generateEditorialLetter, EditorialLetterData } from '../lib/export/editorial-letter';

describe('Editorial Letter Generator', () => {
  const sampleData: EditorialLetterData = {
    projectTitle: 'Test Romance Novel',
    settings: {
      subgenre: 'contemporary',
      heatLevel: 'open-door',
      tropes: ['enemies-to-lovers', 'forced-proximity'],
      povStyle: 'dual-pov',
      targetTone: 'punchy',
    },
    manuscript: {
      wordCount: 75000,
      chapterCount: 20,
      sceneCount: 45,
    },
    issues: {
      critical: 3,
      major: 8,
      minor: 15,
      suggestion: 25,
    },
    topIssues: [
      {
        category: 'developmental',
        title: 'Weak midpoint turning point',
        description: 'The midpoint lacks emotional impact',
        suggestion: 'Add a major revelation or betrayal',
      },
      {
        category: 'character',
        title: 'Unclear protagonist motivation',
        description: 'Reader may not understand why protagonist makes key decisions',
        suggestion: 'Show internal conflict more clearly',
      },
    ],
    strengths: ['Strong dialogue', 'Excellent chemistry', 'Vivid setting'],
  };

  test('should generate complete editorial letter', () => {
    const letter = generateEditorialLetter(sampleData);
    
    expect(letter).toBeTruthy();
    expect(letter.length).toBeGreaterThan(100);
  });

  test('should include project title', () => {
    const letter = generateEditorialLetter(sampleData);
    
    expect(letter).toContain('Test Romance Novel');
  });

  test('should include manuscript metadata', () => {
    const letter = generateEditorialLetter(sampleData);
    
    expect(letter).toContain('75,000 words');
    expect(letter).toContain('20 chapters');
    expect(letter).toContain('45 scenes');
  });

  test('should include genre information', () => {
    const letter = generateEditorialLetter(sampleData);
    
    expect(letter).toContain('contemporary');
    expect(letter).toContain('open-door');
    expect(letter).toContain('enemies-to-lovers');
    expect(letter).toContain('forced-proximity');
  });

  test('should include issue counts', () => {
    const letter = generateEditorialLetter(sampleData);
    
    expect(letter).toContain('3'); // critical count
    expect(letter).toContain('8'); // major count
    expect(letter).toContain('15'); // minor count
    expect(letter).toContain('25'); // suggestion count
  });

  test('should include top issues', () => {
    const letter = generateEditorialLetter(sampleData);
    
    expect(letter).toContain('Weak midpoint turning point');
    expect(letter).toContain('Unclear protagonist motivation');
  });

  test('should include strengths if provided', () => {
    const letter = generateEditorialLetter(sampleData);
    
    expect(letter).toContain('Strong dialogue');
    expect(letter).toContain('Excellent chemistry');
    expect(letter).toContain('Vivid setting');
  });

  test('should include revision plan', () => {
    const letter = generateEditorialLetter(sampleData);
    
    expect(letter).toContain('Revision Plan');
    expect(letter).toContain('First Pass');
    expect(letter).toContain('Second Pass');
  });

  test('should handle data without strengths', () => {
    const dataWithoutStrengths = { ...sampleData, strengths: undefined };
    const letter = generateEditorialLetter(dataWithoutStrengths);
    
    expect(letter).toBeTruthy();
    expect(letter).toContain('Test Romance Novel');
  });

  test('should include genre-specific guidance', () => {
    const letter = generateEditorialLetter(sampleData);
    
    // Contemporary romance should mention modern conflicts
    expect(letter.toLowerCase()).toContain('contemporary');
  });

  test('should format as markdown', () => {
    const letter = generateEditorialLetter(sampleData);
    
    expect(letter).toContain('# '); // Headers
    expect(letter).toContain('## '); // Subheaders
    expect(letter).toContain('**'); // Bold
  });
});
