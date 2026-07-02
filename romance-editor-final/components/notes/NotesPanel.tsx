'use client';

import { useState, useEffect } from 'react';
import { Note, NoteType } from '@/lib/notes/notes-manager';

interface NotesPanelProps {
  projectId: string;
  onNoteSelect?: (note: Note) => void;
  selectedNoteId?: string;
}

const NOTE_TYPE_COLORS: Record<NoteType, string> = {
  character: 'bg-purple-100 text-purple-800',
  setting: 'bg-green-100 text-green-800',
  plot: 'bg-blue-100 text-blue-800',
  theme: 'bg-yellow-100 text-yellow-800',
  custom: 'bg-gray-100 text-gray-800',
};

const NOTE_TYPE_ICONS: Record<NoteType, string> = {
  character: '👤',
  setting: '🌍',
  plot: '📖',
  theme: '💭',
  custom: '📝',
};

export default function NotesPanel({
  projectId,
  onNoteSelect,
  selectedNoteId,
}: NotesPanelProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<NoteType | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchNotes();
  }, [projectId, filterType, searchTerm]);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        projectId,
        ...(filterType !== 'all' && { type: filterType }),
        ...(searchTerm && { searchTerm }),
      });

      const response = await fetch(`/api/notes?${params}`);
      if (response.ok) {
        const data = await response.json();
        setNotes(data);
      }
    } catch (error) {
      console.error('Failed to fetch notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredNotes = notes.filter(note => {
    const matchesType = filterType === 'all' || note.type === filterType;
    const matchesSearch =
      !searchTerm ||
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Notes</h2>

        {/* Search */}
        <input
          type="text"
          placeholder="Search notes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-romance-500 mb-3"
        />

        {/* Type Filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filterType === 'all'
                ? 'bg-romance-100 text-romance-800'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {(Object.keys(NOTE_TYPE_ICONS) as NoteType[]).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filterType === type
                  ? NOTE_TYPE_COLORS[type]
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {NOTE_TYPE_ICONS[type]} {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-romance-600 mx-auto"></div>
            <p className="mt-2 text-sm">Loading notes...</p>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <p className="text-sm">No notes found</p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="mt-2 text-romance-600 hover:text-romance-800 text-sm"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredNotes.map((note) => (
              <button
                key={note.id}
                onClick={() => onNoteSelect?.(note)}
                className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                  selectedNoteId === note.id ? 'bg-romance-50' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-lg flex-shrink-0">
                      {NOTE_TYPE_ICONS[note.type]}
                    </span>
                    <h3 className="font-medium text-gray-900 truncate">
                      {note.title}
                    </h3>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium flex-shrink-0 ml-2 ${
                      NOTE_TYPE_COLORS[note.type]
                    }`}
                  >
                    {note.type}
                  </span>
                </div>

                <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                  {note.content}
                </p>

                {note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {note.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <p className="text-xs text-gray-400">
                  Updated {new Date(note.updatedAt).toLocaleDateString()}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer - Add Note Button */}
      <div className="p-4 border-t border-gray-200">
        <a
          href={`/projects/${projectId}/notes`}
          className="block w-full px-4 py-2 bg-romance-600 text-white text-center rounded-md hover:bg-romance-700 transition-colors text-sm font-medium"
        >
          + New Note
        </a>
      </div>
    </div>
  );
}
