/**
 * Export issues to CSV format
 */

import { stringify } from 'csv-stringify/sync';

export interface IssueForExport {
  id: string;
  category: string;
  severity: string;
  title: string;
  description: string;
  evidence?: string;
  suggestion?: string;
  chapter?: string;
  scene?: string;
  hasAcceptedRevision: boolean;
}

export function generateIssuesCSV(issues: IssueForExport[]): string {
  const records = issues.map(issue => ({
    'Issue ID': issue.id,
    'Category': issue.category,
    'Severity': issue.severity,
    'Title': issue.title,
    'Description': issue.description,
    'Evidence': issue.evidence || '',
    'Suggestion': issue.suggestion || '',
    'Chapter': issue.chapter || '',
    'Scene': issue.scene || '',
    'Has Accepted Revision': issue.hasAcceptedRevision ? 'Yes' : 'No',
  }));

  return stringify(records, {
    header: true,
    quoted: true,
  });
}
