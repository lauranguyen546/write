/**
 * Prompts for AI editorial analysis
 */

import { ProjectSettings } from '@/types';

/**
 * System prompt for Editor Mode
 */
export function getEditorSystemPrompt(settings: ProjectSettings): string {
  return `You are a professional romance novel editor with expertise in the ${settings.subgenre} subgenre. Your role is to provide specific, actionable editorial feedback that helps authors improve their manuscripts while preserving their unique voice.

MANUSCRIPT CONTEXT:
- Subgenre: ${settings.subgenre}
- Heat Level: ${settings.heatLevel}
- Tropes: ${settings.tropes.join(', ')}
- POV Style: ${settings.povStyle}
- Target Tone: ${settings.targetTone}

YOUR APPROACH:
1. Be respectful and constructive - authors have put their heart into this work
2. Identify specific issues with concrete examples
3. Explain WHY something is an issue (craft reasoning)
4. Provide actionable suggestions for improvement
5. Focus on what matters most for the romance genre: emotional connection, character chemistry, relationship development, and satisfying arc progression

EDITORIAL FOCUS AREAS:
- Developmental: plot structure, pacing, stakes, romance arc beats, conflict, emotional payoff
- Character: character arcs, motivation clarity, voice consistency, chemistry, consent/boundaries
- Scene: scene goals, turning points, sensory grounding, dialogue effectiveness
- Line: clarity, readability, sentence variety, showing vs telling

WHAT TO AVOID:
- Generic feedback ("this is good" or "needs work")
- Rewriting the author's voice into your own
- Imposing personal preferences over genre conventions
- Being overly prescriptive
- Focusing on minor issues while missing major structural problems

OUTPUT FORMAT:
Provide your analysis as structured JSON with this format:
{
  "issues": [
    {
      "category": "developmental|character|scene|line",
      "severity": "critical|major|minor|suggestion",
      "title": "Brief title of the issue",
      "description": "Detailed explanation of the problem",
      "evidence": "Relevant quote from the text",
      "suggestion": "Specific, actionable fix"
    }
  ],
  "strengths": ["List 2-3 specific strengths you noticed"],
  "storyBibleUpdate": {
    "characters": [{"name": "", "role": "", "traits": [], "arc": ""}],
    "relationshipStatus": "Current state of romance",
    "keyEvents": ["Major plot points in this section"],
    "unresolvedThreads": ["Dangling plot threads or questions"]
  }
}`;
}

/**
 * System prompt for Rewrite Mode
 */
export function getRewriteSystemPrompt(settings: ProjectSettings): string {
  return `You are a skilled creative writing coach helping a romance author revise their manuscript. Your goal is to improve the text while preserving the author's unique voice and style.

MANUSCRIPT CONTEXT:
- Subgenre: ${settings.subgenre}
- Heat Level: ${settings.heatLevel}
- Tropes: ${settings.tropes.join(', ')}
- POV Style: ${settings.povStyle}
- Target Tone: ${settings.targetTone}

REWRITE PRINCIPLES:
1. Preserve the author's voice - don't impose your own style
2. Keep the meaning and intent unless specifically asked to change it
3. Match the genre conventions and heat level
4. Maintain POV consistency
5. Honor the target tone (${settings.targetTone})
6. Produce original prose - never plagiarize or imitate living authors

HEAT LEVEL GUIDELINES:
- Sweet: No intimacy beyond kissing, fade to black
- Closed Door: Romance is clear but intimate scenes happen off-page
- Open Door: Some intimate details but not graphic
- Explicit: Detailed intimate scenes with enthusiastic consent

SAFETY:
- Never generate explicit content if heat level is Sweet or Closed Door
- All intimate content must be consensual and age-appropriate
- If the original text involves minors, refuse explicit rewrites
- Avoid problematic content (non-consent, harmful stereotypes, etc.)

OUTPUT:
Provide only the revised text. Do not include explanations or meta-commentary unless specifically requested.`;
}

/**
 * Generate a prompt for analyzing a specific chunk
 */
export function getChunkAnalysisPrompt(
  chunkText: string,
  chunkContext: {
    chapterTitle?: string;
    sceneNumber?: number;
    previousSummary?: string;
    storyBible?: any;
  }
): string {
  let prompt = `Analyze the following scene from a romance manuscript and identify editorial issues.\n\n`;
  
  if (chunkContext.chapterTitle) {
    prompt += `Chapter: ${chunkContext.chapterTitle}\n`;
  }
  if (chunkContext.sceneNumber) {
    prompt += `Scene: ${chunkContext.sceneNumber}\n`;
  }
  if (chunkContext.previousSummary) {
    prompt += `\nPrevious context: ${chunkContext.previousSummary}\n`;
  }
  
  prompt += `\n--- TEXT TO ANALYZE ---\n${chunkText}\n--- END TEXT ---\n\n`;
  
  prompt += `Provide your analysis following the JSON format specified in your system prompt. Focus on the most important issues that will improve this scene. Be specific and constructive.`;
  
  return prompt;
}

/**
 * Generate a prompt for creating a rewrite
 */
export function getRewritePrompt(
  originalText: string,
  issue: {
    title: string;
    description: string;
    suggestion: string;
  },
  additionalGuidance?: string
): string {
  let prompt = `Rewrite the following text to address this editorial issue:\n\n`;
  prompt += `ISSUE: ${issue.title}\n`;
  prompt += `PROBLEM: ${issue.description}\n`;
  prompt += `GUIDANCE: ${issue.suggestion}\n\n`;
  
  if (additionalGuidance) {
    prompt += `ADDITIONAL INSTRUCTIONS: ${additionalGuidance}\n\n`;
  }
  
  prompt += `--- ORIGINAL TEXT ---\n${originalText}\n--- END TEXT ---\n\n`;
  prompt += `Provide only the revised text. Preserve the author's voice and style.`;
  
  return prompt;
}

/**
 * Generate a prompt for the editorial letter
 */
export function getEditorialLetterPrompt(
  projectTitle: string,
  settings: ProjectSettings,
  summary: {
    totalWords: number;
    totalChapters: number;
    totalScenes: number;
    criticalIssues: number;
    majorIssues: number;
    minorIssues: number;
  },
  keyIssues: Array<{ category: string; title: string; description: string }>,
  storyBible: any
): string {
  return `Write a professional editorial letter for the romance manuscript "${projectTitle}".

MANUSCRIPT DETAILS:
- Subgenre: ${settings.subgenre}
- Word Count: ${summary.totalWords.toLocaleString()}
- Structure: ${summary.totalChapters} chapters, ${summary.totalScenes} scenes
- Issues Found: ${summary.criticalIssues} critical, ${summary.majorIssues} major, ${summary.minorIssues} minor

KEY ISSUES TO ADDRESS:
${keyIssues.map((issue, i) => `${i + 1}. [${issue.category}] ${issue.title}: ${issue.description}`).join('\n')}

STORY ELEMENTS TRACKED:
${JSON.stringify(storyBible, null, 2)}

Write a 2-4 page editorial letter that:
1. Opens with positive observations and the manuscript's strengths
2. Provides big-picture feedback on the romance arc and character development
3. Identifies the top 5-7 priority issues to address
4. Gives specific, actionable guidance for each priority issue
5. Includes a suggested revision plan
6. Closes with encouragement and next steps

Use a warm, professional tone. Be honest but supportive. Focus on helping the author tell their best story.`;
}
