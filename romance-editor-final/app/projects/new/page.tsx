'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewProjectPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          settings: {
            subgenre: 'contemporary',
            heatLevel: 'open-door',
            tropes: ['enemies-to-lovers'],
            povStyle: 'third-limited',
            targetTone: 'punchy',
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create project');
      }

      const project = await response.json();
      router.push(`/projects/${project.id}/settings`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Create New Project</h1>

      <form onSubmit={handleSubmit} className="card">
        <div className="mb-6">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Project Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-field"
            placeholder="My Romance Novel"
            required
            autoFocus
          />
          <p className="text-xs text-gray-500 mt-1">
            Give your manuscript project a memorable title
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={submitting || !title.trim()}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Creating...' : 'Create Project'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">Next Steps</h3>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>Configure your genre settings (subgenre, heat level, tropes)</li>
          <li>Upload your manuscript (.txt, .md, or .docx)</li>
          <li>Run editorial analysis</li>
          <li>Review issues and generate rewrites</li>
        </ol>
      </div>
    </div>
  );
}
