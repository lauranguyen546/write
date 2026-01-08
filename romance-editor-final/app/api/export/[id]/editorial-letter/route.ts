import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateEditorialLetter, EditorialLetterData } from '@/lib/export/editorial-letter';
import { ProjectSettings } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;

    // Fetch project with all related data
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        manuscripts: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            chunks: {
              select: {
                chapter: true,
                scene: true,
              },
            },
          },
        },
        issues: {
          include: {
            chunk: {
              select: {
                chapter: true,
                scene: true,
              },
            },
          },
          orderBy: [
            { severity: 'desc' },
            { createdAt: 'asc' },
          ],
        },
      },
    });

    if (!project || project.manuscripts.length === 0) {
      return NextResponse.json(
        { error: 'Project or manuscript not found' },
        { status: 404 }
      );
    }

    const manuscript = project.manuscripts[0];
    const settings: ProjectSettings = JSON.parse(project.settingsJson);

    // Count chapters and scenes
    const chapters = new Set(
      manuscript.chunks.map(c => c.chapter).filter(Boolean)
    );
    const scenes = new Set(
      manuscript.chunks.map(c => c.scene).filter(Boolean)
    );

    // Count issues by severity
    const issuesBySeverity = {
      critical: project.issues.filter(i => i.severity === 'critical').length,
      major: project.issues.filter(i => i.severity === 'major').length,
      minor: project.issues.filter(i => i.severity === 'minor').length,
      suggestion: project.issues.filter(i => i.severity === 'suggestion').length,
    };

    // Get top issues (max 10)
    const topIssues = project.issues
      .filter(i => i.severity === 'critical' || i.severity === 'major')
      .slice(0, 10)
      .map(issue => ({
        category: issue.category,
        title: issue.title,
        description: issue.description,
        suggestion: issue.suggestion || 'Review and revise as needed.',
      }));

    // Word count
    const wordCount = manuscript.originalText.split(/\s+/).length;

    const letterData: EditorialLetterData = {
      projectTitle: project.title,
      settings,
      manuscript: {
        wordCount,
        chapterCount: chapters.size,
        sceneCount: scenes.size,
      },
      issues: issuesBySeverity,
      topIssues,
    };

    const letter = generateEditorialLetter(letterData);

    // Return as downloadable file
    return new NextResponse(letter, {
      headers: {
        'Content-Type': 'text/markdown',
        'Content-Disposition': `attachment; filename="editorial-letter-${project.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md"`,
      },
    });
  } catch (error) {
    console.error('Error generating editorial letter:', error);
    return NextResponse.json(
      { error: 'Failed to generate editorial letter' },
      { status: 500 }
    );
  }
}
