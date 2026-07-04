/**
 * Editorial analysis pipeline
 * Orchestrates chunking, heuristics, and LLM analysis
 */

import { prisma } from '@/lib/prisma';
import { ProjectSettings, StoryBible, ArcTracker } from '@/types';
import { chunkText, ChunkData } from './chunker';
import { detectStructure, assignStructureToChunks } from './scene-detector';
import { analyzeTextHeuristics, HeuristicResult } from './heuristics';
import { getLLMClientFromEnv } from '@/lib/llm/client';
import { getEditorSystemPrompt, getChunkAnalysisPrompt } from './prompts';
import { locateEvidence } from './evidence-locator';

export interface AnalysisProgress {
  stage: 'chunking' | 'heuristics' | 'llm-analysis' | 'synthesis' | 'complete';
  progress: number; // 0-100
  currentChunk?: number;
  totalChunks?: number;
  message: string;
}

export type ProgressCallback = (progress: AnalysisProgress) => void;

/**
 * Main analysis function that processes a manuscript
 */
export async function analyzeManuscript(
  projectId: string,
  manuscriptId: string,
  onProgress?: ProgressCallback
): Promise<void> {
  // Fetch project and manuscript
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { manuscripts: { where: { id: manuscriptId } } },
  });

  if (!project || project.manuscripts.length === 0) {
    throw new Error('Project or manuscript not found');
  }

  const manuscript = project.manuscripts[0];
  const settings: ProjectSettings = JSON.parse(project.settingsJson);
  const text = manuscript.originalText;

  // Initialize story bible and arc tracker
  let storyBible: StoryBible = {
    characters: [],
    relationshipStatus: '',
    timeline: [],
    settings: [],
    povMap: {},
    unresolvedThreads: [],
  };

  let arcTracker: ArcTracker = {
    romanceBeats: [],
    subplotBeats: [],
  };

  // STAGE 1: Chunking
  onProgress?.({
    stage: 'chunking',
    progress: 5,
    message: 'Splitting manuscript into chunks...',
  });

  const chunks = chunkText(text, 1000, 200);
  
  // Detect structure
  const structureBreaks = detectStructure(text);
  const chunksWithStructure = assignStructureToChunks(chunks, structureBreaks);

  // Save chunks to database, keeping ids so issues can link back to them
  await prisma.chunk.deleteMany({ where: { manuscriptId } });

  const chunkIdByIndex = new Map<number, string>();
  for (const chunk of chunksWithStructure) {
    const created = await prisma.chunk.create({
      data: {
        id: crypto.randomUUID(),
        manuscriptId,
        index: chunk.index,
        text: chunk.text,
        chapter: chunk.chapter,
        scene: chunk.scene,
        startChar: chunk.startChar,
        endChar: chunk.endChar,
      },
    });
    chunkIdByIndex.set(chunk.index, created.id);
  }

  onProgress?.({
    stage: 'chunking',
    progress: 15,
    message: `Created ${chunks.length} chunks across ${structureBreaks.length} structural breaks`,
    totalChunks: chunks.length,
  });

  // STAGE 2: Heuristics Analysis
  onProgress?.({
    stage: 'heuristics',
    progress: 20,
    message: 'Running local heuristics analysis...',
  });

  let heuristicIssueCount = 0;

  for (let i = 0; i < chunksWithStructure.length; i++) {
    const chunk = chunksWithStructure[i];
    const results = analyzeTextHeuristics(chunk.text);

    // Save findings as issues linked to their chunk. Positions are
    // chunk-relative (the viewer resolves them via chunk.startChar).
    for (const result of results) {
      for (const match of result.matches.slice(0, 5)) { // Limit per type per chunk
        await prisma.issue.create({
          data: {
            id: crypto.randomUUID(),
            projectId,
            chunkId: chunkIdByIndex.get(chunk.index),
            category: result.category,
            severity: match.severity,
            title: `${result.type}: "${match.text}"`,
            description: `Found ${result.type.replace('-', ' ')} that may weaken the prose.`,
            evidence: match.context,
            suggestion: getSuggestionForHeuristic(result.type, match.text),
            startChar: match.position,
            endChar: match.position + match.text.length,
          },
        });
        heuristicIssueCount++;
      }
    }

    if (i % 10 === 0) {
      onProgress?.({
        stage: 'heuristics',
        progress: 20 + (i / chunksWithStructure.length) * 20,
        currentChunk: i + 1,
        totalChunks: chunksWithStructure.length,
        message: `Analyzing chunk ${i + 1} of ${chunksWithStructure.length}...`,
      });
    }
  }

  onProgress?.({
    stage: 'heuristics',
    progress: 40,
    message: `Heuristics complete: found ${heuristicIssueCount} potential issues`,
  });

  // STAGE 3: LLM Analysis
  onProgress?.({
    stage: 'llm-analysis',
    progress: 45,
    message: 'Starting AI editorial analysis...',
  });

  try {
    const llmClient = await getLLMClientFromEnv();
    const systemPrompt = getEditorSystemPrompt(settings);

    // Sampling rate: analyze every Nth chunk. Default 3; set
    // LLM_CHUNK_SAMPLING=1 in .env for full coverage (better story
    // bible and beat detection at ~3x the API cost).
    const samplingRate = Math.max(1, parseInt(process.env.LLM_CHUNK_SAMPLING || '3', 10) || 3);
    const chunksToAnalyze = chunksWithStructure.filter((_, i) => i % samplingRate === 0);

    for (let i = 0; i < chunksToAnalyze.length; i++) {
      const chunk = chunksToAnalyze[i];

      onProgress?.({
        stage: 'llm-analysis',
        progress: 45 + (i / chunksToAnalyze.length) * 40,
        currentChunk: i + 1,
        totalChunks: chunksToAnalyze.length,
        message: `Analyzing ${chunk.chapter || 'Scene'} with AI...`,
      });

      // Build context from the previously analyzed chunk
      const previousSummary = i > 0 ?
        chunksToAnalyze[i - 1].text.substring(0, 200) + '...' :
        undefined;

      const prompt = getChunkAnalysisPrompt(chunk.text, {
        chapterTitle: chunk.chapter,
        sceneNumber: chunk.index + 1,
        previousSummary,
        storyBible,
      });

      try {
        const response = await llmClient.complete([
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ]);

        // Parse response
        const analysis = parseAnalysisResponse(response.content);

        // Save issues, anchoring each to its exact position in the
        // chunk so the manuscript viewer can highlight it
        for (const issue of analysis.issues) {
          const anchor = locateEvidence(chunk.text, issue.evidence);
          await prisma.issue.create({
            data: {
              id: crypto.randomUUID(),
              projectId,
              chunkId: chunkIdByIndex.get(chunk.index),
              category: issue.category,
              severity: issue.severity,
              title: issue.title,
              description: issue.description,
              evidence: issue.evidence,
              suggestion: issue.suggestion,
              startChar: anchor?.start,
              endChar: anchor?.end,
            },
          });
        }

        // Update story bible and romance beat tracker
        if (analysis.storyBibleUpdate) {
          updateStoryBible(storyBible, analysis.storyBibleUpdate, chunk);
          updateArcTracker(arcTracker, analysis.storyBibleUpdate, chunk);
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Error analyzing chunk ${i}:`, error);
        // Continue with next chunk
      }
    }

  } catch (error) {
    console.error('LLM analysis error:', error);
    onProgress?.({
      stage: 'llm-analysis',
      progress: 85,
      message: 'AI analysis skipped (API error). Using heuristics only.',
    });
  }

  // STAGE 4: Synthesis
  onProgress?.({
    stage: 'synthesis',
    progress: 90,
    message: 'Synthesizing results...',
  });

  // Store story bible summary
  const firstChunk = await prisma.chunk.findFirst({
    where: { manuscriptId },
    orderBy: { index: 'asc' },
  });

  if (firstChunk) {
    await prisma.chunk.update({
      where: { id: firstChunk.id },
      data: {
        summaryJson: JSON.stringify({
          storyBible,
          arcTracker,
        }),
      },
    });
  }

  // COMPLETE
  onProgress?.({
    stage: 'complete',
    progress: 100,
    message: 'Analysis complete!',
  });
}

/**
 * Parse LLM response into structured data
 */
function parseAnalysisResponse(content: string): any {
  const empty = { issues: [], strengths: [], storyBibleUpdate: null };
  try {
    // Strip markdown code fences if present
    const cleaned = content.replace(/```(?:json)?/g, '');
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        issues: Array.isArray(parsed.issues) ? parsed.issues : [],
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
        storyBibleUpdate: parsed.storyBibleUpdate ?? null,
      };
    }
    console.error('LLM response contained no JSON object:', content.slice(0, 200));
    return empty;
  } catch (error) {
    console.error('Failed to parse LLM response:', error, content.slice(0, 200));
    return empty;
  }
}

/**
 * Update story bible with new information from a chunk's analysis
 */
function updateStoryBible(
  bible: StoryBible,
  update: any,
  chunk: { chapter?: string; scene?: string; index: number }
): void {
  const location = chunk.chapter || chunk.scene || `Scene ${chunk.index + 1}`;

  if (Array.isArray(update.characters)) {
    for (const char of update.characters) {
      if (!char?.name) continue;
      const existing = bible.characters.find(
        c => c.name.toLowerCase() === char.name.toLowerCase()
      );
      if (existing) {
        // Merge rather than overwrite: keep known traits, add new ones
        if (char.role) existing.role = char.role;
        if (char.arc) existing.arc = char.arc;
        if (Array.isArray(char.traits)) {
          for (const trait of char.traits) {
            if (!existing.traits.includes(trait)) existing.traits.push(trait);
          }
        }
      } else {
        bible.characters.push({
          name: char.name,
          role: char.role || 'unknown',
          traits: Array.isArray(char.traits) ? char.traits : [],
          arc: char.arc || '',
        });
      }
    }
  }

  if (update.relationshipStatus) {
    bible.relationshipStatus = update.relationshipStatus;
  }

  if (Array.isArray(update.keyEvents)) {
    bible.timeline.push(...update.keyEvents.filter((e: any) => typeof e === 'string'));
  }

  if (Array.isArray(update.unresolvedThreads)) {
    for (const thread of update.unresolvedThreads) {
      if (typeof thread === 'string' && !bible.unresolvedThreads.includes(thread)) {
        bible.unresolvedThreads.push(thread);
      }
    }
  }

  // Settings/locations mentioned in this chunk
  if (Array.isArray(update.locations)) {
    for (const loc of update.locations) {
      if (typeof loc === 'string' && !bible.settings.includes(loc)) {
        bible.settings.push(loc);
      }
    }
  }

  // POV character for this chunk
  if (typeof update.povCharacter === 'string' && update.povCharacter) {
    if (!bible.povMap[update.povCharacter]) {
      bible.povMap[update.povCharacter] = [];
    }
    if (!bible.povMap[update.povCharacter].includes(location)) {
      bible.povMap[update.povCharacter].push(location);
    }
  }
}

/**
 * Merge detected romance beats into the arc tracker. The prompt asks
 * for canonical Romancing the Beat names; first detection of each
 * beat wins (earliest location in the manuscript).
 */
function updateArcTracker(
  tracker: ArcTracker,
  update: any,
  chunk: { chapter?: string; scene?: string; index: number }
): void {
  const location = chunk.chapter || chunk.scene || `Scene ${chunk.index + 1}`;

  if (Array.isArray(update.romanceBeats)) {
    for (const beat of update.romanceBeats) {
      const name = typeof beat === 'string' ? beat : beat?.beat;
      if (!name) continue;
      const exists = tracker.romanceBeats.find(
        b => b.beat.toLowerCase() === name.toLowerCase()
      );
      if (!exists) {
        tracker.romanceBeats.push({
          beat: name,
          location,
          present: true,
        });
      }
    }
  }
}

/**
 * Get suggestion text for heuristic type
 */
function getSuggestionForHeuristic(type: string, text: string): string {
  const suggestions: { [key: string]: string } = {
    'repeated-words': `Consider using a synonym or rephrasing to avoid repeating "${text}" in close proximity.`,
    'repeated-phrases': `This phrase appears multiple times. Consider varying your language to keep the prose fresh.`,
    'filter-words': `"${text}" is a filter word that can weaken your prose. Consider removing it or finding a stronger verb.`,
    'passive-voice': `Consider revising to active voice for stronger, more direct prose.`,
    'adverbs': `"${text}" is an adverb. Consider using a stronger verb instead or showing the action rather than telling.`,
    'cliches': `This is a common cliché in romance. Consider finding a fresh, original way to express this idea.`,
    'dialogue-tags': `Consider using a simpler dialogue tag or letting the dialogue speak for itself.`,
  };

  return suggestions[type] || 'Consider revising this for stronger prose.';
}
