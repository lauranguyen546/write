'use client';

import { useState } from 'react';
import {
  ROMANCING_THE_BEAT,
  matchBeat,
  type DetectedBeat,
} from './BeatChecklist';

interface BeatTimelineProps {
  detectedBeats: DetectedBeat[];
  totalChunks: number;
}

// Try to derive a 0-1 manuscript position from a location string like
// "Chapter 12", "chunk 8", or "Scene 3". Falls back to the beat's
// expected position when the location can't be parsed.
function positionFromLocation(location: string, totalChunks: number): number | null {
  if (!totalChunks) return null;
  const numMatch = location.match(/(\d+)/);
  if (!numMatch) return null;
  const num = parseInt(numMatch[1], 10);
  if (num < 1 || num > totalChunks) return null;
  return num / totalChunks;
}

export default function BeatTimeline({ detectedBeats, totalChunks }: BeatTimelineProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  const markers = ROMANCING_THE_BEAT.map(beat => {
    const match = matchBeat(beat, detectedBeats);
    const position = match
      ? positionFromLocation(match.location, totalChunks) ?? beat.expectedPosition
      : beat.expectedPosition;
    return { beat, match, position };
  });

  return (
    <div className="pt-10 pb-6">
      <div className="relative h-3 bg-gray-200 rounded-full">
        {/* Phase segments */}
        <div className="absolute inset-y-0 left-0 w-[20%] bg-romance-200 rounded-l-full" />
        <div className="absolute inset-y-0 left-[20%] w-[45%] bg-romance-300" />
        <div className="absolute inset-y-0 left-[65%] w-[25%] bg-romance-400" />
        <div className="absolute inset-y-0 left-[90%] w-[10%] bg-romance-500 rounded-r-full" />

        {/* Beat markers */}
        {markers.map(({ beat, match, position }) => (
          <button
            key={beat.name}
            className="absolute -top-2"
            style={{ left: `calc(${Math.min(position, 1) * 100}% - 10px)` }}
            onMouseEnter={() => setHovered(beat.name)}
            onMouseLeave={() => setHovered(null)}
            aria-label={`${beat.name}: ${match ? 'detected' : 'missing'}`}
          >
            <span
              className={`block w-5 h-5 rounded-full border-2 border-white shadow text-[10px] leading-4 text-center ${
                match ? 'bg-green-500' : 'bg-red-400'
              }`}
            >
              {match ? '✓' : '✕'}
            </span>
            {hovered === beat.name && (
              <span className="absolute bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg z-10">
                {beat.name}
                {match ? ` — ${match.location}` : ' — not detected'}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Axis labels */}
      <div className="flex justify-between text-xs text-gray-500 mt-3">
        <span>Beginning</span>
        <span>Midpoint</span>
        <span>End</span>
      </div>

      {/* Phase legend */}
      <div className="flex flex-wrap gap-4 mt-4 text-xs text-gray-600">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-romance-200 inline-block" /> Setup
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-romance-300 inline-block" /> Falling In Love
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-romance-400 inline-block" /> Retreating
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-romance-500 inline-block" /> Fighting For Love
        </span>
      </div>
    </div>
  );
}
