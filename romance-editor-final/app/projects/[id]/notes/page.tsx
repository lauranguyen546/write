'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Note, NoteType } from '@/lib/notes/notes-manager';

const NOTE_TYPES: { value: NoteType; label: string; icon: string; description: string }[] = [
  { value: 'character', label: 'Character', icon: '👤', description: 'Character profiles, traits, and backstories' },
  { value: 'setting', label: 'Setting', icon: '🌍', description: 'Locations, world-building, and environments' },
  { value: 'plot', label: 'Plot', icon: '📖', description: 'Plot points, story arcs, and narrative structure' },
  { value: 'theme', label: 'Theme', icon: '💭', description: 'Themes, motifs, and symbolic elements' },
  { value: 'custom', label: 'Custom', icon: '📝', description: 'Any other story-related notes' },
];

export default function NotesPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    type: 'character' as NoteType,
    title: '',
    content: '',
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    fetchNotes();
  }, [projectId]);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/notes?projectId=${projectId}`);
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

  const handleCreateNote = () => {
    setIsCreating(true);
    setIsEditing(false);
    setSelectedNote(null);
    setFormData({
      type: 'character',
      title: '',
      content: '',
      tags: [],
    });
    setTagInput('');
  };

  const handleEditNote = (note: Note) => {
    setIsEditing(true);
    setIsCreating(false);
    setSelectedNote(note);
    setFormData({
      type: note.type,
      title: note.title,
      content: note.content,
      tags: note.tags,
    });
    setTagInput('');
  };

  const handleSaveNote = async () => {
    try {
      if (isCreating) {
        const response = await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, ...formData }),
        });

        if (response.ok) {
          await fetchNotes();
          setIsCreating(false);
          setFormData({ type: 'character', title: '', content: '', tags: [] });
        }
      } else if (isEditing && selectedNote) {
        const response = await fetch('/api/notes', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: selectedNote.id, ...formData }),
        });

        if (response.ok) {
          await fetchNotes();
          setIsEditing(false);
          setSelectedNote(null);
        }
      }
    } catch (error) {
      console.error('Failed to save note:', error);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const response = await fetch(`/api/notes?id=${noteId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchNotes();
        if (selectedNote?.id === noteId) {
          setSelectedNote(null);
          setIsEditing(false);
        }
      }
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove),
    });
  };

  const notesByType = NOTE_TYPES.map(type => ({
    ...type,
    notes: notes.filter(note => note.type === type.value),
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <button
                onClick={() => router.back()}
                className="text-gray-600 hover:text-gray-900 mb-2 flex items-center gap-1 text-sm"
              >
                ← Back to Project
              </button>
              <h1 className="text-3xl font-bold text-gray-900">Story Notes</h1>
              <p className="text-gray-600 mt-1">
                Organize characters, settings, plot points, and more
              </p>
            </div>
            <button
              onClick={handleCreateNote}
              className="px-4 py-2 bg-romance-600 text-white rounded-md hover:bg-romance-700 transition-colors"
            >
              + New Note
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Notes List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-romance-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600">Loading notes...</p>
                </div>
              ) : notes.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-600 mb-4">No notes yet</p>
                  <button
                    onClick={handleCreateNote}
                    className="text-romance-600 hover:text-romance-800"
                  >
                    Create your first note
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {notesByType.map(({ value, label, icon, notes: typeNotes }) => (
                    <div key={value}>
                      {typeNotes.length > 0 && (
                        <div>
                          <div className="px-4 py-3 bg-gray-50 font-medium text-sm text-gray-700">
                            {icon} {label} ({typeNotes.length})
                          </div>
                          {typeNotes.map(note => (
                            <button
                              key={note.id}
                              onClick={() => handleEditNote(note)}
                              className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                                selectedNote?.id === note.id ? 'bg-romance-50' : ''
                              }`}
                            >
                              <h4 className="font-medium text-gray-900 mb-1">
                                {note.title}
                              </h4>
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {note.content}
                              </p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Editor */}
          <div className="lg:col-span-2">
            {!isCreating && !isEditing ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <div className="text-6xl mb-4">📝</div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Select a note to edit
                </h2>
                <p className="text-gray-600 mb-6">
                  Or create a new note to get started
                </p>
                <button
                  onClick={handleCreateNote}
                  className="px-6 py-3 bg-romance-600 text-white rounded-md hover:bg-romance-700 transition-colors"
                >
                  + New Note
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    {isCreating ? 'Create Note' : 'Edit Note'}
                  </h2>
                  <div className="flex gap-2">
                    {isEditing && selectedNote && (
                      <button
                        onClick={() => handleDeleteNote(selectedNote.id)}
                        className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      >
                        Delete
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setIsCreating(false);
                        setIsEditing(false);
                        setSelectedNote(null);
                      }}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveNote}
                      disabled={!formData.title.trim()}
                      className="px-4 py-2 bg-romance-600 text-white rounded-md hover:bg-romance-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Save
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Type Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Note Type
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      {NOTE_TYPES.map(type => (
                        <button
                          key={type.value}
                          onClick={() => setFormData({ ...formData, type: type.value })}
                          className={`p-3 border-2 rounded-lg text-center transition-all ${
                            formData.type === type.value
                              ? 'border-romance-500 bg-romance-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="text-2xl mb-1">{type.icon}</div>
                          <div className="text-xs font-medium text-gray-900">
                            {type.label}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Elena Rodriguez - Protagonist"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-romance-500"
                    />
                  </div>

                  {/* Content */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Content (Markdown supported)
                    </label>
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="Add details about this note..."
                      rows={12}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-romance-500 font-mono text-sm"
                    />
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tags
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                        placeholder="Add a tag and press Enter"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-romance-500"
                      />
                      <button
                        onClick={handleAddTag}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-romance-100 text-romance-800 rounded-full text-sm flex items-center gap-1"
                          >
                            {tag}
                            <button
                              onClick={() => handleRemoveTag(tag)}
                              className="ml-1 hover:text-romance-900"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
