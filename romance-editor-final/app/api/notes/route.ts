import { NextRequest, NextResponse } from 'next/server';
import {
  createNote,
  getNotesByProject,
  updateNote,
  deleteNote,
  type CreateNoteInput,
  type NoteType,
} from '@/lib/notes/notes-manager';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const type = searchParams.get('type') as NoteType | null;
    const searchTerm = searchParams.get('searchTerm');
    const tagsParam = searchParams.get('tags');

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      );
    }

    const tags = tagsParam ? tagsParam.split(',') : undefined;

    const notes = await getNotesByProject(projectId, {
      ...(type && { type }),
      ...(tags && { tags }),
      ...(searchTerm && { searchTerm }),
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const input: CreateNoteInput = {
      projectId: body.projectId,
      type: body.type,
      title: body.title,
      content: body.content || '',
      tags: body.tags || [],
    };

    if (!input.projectId || !input.type || !input.title) {
      return NextResponse.json(
        { error: 'projectId, type, and title are required' },
        { status: 400 }
      );
    }

    const note = await createNote(input);

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error('Error creating note:', error);
    return NextResponse.json(
      { error: 'Failed to create note' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Note id is required' },
        { status: 400 }
      );
    }

    const note = await updateNote(id, updates);

    return NextResponse.json(note);
  } catch (error) {
    console.error('Error updating note:', error);
    return NextResponse.json(
      { error: 'Failed to update note' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Note id is required' },
        { status: 400 }
      );
    }

    await deleteNote(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting note:', error);
    return NextResponse.json(
      { error: 'Failed to delete note' },
      { status: 500 }
    );
  }
}
