import { NextRequest, NextResponse } from 'next/server';
import {
  createRule,
  getRulesByProject,
  updateRule,
  deleteRule,
  toggleRule,
  getSuggestedRules,
  type CreateRuleInput,
  type RuleCategory,
} from '@/lib/rules/writing-rules-manager';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const category = searchParams.get('category') as RuleCategory | null;
    const enabled = searchParams.get('enabled');
    const getSuggestions = searchParams.get('suggestions');

    // Return suggested rules
    if (getSuggestions === 'true') {
      return NextResponse.json(getSuggestedRules());
    }

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      );
    }

    const rules = await getRulesByProject(projectId, {
      ...(category && { category }),
      ...(enabled !== null && { enabled: enabled === 'true' }),
    });

    return NextResponse.json(rules);
  } catch (error) {
    console.error('Error fetching rules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rules' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const input: CreateRuleInput = {
      projectId: body.projectId,
      category: body.category,
      rule: body.rule,
      examples: body.examples || [],
      priority: body.priority,
      enabled: body.enabled,
    };

    if (!input.projectId || !input.category || !input.rule) {
      return NextResponse.json(
        { error: 'projectId, category, and rule are required' },
        { status: 400 }
      );
    }

    const rule = await createRule(input);

    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    console.error('Error creating rule:', error);
    return NextResponse.json(
      { error: 'Failed to create rule' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, toggle, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Rule id is required' },
        { status: 400 }
      );
    }

    // Handle toggle action
    if (toggle) {
      const rule = await toggleRule(id);
      return NextResponse.json(rule);
    }

    // Handle regular update
    const rule = await updateRule(id, updates);

    return NextResponse.json(rule);
  } catch (error) {
    console.error('Error updating rule:', error);
    return NextResponse.json(
      { error: 'Failed to update rule' },
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
        { error: 'Rule id is required' },
        { status: 400 }
      );
    }

    await deleteRule(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting rule:', error);
    return NextResponse.json(
      { error: 'Failed to delete rule' },
      { status: 500 }
    );
  }
}
