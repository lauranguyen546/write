'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { marked } from 'marked';

export default function EditorialLetterPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [letterHtml, setLetterHtml] = useState<string | null>(null);
  const [markdown, setMarkdown] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchLetter = async () => {
      try {
        const response = await fetch(`/api/export/${projectId}/editorial-letter`);
        if (response.ok) {
          const md = await response.text();
          setMarkdown(md);
          setLetterHtml(await marked.parse(md));
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchLetter();
  }, [projectId]);

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'editorial-letter.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-romance-600 mx-auto mt-16"></div>
        <p className="mt-3 text-sm text-gray-600">Preparing your editorial letter...</p>
      </div>
    );
  }

  if (error || !letterHtml) {
    return (
      <div className="p-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Editorial Letter</h1>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">✉️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No Editorial Letter Yet
            </h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              The editorial letter summarizes your manuscript's strengths, priority
              recommendations, and a revision plan. It's generated from analysis results.
            </p>
            <Link
              href={`/projects/${projectId}/analysis`}
              className="inline-block px-6 py-3 bg-romance-600 text-white rounded-lg hover:bg-romance-700 transition-colors font-medium"
            >
              Run Analysis First
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-start justify-between mb-6 print:hidden">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Editorial Letter</h1>
            <p className="text-gray-600 mt-1">
              Professional editorial assessment of your manuscript
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              🖨️ Print
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-2 text-sm bg-romance-600 text-white rounded-lg hover:bg-romance-700 transition-colors"
            >
              ⬇️ Download .md
            </button>
          </div>
        </div>

        <article
          className="editorial-letter bg-white rounded-lg shadow-sm border border-gray-200 px-10 py-12 print:shadow-none print:border-0"
          dangerouslySetInnerHTML={{ __html: letterHtml }}
        />
      </div>

      <style jsx global>{`
        .editorial-letter h1 {
          font-size: 1.75rem;
          font-weight: 700;
          color: #111827;
          margin-bottom: 1rem;
        }
        .editorial-letter h2 {
          font-size: 1.35rem;
          font-weight: 600;
          color: #111827;
          margin-top: 2rem;
          margin-bottom: 0.75rem;
          padding-bottom: 0.4rem;
          border-bottom: 1px solid #f3e8ee;
        }
        .editorial-letter h3 {
          font-size: 1.1rem;
          font-weight: 600;
          color: #1f2937;
          margin-top: 1.5rem;
          margin-bottom: 0.5rem;
        }
        .editorial-letter p {
          color: #374151;
          line-height: 1.75;
          margin-bottom: 1rem;
        }
        .editorial-letter ul,
        .editorial-letter ol {
          color: #374151;
          line-height: 1.7;
          margin: 0 0 1rem 1.5rem;
        }
        .editorial-letter ul {
          list-style-type: disc;
        }
        .editorial-letter ol {
          list-style-type: decimal;
        }
        .editorial-letter li {
          margin-bottom: 0.35rem;
        }
        .editorial-letter strong {
          color: #111827;
        }
        .editorial-letter blockquote {
          border-left: 3px solid #e5a3bd;
          padding-left: 1rem;
          color: #6b7280;
          font-style: italic;
          margin-bottom: 1rem;
        }
        .editorial-letter hr {
          border-color: #f3f4f6;
          margin: 2rem 0;
        }
      `}</style>
    </div>
  );
}
