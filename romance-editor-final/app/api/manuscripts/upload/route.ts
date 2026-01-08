import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseTextManuscript, validateManuscriptSize } from '@/lib/processing/text-parser';
import { parseDocxManuscript, isValidDocx } from '@/lib/processing/docx-parser';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const projectId = formData.get('projectId') as string;
    const file = formData.get('file') as File | null;
    const pastedText = formData.get('pastedText') as string | null;

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    let parsed;

    // Handle file upload
    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileName = file.name.toLowerCase();

      if (fileName.endsWith('.docx')) {
        if (!isValidDocx(buffer)) {
          return NextResponse.json(
            { error: 'Invalid DOCX file' },
            { status: 400 }
          );
        }
        parsed = await parseDocxManuscript(buffer);
      } else if (fileName.endsWith('.txt') || fileName.endsWith('.md')) {
        const text = buffer.toString('utf-8');
        parsed = parseTextManuscript(text);
      } else {
        return NextResponse.json(
          { error: 'Unsupported file type. Please upload .txt, .md, or .docx' },
          { status: 400 }
        );
      }
    }
    // Handle pasted text
    else if (pastedText) {
      parsed = parseTextManuscript(pastedText);
    } else {
      return NextResponse.json(
        { error: 'No file or text provided' },
        { status: 400 }
      );
    }

    // Validate manuscript size
    const sizeValidation = validateManuscriptSize(parsed.metadata.wordCount);
    if (!sizeValidation.valid) {
      return NextResponse.json(
        { error: sizeValidation.error },
        { status: 400 }
      );
    }

    // Create manuscript in database
    const manuscript = await prisma.manuscript.create({
      data: {
        id: crypto.randomUUID(),
        projectId,
        originalText: parsed.text,
      },
    });

    return NextResponse.json({
      manuscript,
      metadata: parsed.metadata,
    });
  } catch (error) {
    console.error('Error uploading manuscript:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload manuscript' },
      { status: 500 }
    );
  }
}
