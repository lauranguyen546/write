import { prisma } from '@/lib/prisma';

export type NoteType = 'character' | 'setting' | 'plot' | 'theme' | 'custom';

export interface Note {
  id: string;
  projectId: string;
  type: NoteType;
  title: string;
  content: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateNoteInput {
  projectId: string;
  type: NoteType;
  title: string;
  content: string;
  tags?: string[];
}

export interface UpdateNoteInput {
  title?: string;
  content?: string;
  type?: NoteType;
  tags?: string[];
}

/**
 * Create a new note
 */
export async function createNote(input: CreateNoteInput): Promise<Note> {
  const note = await prisma.note.create({
    data: {
      projectId: input.projectId,
      type: input.type,
      title: input.title,
      content: input.content,
      tags: JSON.stringify(input.tags || []),
    },
  });

  return {
    ...note,
    type: note.type as NoteType,
    tags: JSON.parse(note.tags) as string[],
  };
}

/**
 * Get a note by ID
 */
export async function getNote(id: string): Promise<Note | null> {
  const note = await prisma.note.findUnique({
    where: { id },
  });

  if (!note) return null;

  return {
    ...note,
    type: note.type as NoteType,
    tags: JSON.parse(note.tags) as string[],
  };
}

/**
 * Get all notes for a project
 */
export async function getNotesByProject(
  projectId: string,
  filters?: {
    type?: NoteType;
    tags?: string[];
    searchTerm?: string;
  }
): Promise<Note[]> {
  const notes = await prisma.note.findMany({
    where: {
      projectId,
      ...(filters?.type && { type: filters.type }),
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  // Parse tags and apply filters
  let parsedNotes = notes.map(note => ({
    ...note,
    type: note.type as NoteType,
    tags: JSON.parse(note.tags) as string[],
  }));

  // Filter by tags if specified
  if (filters?.tags && filters.tags.length > 0) {
    parsedNotes = parsedNotes.filter(note =>
      filters.tags!.some(tag => note.tags.includes(tag))
    );
  }

  // Filter by search term if specified
  if (filters?.searchTerm) {
    const searchLower = filters.searchTerm.toLowerCase();
    parsedNotes = parsedNotes.filter(
      note =>
        note.title.toLowerCase().includes(searchLower) ||
        note.content.toLowerCase().includes(searchLower) ||
        note.tags.some(tag => tag.toLowerCase().includes(searchLower))
    );
  }

  return parsedNotes;
}

/**
 * Update a note
 */
export async function updateNote(
  id: string,
  input: UpdateNoteInput
): Promise<Note> {
  const updateData: any = {};

  if (input.title !== undefined) updateData.title = input.title;
  if (input.content !== undefined) updateData.content = input.content;
  if (input.type !== undefined) updateData.type = input.type;
  if (input.tags !== undefined) updateData.tags = JSON.stringify(input.tags);

  const note = await prisma.note.update({
    where: { id },
    data: updateData,
  });

  return {
    ...note,
    type: note.type as NoteType,
    tags: JSON.parse(note.tags) as string[],
  };
}

/**
 * Delete a note
 */
export async function deleteNote(id: string): Promise<void> {
  await prisma.note.delete({
    where: { id },
  });
}

/**
 * Get all unique tags used in a project's notes
 */
export async function getProjectTags(projectId: string): Promise<string[]> {
  const notes = await prisma.note.findMany({
    where: { projectId },
    select: { tags: true },
  });

  const allTags = new Set<string>();
  notes.forEach(note => {
    const tags = JSON.parse(note.tags) as string[];
    tags.forEach(tag => allTags.add(tag));
  });

  return Array.from(allTags).sort();
}

/**
 * Get notes count by type for a project
 */
export async function getNoteStatsByProject(projectId: string): Promise<{
  total: number;
  byType: Record<NoteType, number>;
}> {
  const notes = await prisma.note.findMany({
    where: { projectId },
    select: { type: true },
  });

  const stats = {
    total: notes.length,
    byType: {
      character: 0,
      setting: 0,
      plot: 0,
      theme: 0,
      custom: 0,
    } as Record<NoteType, number>,
  };

  notes.forEach(note => {
    stats.byType[note.type as NoteType]++;
  });

  return stats;
}

/**
 * Get notes context for AI analysis
 * Returns formatted note content to include in LLM prompts
 */
export async function getNotesContextForAI(projectId: string): Promise<string> {
  const notes = await getNotesByProject(projectId);

  if (notes.length === 0) {
    return '';
  }

  const sections: string[] = [];

  // Group notes by type
  const notesByType: Record<string, Note[]> = {};
  notes.forEach(note => {
    if (!notesByType[note.type]) {
      notesByType[note.type] = [];
    }
    notesByType[note.type].push(note);
  });

  // Format each type section
  Object.entries(notesByType).forEach(([type, typeNotes]) => {
    const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
    sections.push(`\n## ${typeLabel}s\n`);

    typeNotes.forEach(note => {
      sections.push(`### ${note.title}`);
      sections.push(note.content);
      if (note.tags.length > 0) {
        sections.push(`*Tags: ${note.tags.join(', ')}*`);
      }
      sections.push('');
    });
  });

  return `# Story Notes & Context\n${sections.join('\n')}`;
}
