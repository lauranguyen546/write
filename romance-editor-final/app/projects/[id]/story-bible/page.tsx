'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import CharacterCard from '@/components/story-bible/CharacterCard';
import TimelineView from '@/components/story-bible/TimelineView';
import type { StoryBible } from '@/types';

export default function StoryBiblePage() {
  const params = useParams();
  const projectId = params.id as string;

  const [storyBible, setStoryBible] = useState<StoryBible | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStoryBible = async () => {
      try {
        const response = await fetch(`/api/story-bible?projectId=${projectId}`);
        if (response.ok) {
          const data = await response.json();
          setStoryBible(data.storyBible);
        }
      } catch (error) {
        console.error('Failed to fetch story bible:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStoryBible();
  }, [projectId]);

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-romance-600 mx-auto mt-16"></div>
        <p className="mt-3 text-sm text-gray-600">Loading Story Bible...</p>
      </div>
    );
  }

  if (!storyBible) {
    return (
      <div className="p-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Story Bible</h1>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No Story Bible Yet
            </h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              The Story Bible is built automatically during manuscript analysis. It tracks
              your characters, relationships, timeline, settings, and unresolved plot threads.
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

  const povEntries = Object.entries(storyBible.povMap || {});

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Story Bible</h1>
          <p className="text-gray-600 mt-1">
            Automatically extracted from your manuscript during analysis
          </p>
        </div>

        {/* Relationship Status */}
        {storyBible.relationshipStatus && (
          <div className="bg-romance-50 border border-romance-200 rounded-lg p-5">
            <p className="text-xs font-medium text-romance-700 uppercase mb-1">
              💕 Central Relationship
            </p>
            <p className="text-gray-800">{storyBible.relationshipStatus}</p>
          </div>
        )}

        {/* Characters */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            👤 Characters ({storyBible.characters.length})
          </h2>
          {storyBible.characters.length === 0 ? (
            <p className="text-sm text-gray-500">No characters extracted yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {storyBible.characters.map((character, idx) => (
                <CharacterCard
                  key={idx}
                  name={character.name}
                  role={character.role}
                  traits={character.traits || []}
                  arc={character.arc}
                />
              ))}
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Timeline */}
          <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">📖 Timeline</h2>
            <TimelineView events={storyBible.timeline || []} />
          </section>

          {/* POV Map */}
          <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">👁️ POV Map</h2>
            {povEntries.length === 0 ? (
              <p className="text-sm text-gray-500">No POV data detected yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-200">
                    <th className="pb-2 font-medium">Character</th>
                    <th className="pb-2 font-medium">Scenes / Chapters</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {povEntries.map(([character, scenes]) => (
                    <tr key={character}>
                      <td className="py-2 font-medium text-gray-900">{character}</td>
                      <td className="py-2 text-gray-600">
                        {(scenes as string[]).join(', ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>

        {/* Settings */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">🌍 Settings</h2>
          {(storyBible.settings || []).length === 0 ? (
            <p className="text-sm text-gray-500">No settings detected yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {storyBible.settings.map((setting, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 bg-green-50 text-green-800 border border-green-200 rounded-full text-sm"
                >
                  {setting}
                </span>
              ))}
            </div>
          )}
        </section>

        {/* Unresolved Threads */}
        {(storyBible.unresolvedThreads || []).length > 0 && (
          <section className="bg-amber-50 border border-amber-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-amber-900 mb-4">
              ⚠️ Unresolved Threads ({storyBible.unresolvedThreads.length})
            </h2>
            <ul className="space-y-2">
              {storyBible.unresolvedThreads.map((thread, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-amber-900">
                  <span className="mt-0.5">•</span>
                  <span>{thread}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-amber-700 mt-4">
              These plot threads were opened but may not be resolved. Verify each is
              intentional or address it in revision.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
