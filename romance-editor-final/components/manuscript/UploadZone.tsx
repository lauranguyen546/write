'use client';

import { useState, useRef } from 'react';

interface UploadZoneProps {
  projectId: string;
  onUploadComplete: (data: { manuscript: any; metadata: any }) => void;
}

export default function UploadZone({ projectId, onUploadComplete }: UploadZoneProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [mode, setMode] = useState<'file' | 'paste'>('file');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('projectId', projectId);
      formData.append('file', file);

      const response = await fetch('/api/manuscripts/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Upload failed');
      }

      const data = await response.json();
      onUploadComplete(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handlePasteUpload = async () => {
    if (!pastedText.trim()) {
      setError('Please paste your manuscript text');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('projectId', projectId);
      formData.append('pastedText', pastedText);

      const response = await fetch('/api/manuscripts/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Upload failed');
      }

      const data = await response.json();
      onUploadComplete(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex space-x-2 border-b border-gray-200">
        <button
          onClick={() => setMode('file')}
          className={`px-4 py-2 font-medium ${
            mode === 'file'
              ? 'text-romance-600 border-b-2 border-romance-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Upload File
        </button>
        <button
          onClick={() => setMode('paste')}
          className={`px-4 py-2 font-medium ${
            mode === 'paste'
              ? 'text-romance-600 border-b-2 border-romance-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Paste Text
        </button>
      </div>

      {mode === 'file' ? (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-romance-500 bg-romance-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            accept=".txt,.md,.docx"
            className="hidden"
            disabled={uploading}
          />

          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>

          <p className="mt-2 text-sm text-gray-600">
            {uploading ? 'Uploading...' : 'Drag and drop your manuscript here, or'}
          </p>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="mt-2 btn-primary"
          >
            Browse Files
          </button>

          <p className="mt-2 text-xs text-gray-500">
            Supports .txt, .md, and .docx files (up to 200,000 words)
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder="Paste your entire manuscript here..."
            className="w-full h-64 input-field font-mono text-sm"
            disabled={uploading}
          />
          <button
            onClick={handlePasteUpload}
            disabled={uploading || !pastedText.trim()}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Processing...' : 'Upload Manuscript'}
          </button>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
