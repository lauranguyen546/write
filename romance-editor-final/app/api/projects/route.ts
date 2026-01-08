import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ProjectSettings } from '@/types';

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        manuscripts: true,
        issues: true,
      },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, settings } = body as {
      title: string;
      settings: ProjectSettings;
    };

    if (!title || !settings) {
      return NextResponse.json(
        { error: 'Title and settings are required' },
        { status: 400 }
      );
    }

    const project = await prisma.project.create({
      data: {
        id: crypto.randomUUID(),
        title,
        settingsJson: JSON.stringify(settings),
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
