import { prisma } from '@/lib/prisma';

export type RuleCategory = 'style' | 'voice' | 'grammar' | 'forbidden';

export interface WritingRule {
  id: string;
  projectId: string;
  category: RuleCategory;
  rule: string;
  examples: string[];
  priority: number;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRuleInput {
  projectId: string;
  category: RuleCategory;
  rule: string;
  examples?: string[];
  priority?: number;
  enabled?: boolean;
}

export interface UpdateRuleInput {
  category?: RuleCategory;
  rule?: string;
  examples?: string[];
  priority?: number;
  enabled?: boolean;
}

/**
 * Create a new writing rule
 */
export async function createRule(input: CreateRuleInput): Promise<WritingRule> {
  const rule = await prisma.writingRule.create({
    data: {
      projectId: input.projectId,
      category: input.category,
      rule: input.rule,
      examples: JSON.stringify(input.examples || []),
      priority: input.priority ?? 50,
      enabled: input.enabled ?? true,
    },
  });

  return {
    ...rule,
    category: rule.category as RuleCategory,
    examples: JSON.parse(rule.examples) as string[],
  };
}

/**
 * Get a rule by ID
 */
export async function getRule(id: string): Promise<WritingRule | null> {
  const rule = await prisma.writingRule.findUnique({
    where: { id },
  });

  if (!rule) return null;

  return {
    ...rule,
    category: rule.category as RuleCategory,
    examples: JSON.parse(rule.examples) as string[],
  };
}

/**
 * Get all rules for a project
 */
export async function getRulesByProject(
  projectId: string,
  filters?: {
    category?: RuleCategory;
    enabled?: boolean;
  }
): Promise<WritingRule[]> {
  const rules = await prisma.writingRule.findMany({
    where: {
      projectId,
      ...(filters?.category && { category: filters.category }),
      ...(filters?.enabled !== undefined && { enabled: filters.enabled }),
    },
    orderBy: [
      { priority: 'desc' },
      { createdAt: 'desc' },
    ],
  });

  return rules.map(rule => ({
    ...rule,
    category: rule.category as RuleCategory,
    examples: JSON.parse(rule.examples) as string[],
  }));
}

/**
 * Update a writing rule
 */
export async function updateRule(
  id: string,
  input: UpdateRuleInput
): Promise<WritingRule> {
  const updateData: any = {};

  if (input.category !== undefined) updateData.category = input.category;
  if (input.rule !== undefined) updateData.rule = input.rule;
  if (input.examples !== undefined) updateData.examples = JSON.stringify(input.examples);
  if (input.priority !== undefined) updateData.priority = input.priority;
  if (input.enabled !== undefined) updateData.enabled = input.enabled;

  const rule = await prisma.writingRule.update({
    where: { id },
    data: updateData,
  });

  return {
    ...rule,
    category: rule.category as RuleCategory,
    examples: JSON.parse(rule.examples) as string[],
  };
}

/**
 * Toggle a rule's enabled status
 */
export async function toggleRule(id: string): Promise<WritingRule> {
  const rule = await prisma.writingRule.findUnique({
    where: { id },
  });

  if (!rule) {
    throw new Error('Rule not found');
  }

  return updateRule(id, { enabled: !rule.enabled });
}

/**
 * Delete a writing rule
 */
export async function deleteRule(id: string): Promise<void> {
  await prisma.writingRule.delete({
    where: { id },
  });
}

/**
 * Get rules statistics for a project
 */
export async function getRuleStats(projectId: string): Promise<{
  total: number;
  enabled: number;
  byCategory: Record<RuleCategory, number>;
}> {
  const rules = await prisma.writingRule.findMany({
    where: { projectId },
    select: { category: true, enabled: true },
  });

  const stats = {
    total: rules.length,
    enabled: rules.filter(r => r.enabled).length,
    byCategory: {
      style: 0,
      voice: 0,
      grammar: 0,
      forbidden: 0,
    } as Record<RuleCategory, number>,
  };

  rules.forEach(rule => {
    stats.byCategory[rule.category as RuleCategory]++;
  });

  return stats;
}

/**
 * Get writing rules context for AI analysis
 * Returns formatted rules to include in LLM system prompt
 */
export async function getRulesContextForAI(projectId: string): Promise<string> {
  const rules = await getRulesByProject(projectId, { enabled: true });

  if (rules.length === 0) {
    return '';
  }

  const sections: string[] = [
    '# Author\'s Writing Rules',
    '',
    'The following are the author\'s explicit style preferences and writing rules.',
    'These should be RESPECTED when analyzing the manuscript and generating rewrites.',
    'Do NOT flag these as issues if they are intentional per these rules.',
    '',
  ];

  // Group by category
  const rulesByCategory: Record<string, WritingRule[]> = {};
  rules.forEach(rule => {
    if (!rulesByCategory[rule.category]) {
      rulesByCategory[rule.category] = [];
    }
    rulesByCategory[rule.category].push(rule);
  });

  // Format each category
  Object.entries(rulesByCategory).forEach(([category, categoryRules]) => {
    const categoryLabel = category.charAt(0).toUpperCase() + category.slice(1);
    sections.push(`## ${categoryLabel} Rules\n`);

    categoryRules.forEach((rule, idx) => {
      sections.push(`${idx + 1}. **${rule.rule}**`);

      if (rule.examples.length > 0) {
        sections.push('   Examples:');
        rule.examples.forEach(example => {
          sections.push(`   - "${example}"`);
        });
      }

      sections.push('');
    });
  });

  return sections.join('\n');
}

/**
 * Check if an issue violates any writing rules
 * Used to filter out false positives during analysis
 */
export async function checkIssueAgainstRules(
  projectId: string,
  issueCategory: string,
  issueDescription: string,
  issueEvidence?: string
): Promise<{
  violatesRule: boolean;
  matchedRule?: WritingRule;
}> {
  const rules = await getRulesByProject(projectId, { enabled: true });

  // Simple keyword matching - can be enhanced with AI in future
  const textToCheck = `${issueCategory} ${issueDescription} ${issueEvidence || ''}`.toLowerCase();

  for (const rule of rules) {
    const ruleKeywords = rule.rule.toLowerCase().split(' ');

    // Check if multiple keywords from rule match the issue
    const matchCount = ruleKeywords.filter(keyword =>
      keyword.length > 3 && textToCheck.includes(keyword)
    ).length;

    if (matchCount >= 2) {
      return {
        violatesRule: true,
        matchedRule: rule,
      };
    }
  }

  return { violatesRule: false };
}

/**
 * Get suggested rules based on common patterns
 */
export function getSuggestedRules(): Array<{
  category: RuleCategory;
  rule: string;
  examples: string[];
}> {
  return [
    {
      category: 'style',
      rule: 'I use sentence fragments for dramatic effect',
      examples: ['Heart pounding.', 'No going back.', 'Game over.'],
    },
    {
      category: 'style',
      rule: 'I prefer em dashes over parentheses for asides',
      examples: ['She knew—without a doubt—that he was lying.'],
    },
    {
      category: 'voice',
      rule: 'My protagonist uses Southern dialect',
      examples: ["ain't", "y'all", "fixin' to"],
    },
    {
      category: 'voice',
      rule: 'I write in present tense for immediacy',
      examples: ['She walks into the room.', 'He grabs her hand.'],
    },
    {
      category: 'grammar',
      rule: 'I intentionally use passive voice in introspective scenes',
      examples: ['She was consumed by doubt.', 'The decision was made.'],
    },
    {
      category: 'forbidden',
      rule: 'Avoid clichéd metaphors like "eyes like pools"',
      examples: ['eyes like pools', 'heart of gold', 'butterflies in stomach'],
    },
    {
      category: 'forbidden',
      rule: 'Show don\'t tell - flag abstract emotion words',
      examples: ['happy', 'sad', 'angry', 'nervous'],
    },
    {
      category: 'style',
      rule: 'I use italics for internal thoughts without quotes',
      examples: ['What was I thinking?', 'This is wrong.'],
    },
  ];
}
