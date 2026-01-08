'use client';

import { useMemo } from 'react';
import * as Diff from 'diff';

interface DiffViewerProps {
  originalText: string;
  suggestedText: string;
  inline?: boolean;
}

export default function DiffViewer({ originalText, suggestedText, inline = false }: DiffViewerProps) {
  const diff = useMemo(() => {
    return Diff.diffWords(originalText, suggestedText);
  }, [originalText, suggestedText]);

  if (inline) {
    // Inline view - show changes within one block
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 font-mono text-sm overflow-x-auto">
        {diff.map((part, index) => {
          if (part.added) {
            return (
              <span
                key={index}
                className="bg-green-200 text-green-900 px-0.5"
                title="Added"
              >
                {part.value}
              </span>
            );
          } else if (part.removed) {
            return (
              <span
                key={index}
                className="bg-red-200 text-red-900 line-through px-0.5"
                title="Removed"
              >
                {part.value}
              </span>
            );
          } else {
            return <span key={index}>{part.value}</span>;
          }
        })}
      </div>
    );
  }

  // Side-by-side view
  const originalLines: Array<{ text: string; type: 'removed' | 'unchanged' | 'empty' }> = [];
  const suggestedLines: Array<{ text: string; type: 'added' | 'unchanged' | 'empty' }> = [];

  diff.forEach((part) => {
    const lines = part.value.split('\n');
    
    if (part.removed) {
      lines.forEach((line, idx) => {
        if (idx < lines.length - 1 || line) {
          originalLines.push({ text: line, type: 'removed' });
          suggestedLines.push({ text: '', type: 'empty' });
        }
      });
    } else if (part.added) {
      lines.forEach((line, idx) => {
        if (idx < lines.length - 1 || line) {
          originalLines.push({ text: '', type: 'empty' });
          suggestedLines.push({ text: line, type: 'added' });
        }
      });
    } else {
      lines.forEach((line, idx) => {
        if (idx < lines.length - 1 || line) {
          originalLines.push({ text: line, type: 'unchanged' });
          suggestedLines.push({ text: line, type: 'unchanged' });
        }
      });
    }
  });

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Original */}
      <div>
        <h4 className="text-sm font-semibold mb-2 text-gray-700">Original</h4>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 font-mono text-sm overflow-x-auto">
          {originalLines.map((line, index) => (
            <div
              key={index}
              className={`${
                line.type === 'removed'
                  ? 'bg-red-100 text-red-900'
                  : line.type === 'empty'
                  ? 'bg-gray-100 text-gray-400'
                  : ''
              } ${line.text ? 'py-0.5' : 'h-6'}`}
            >
              {line.text || '\u00A0'}
            </div>
          ))}
        </div>
      </div>

      {/* Suggested */}
      <div>
        <h4 className="text-sm font-semibold mb-2 text-gray-700">Suggested</h4>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 font-mono text-sm overflow-x-auto">
          {suggestedLines.map((line, index) => (
            <div
              key={index}
              className={`${
                line.type === 'added'
                  ? 'bg-green-100 text-green-900'
                  : line.type === 'empty'
                  ? 'bg-gray-100 text-gray-400'
                  : ''
              } ${line.text ? 'py-0.5' : 'h-6'}`}
            >
              {line.text || '\u00A0'}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
