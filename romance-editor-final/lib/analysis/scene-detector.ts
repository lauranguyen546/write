/**
 * Scene and chapter detection using heuristics
 * Identifies structural breaks in the manuscript
 */

export interface SceneBreak {
  position: number;
  type: 'chapter' | 'scene' | 'pov-switch';
  title?: string;
  metadata?: {
    chapterNumber?: number;
    povCharacter?: string;
  };
}

/**
 * Detect chapter headings
 * Patterns:
 * - "Chapter 1", "Chapter One", "CHAPTER 1"
 * - "1", "One" (at start of line)
 * - Roman numerals: "I", "II", "III"
 * - Named chapters: "Chapter 1: The Beginning"
 */
function detectChapters(text: string): SceneBreak[] {
  const breaks: SceneBreak[] = [];
  const lines = text.split('\n');
  let currentPos = 0;
  
  const chapterPatterns = [
    /^(Chapter|CHAPTER|Ch\.?)\s+(\d+|One|Two|Three|Four|Five|Six|Seven|Eight|Nine|Ten|[IVX]+)(\s*[:\-–—]\s*(.+))?$/i,
    /^(Part|PART|Book|BOOK)\s+(\d+|One|Two|Three|Four|Five|[IVX]+)(\s*[:\-–—]\s*(.+))?$/i,
    /^(\d+|One|Two|Three|Four|Five|Six|Seven|Eight|Nine|Ten)(\s*[:\-–—]\s*(.+))?$/,
    /^([IVX]+)(\s*[:\-–—]\s*(.+))?$/,
  ];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) {
      currentPos += lines[i].length + 1;
      continue;
    }
    
    // Check each pattern
    for (const pattern of chapterPatterns) {
      const match = line.match(pattern);
      if (match) {
        const title = match[4] || match[3] || line;
        breaks.push({
          position: currentPos,
          type: 'chapter',
          title: title.trim(),
          metadata: {
            chapterNumber: breaks.filter(b => b.type === 'chapter').length + 1,
          },
        });
        break;
      }
    }
    
    currentPos += lines[i].length + 1;
  }
  
  return breaks;
}

/**
 * Detect scene breaks
 * Common markers:
 * - "***", "* * *", "###"
 * - Three or more blank lines
 * - Centered symbols or dashes
 */
function detectSceneBreaks(text: string): SceneBreak[] {
  const breaks: SceneBreak[] = [];
  const lines = text.split('\n');
  let currentPos = 0;
  let consecutiveBlankLines = 0;
  
  const sceneBreakPatterns = [
    /^\s*\*{3,}\s*$/,           // ***
    /^\s*\*\s+\*\s+\*\s*$/,     // * * *
    /^\s*#{3,}\s*$/,            // ###
    /^\s*-{3,}\s*$/,            // ---
    /^\s*~{3,}\s*$/,            // ~~~
    /^\s*[*#~-]{1,3}\s*$/,      // Single centered symbols
  ];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Count consecutive blank lines
    if (!line) {
      consecutiveBlankLines++;
      currentPos += lines[i].length + 1;
      continue;
    }
    
    // Three or more blank lines indicate a scene break
    if (consecutiveBlankLines >= 3) {
      breaks.push({
        position: currentPos - (consecutiveBlankLines * 2), // Approximate
        type: 'scene',
      });
    }
    consecutiveBlankLines = 0;
    
    // Check for explicit scene break markers
    for (const pattern of sceneBreakPatterns) {
      if (pattern.test(line)) {
        breaks.push({
          position: currentPos,
          type: 'scene',
        });
        break;
      }
    }
    
    currentPos += lines[i].length + 1;
  }
  
  return breaks;
}

/**
 * Detect POV switches
 * Look for:
 * - Character names in all caps or bold (common POV marker)
 * - Italicized character names
 * - Sudden time/location shifts
 */
function detectPOVSwitches(text: string): SceneBreak[] {
  const breaks: SceneBreak[] = [];
  const lines = text.split('\n');
  let currentPos = 0;
  
  // Common first names (simplified - in production, this would be more sophisticated)
  const namePattern = /^([A-Z][a-z]+)$/;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check if line is just a capitalized name (POV marker)
    const match = line.match(namePattern);
    if (match && line.length < 20) {
      // Likely a POV header
      breaks.push({
        position: currentPos,
        type: 'pov-switch',
        metadata: {
          povCharacter: match[1],
        },
      });
    }
    
    currentPos += lines[i].length + 1;
  }
  
  return breaks;
}

/**
 * Detect all structural breaks in the manuscript
 */
export function detectStructure(text: string): SceneBreak[] {
  const chapters = detectChapters(text);
  const scenes = detectSceneBreaks(text);
  const povSwitches = detectPOVSwitches(text);
  
  // Combine and sort by position
  const allBreaks = [...chapters, ...scenes, ...povSwitches].sort(
    (a, b) => a.position - b.position
  );
  
  // Remove duplicates (breaks within 100 characters of each other)
  const deduplicated: SceneBreak[] = [];
  for (const brk of allBreaks) {
    const isDuplicate = deduplicated.some(
      (existing) => Math.abs(existing.position - brk.position) < 100
    );
    if (!isDuplicate) {
      deduplicated.push(brk);
    }
  }
  
  return deduplicated;
}

/**
 * Assign chapter and scene labels to chunks based on detected breaks
 */
export function assignStructureToChunks<T extends { startChar: number; endChar: number }>(
  chunks: T[],
  breaks: SceneBreak[]
): (T & { chapter?: string; scene?: string })[] {
  let currentChapter: string | undefined;
  let currentScene = 1;
  let sceneInChapter = 1;
  
  const result = chunks.map((chunk) => {
    // Find breaks that occur before or within this chunk
    const relevantBreaks = breaks.filter(
      (b) => b.position >= chunk.startChar && b.position <= chunk.endChar
    );
    
    for (const brk of relevantBreaks) {
      if (brk.type === 'chapter') {
        currentChapter = brk.title || `Chapter ${brk.metadata?.chapterNumber || '?'}`;
        sceneInChapter = 1;
      } else if (brk.type === 'scene' || brk.type === 'pov-switch') {
        sceneInChapter++;
        currentScene++;
      }
    }
    
    return {
      ...chunk,
      chapter: currentChapter,
      scene: currentChapter
        ? `${currentChapter} - Scene ${sceneInChapter}`
        : `Scene ${currentScene}`,
    };
  });
  
  return result;
}

/**
 * Get a summary of the manuscript structure
 */
export interface StructureSummary {
  totalChapters: number;
  totalScenes: number;
  averageScenesPerChapter: number;
  chapters: {
    title: string;
    position: number;
    sceneCount: number;
  }[];
}

export function getStructureSummary(breaks: SceneBreak[]): StructureSummary {
  const chapters = breaks.filter((b) => b.type === 'chapter');
  const scenes = breaks.filter((b) => b.type === 'scene' || b.type === 'pov-switch');
  
  const chapterSummaries = chapters.map((chapter, index) => {
    const nextChapter = chapters[index + 1];
    const scenesInChapter = scenes.filter(
      (s) =>
        s.position >= chapter.position &&
        (!nextChapter || s.position < nextChapter.position)
    );
    
    return {
      title: chapter.title || `Chapter ${index + 1}`,
      position: chapter.position,
      sceneCount: scenesInChapter.length,
    };
  });
  
  return {
    totalChapters: chapters.length,
    totalScenes: scenes.length,
    averageScenesPerChapter:
      chapters.length > 0 ? scenes.length / chapters.length : 0,
    chapters: chapterSummaries,
  };
}
