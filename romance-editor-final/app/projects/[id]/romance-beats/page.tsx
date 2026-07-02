'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import BeatChecklist, {
  ROMANCING_THE_BEAT,
  matchBeat,
  type DetectedBeat,
} from '@/components/romance-beats/BeatChecklist';
import BeatTimeline from '@/components/romance-beats/BeatTimeline';
import type { ArcTracker } from '@/types';

export default function RomanceBeatsPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [arcTracker, setArcTracker] = useState<ArcTracker | null>(null);
  const [totalChunks, setTotalChunks] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArcTracker = async () => {
      try {
        const response = await fetch(`/api/story-bible?projectId=${projectId}`);
        if (response.ok) {
          const data = await response.json();
          setArcTracker(data.arcTracker);
          setTotalChunks(data.totalChunks || 0);
        }
      } catch (error) {
        console.error('Failed to fetch arc tracker:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchArcTracker();
  }, [projectId]);

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-romance-600 mx-auto mt-16"></div>
        <p className="mt-3 text-sm text-gray-600">Loading Romance Beats...</p>
      </div>
    );
  }

  if (!arcTracker) {
    return (
      <div className="p-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Romance Beat Tracker</h1>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">💕</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No Beat Data Yet
            </h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Romance beats are detected during manuscript analysis using the Romancing
              the Beat 14-beat structure. Run an analysis to see how your story measures up.
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

  const detectedBeats: DetectedBeat[] = arcTracker.romanceBeats || [];
  const detectedCount = ROMANCING_THE_BEAT.filter(b =>
    matchBeat(b, detectedBeats)
  ).length;
  const completionPct = Math.round((detectedCount / ROMANCING_THE_BEAT.length) * 100);

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Romance Beat Tracker</h1>
            <p className="text-gray-600 mt-1">
              Structural validation against Romancing the Beat (Gwen Hayes)
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-6 py-3 text-center">
            <p className="text-3xl font-bold text-romance-600">
              {detectedCount}/{ROMANCING_THE_BEAT.length}
            </p>
            <p className="text-xs text-gray-500 uppercase font-medium">
              Beats Detected ({completionPct}%)
            </p>
          </div>
        </div>

        {/* Timeline */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Beat Timeline</h2>
          <p className="text-sm text-gray-600 mb-2">
            Where beats fall across your manuscript. Green = detected, red = missing
            (shown at expected position). Hover markers for details.
          </p>
          <BeatTimeline detectedBeats={detectedBeats} totalChunks={totalChunks} />
        </section>

        {/* Checklist */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Beat Checklist</h2>
          <BeatChecklist detectedBeats={detectedBeats} />
        </section>

        {/* Subplot Beats */}
        {(arcTracker.subplotBeats || []).length > 0 && (
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Subplot Beats</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {arcTracker.subplotBeats.map((subplot, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-5"
                >
                  <h3 className="font-semibold text-gray-900 mb-2">{subplot.subplot}</h3>
                  <ul className="space-y-1">
                    {subplot.beats.map((beat, beatIdx) => (
                      <li key={beatIdx} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-romance-500 mt-0.5">•</span>
                        {beat}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
