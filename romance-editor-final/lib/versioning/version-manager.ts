import { createHash } from 'crypto';
import { prisma } from '@/lib/prisma';
import {
  generateCleanManuscript,
  AcceptedRevision,
  Chunk,
} from '@/lib/export/manuscript-exporter';

export interface VersionSummary {
  id: string;
  versionNumber: number;
  description: string | null;
  wordCount: number;
  createdBy: string;
  createdAt: Date;
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function hashContent(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

/**
 * Compose the manuscript's current state: original text with all
 * accepted revisions applied (same composition the clean export uses).
 */
export async function composeCurrentText(projectId: string): Promise<string | null> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      manuscripts: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: { chunks: { orderBy: { index: 'asc' } } },
      },
      issues: {
        include: { revisions: { where: { status: 'accepted' } } },
      },
    },
  });

  if (!project || project.manuscripts.length === 0) return null;

  const manuscript = project.manuscripts[0];

  const chunks: Chunk[] = manuscript.chunks.map((c) => ({
    index: c.index,
    text: c.text,
    startChar: c.startChar,
    endChar: c.endChar,
    chapter: c.chapter || undefined,
    scene: c.scene || undefined,
  }));

  const acceptedRevisions: AcceptedRevision[] = [];
  for (const issue of project.issues) {
    for (const revision of issue.revisions) {
      if (issue.chunkId) {
        acceptedRevisions.push({
          chunkId: issue.chunkId,
          startChar: issue.startChar || 0,
          endChar: issue.endChar || 0,
          originalText: revision.originalText,
          suggestedText: revision.suggestedText,
        });
      }
    }
  }

  return generateCleanManuscript(manuscript.originalText, chunks, acceptedRevisions);
}

/**
 * Snapshot the current manuscript state. Deduplicates: if the content
 * hash matches the latest version, no new version is created and the
 * existing one is returned with `created: false`.
 */
export async function createVersion(
  projectId: string,
  description: string | null,
  createdBy: 'user' | 'auto-accept' = 'user'
): Promise<{ version: VersionSummary; created: boolean } | null> {
  const content = await composeCurrentText(projectId);
  if (content == null) return null;

  const contentHash = hashContent(content);

  const latest = await prisma.manuscriptVersion.findFirst({
    where: { projectId },
    orderBy: { versionNumber: 'desc' },
  });

  if (latest && latest.contentHash === contentHash) {
    return {
      version: {
        id: latest.id,
        versionNumber: latest.versionNumber,
        description: latest.description,
        wordCount: latest.wordCount,
        createdBy: latest.createdBy,
        createdAt: latest.createdAt,
      },
      created: false,
    };
  }

  const version = await prisma.manuscriptVersion.create({
    data: {
      projectId,
      versionNumber: (latest?.versionNumber ?? 0) + 1,
      content,
      contentHash,
      wordCount: countWords(content),
      description,
      createdBy,
    },
  });

  return {
    version: {
      id: version.id,
      versionNumber: version.versionNumber,
      description: version.description,
      wordCount: version.wordCount,
      createdBy: version.createdBy,
      createdAt: version.createdAt,
    },
    created: true,
  };
}

/**
 * List a project's versions, newest first (metadata only — content is
 * fetched per-version to keep the list light).
 */
export async function listVersions(projectId: string): Promise<VersionSummary[]> {
  return prisma.manuscriptVersion.findMany({
    where: { projectId },
    orderBy: { versionNumber: 'desc' },
    select: {
      id: true,
      versionNumber: true,
      description: true,
      wordCount: true,
      createdBy: true,
      createdAt: true,
    },
  });
}

/**
 * Fetch a single version including its full content.
 */
export async function getVersion(id: string) {
  return prisma.manuscriptVersion.findUnique({ where: { id } });
}
