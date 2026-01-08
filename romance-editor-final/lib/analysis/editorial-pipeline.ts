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

  // Save chunks to database
  await prisma.chunk.deleteMany({ where: { manuscriptId } });
  
  for (const chunk of chunksWithStructure) {
    await prisma.chunk.create({
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

  const heuristicResults: HeuristicResult[] = [];
  
  for (let i = 0; i < chunksWithStructure.length; i++) {
    const chunk = chunksWithStructure[i];
    const results = analyzeTextHeuristics(chunk.text);
    heuristicResults.push(...results);

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

  // Save heuristic findings as issues
  for (const result of heuristicResults) {
    for (const match of result.matches.slice(0, 5)) { // Limit per type
      await prisma.issue.create({
        data: {
          id: crypto.randomUUID(),
          projectId,
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
    }
  }

  onProgress?.({
    stage: 'heuristics',
    progress: 40,
    message: `Heuristics complete: found ${heuristicResults.reduce((sum, r) => sum + r.count, 0)} potential issues`,
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

    // Analyze chunks with LLM (sample a subset for MVP - every 3rd chunk)
    const chunksToAnalyze = chunksWithStructure.filter((_, i) => i % 3 === 0);
    
    for (let i = 0; i < chunksToAnalyze.length; i++) {
      const chunk = chunksToAnalyze[i];
      
      onProgress?.({
        stage: 'llm-analysis',
        progress: 45 + (i / chunksToAnalyze.length) * 40,
        currentChunk: i + 1,
        totalChunks: chunksToAnalyze.length,
        message: `Analyzing ${chunk.chapter || 'Scene'} with AI...`,
      });

      // Build context
      const previousSummary = i > 0 ? 
        chunksWithStructure[i - 1].text.substring(0, 200) + '...' : 
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
        
        // Save issues
        for (const issue of analysis.issues) {
          await prisma.issue.create({
            data: {
              id: crypto.randomUUID(),
              projectId,
              chunkId: (await prisma.chunk.findFirst({
                where: { manuscriptId, index: chunk.index },
              }))?.id,
              category: issue.category,
              severity: issue.severity,
              title: issue.title,
              description: issue.description,
              evidence: issue.evidence,
              suggestion: issue.suggestion,
            },
          });
        }

        // Update story bible
        if (analysis.storyBibleUpdate) {
          updateStoryBible(storyBible, analysis.storyBibleUpdate);
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
  try {
    // Try to extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return { issues: [], strengths: [], storyBibleUpdate: null };
  } catch (error) {
    console.error('Failed to parse LLM response:', error);
    return { issues: [], strengths: [], storyBibleUpdate: null };
  }
}

/**
 * Update story bible with new information
 */
function updateStoryBible(bible: StoryBible, update: any): void {
  if (update.characters) {
    for (const char of update.characters) {
      const existing = bible.characters.find(c => c.name === char.name);
      if (existing) {
        Object.assign(existing, char);
      } else {
        bible.characters.push(char);
      }
    }
  }

  if (update.relationshipStatus) {
    bible.relationshipStatus = update.relationshipStatus;
  }

  if (update.keyEvents) {
    bible.timeline.push(...update.keyEvents);
  }

  if (update.unresolvedThreads) {
    bible.unresolvedThreads = update.unresolvedThreads;
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
