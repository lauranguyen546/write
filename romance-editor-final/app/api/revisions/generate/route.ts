import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getLLMClientFromEnv } from '@/lib/llm/client';
import { getRewriteSystemPrompt, getRewritePrompt } from '@/lib/analysis/prompts';
import { ProjectSettings } from '@/types';
import * as Diff from 'diff';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { issueId, additionalGuidance } = body;

    if (!issueId) {
      return NextResponse.json(
        { error: 'Issue ID is required' },
        { status: 400 }
      );
    }

    // Fetch issue with project settings
    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
      include: {
        project: true,
      },
    });

    if (!issue) {
      return NextResponse.json(
        { error: 'Issue not found' },
        { status: 404 }
      );
    }

    // Get original text (from evidence field or chunk)
    let originalText = issue.evidence || '';
    
    if (!originalText && issue.chunkId) {
      const chunk = await prisma.chunk.findUnique({
        where: { id: issue.chunkId },
      });
      
      if (chunk) {
        // Extract relevant portion based on position
        const start = Math.max(0, (issue.startChar || 0) - 100);
        const end = Math.min(chunk.text.length, (issue.endChar || chunk.text.length) + 100);
        originalText = chunk.text.substring(start, end);
      }
    }

    if (!originalText) {
      return NextResponse.json(
        { error: 'Could not find text to rewrite' },
        { status: 400 }
      );
    }

    // Initialize LLM client
    const llmClient = await getLLMClientFromEnv();
    const settings: ProjectSettings = JSON.parse(issue.project.settingsJson);
    
    // Generate rewrite
    const systemPrompt = getRewriteSystemPrompt(settings);
    const userPrompt = getRewritePrompt(
      originalText,
      {
        title: issue.title,
        description: issue.description,
        suggestion: issue.suggestion || '',
      },
      additionalGuidance
    );

    const response = await llmClient.complete([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    const suggestedText = response.content.trim();

    // Generate diff
    const diff = Diff.diffWords(originalText, suggestedText);
    const diffJson = JSON.stringify(diff);

    // Create revision
    const revision = await prisma.revision.create({
      data: {
        id: crypto.randomUUID(),
        issueId,
        originalText,
        suggestedText,
        diffJson,
        status: 'proposed',
      },
    });

    return NextResponse.json({
      revision: {
        id: revision.id,
        originalText: revision.originalText,
        suggestedText: revision.suggestedText,
        status: revision.status,
        createdAt: revision.createdAt,
      },
    });
  } catch (error) {
    console.error('Error generating rewrite:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate rewrite' },
      { status: 500 }
    );
  }
}
