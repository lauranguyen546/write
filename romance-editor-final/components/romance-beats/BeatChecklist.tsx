export interface CanonicalBeat {
  name: string;
  phase: string;
  guidance: string;
  // Expected position in manuscript as fraction (0-1), for timeline placement
  expectedPosition: number;
}

// Romancing the Beat (Gwen Hayes) — canonical 14-beat structure
export const ROMANCING_THE_BEAT: CanonicalBeat[] = [
  { name: 'Introduce Hero 1', phase: 'Setup', expectedPosition: 0.03, guidance: 'Show who they are and the hole in their heart before love arrives.' },
  { name: 'Introduce Hero 2', phase: 'Setup', expectedPosition: 0.06, guidance: 'Establish the second lead with their own want, wound, and worldview.' },
  { name: 'Meet Cute', phase: 'Setup', expectedPosition: 0.1, guidance: 'The first meeting should spark conflict or chemistry — ideally both.' },
  { name: 'No Way!', phase: 'Setup', expectedPosition: 0.15, guidance: 'Both leads resist the attraction; falling in love feels impossible or unwise.' },
  { name: 'Adhesion', phase: 'Setup', expectedPosition: 0.2, guidance: 'An external reason forces them together — they cannot simply walk away.' },
  { name: 'No Way... Maybe?', phase: 'Falling In Love', expectedPosition: 0.3, guidance: 'Attraction deepens despite resistance; the "maybe" creeps in.' },
  { name: 'Deepening Desire', phase: 'Falling In Love', expectedPosition: 0.4, guidance: 'Intimacy grows through shared vulnerability, not just proximity.' },
  { name: 'Midpoint of Love', phase: 'Falling In Love', expectedPosition: 0.5, guidance: 'A moment of real connection — often a first kiss or confession of feeling.' },
  { name: 'Inkling of Doubt', phase: 'Falling In Love', expectedPosition: 0.6, guidance: 'The old wound whispers: this cannot last. Doubt takes root.' },
  { name: 'Deepening Doubt', phase: 'Retreating', expectedPosition: 0.7, guidance: 'Fears escalate; the leads retreat behind old defenses.' },
  { name: 'Retreat (Break Up)', phase: 'Retreating', expectedPosition: 0.78, guidance: 'The relationship ruptures — the wound wins, temporarily.' },
  { name: 'Dark Night of the Soul', phase: 'Retreating', expectedPosition: 0.85, guidance: 'Each lead faces life without the other and confronts their wound honestly.' },
  { name: 'Grand Gesture', phase: 'Fighting For Love', expectedPosition: 0.92, guidance: 'One (or both) leads risk everything to prove they have changed.' },
  { name: 'HEA / HFN', phase: 'Fighting For Love', expectedPosition: 0.98, guidance: 'The emotionally satisfying, optimistic ending the genre promises (RWA requirement).' },
];

export interface DetectedBeat {
  beat: string;
  location: string;
  present: boolean;
}

// Alternate names the analysis (or older data) may use for each beat
const BEAT_SYNONYMS: { [canonical: string]: string[] } = {
  'Meet Cute': ['meet-cute', 'meetcute', 'first meeting'],
  'No Way!': ['no way', 'refusal', 'denial of attraction'],
  'Adhesion': ['stuck together', 'forced proximity'],
  'No Way... Maybe?': ['no way maybe', 'maybe'],
  'Deepening Desire': ['growing attraction', 'deepening attraction'],
  'Midpoint of Love': ['midpoint', 'first kiss', 'midpoint commitment'],
  'Inkling of Doubt': ['inkling', 'first doubt'],
  'Deepening Doubt': ['growing doubt', 'doubts deepen'],
  'Retreat (Break Up)': ['break up', 'breakup', 'break-up', 'retreat', 'the lurch'],
  'Dark Night of the Soul': ['black moment', 'dark moment', 'dark night'],
  'Grand Gesture': ['grand gesture', 'sacrifice'],
  'HEA / HFN': ['hea', 'hfn', 'happily ever after', 'happy for now', 'happy ending'],
};

function normalizeBeatName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
}

export function matchBeat(
  canonical: CanonicalBeat,
  detected: DetectedBeat[]
): DetectedBeat | undefined {
  const canonNorm = normalizeBeatName(canonical.name);
  const synonyms = (BEAT_SYNONYMS[canonical.name] || []).map(normalizeBeatName);

  return detected.find(d => {
    if (!d.present) return false;
    const detNorm = normalizeBeatName(d.beat);
    if (!detNorm) return false;
    return (
      detNorm === canonNorm ||
      detNorm.includes(canonNorm) ||
      canonNorm.includes(detNorm) ||
      synonyms.some(syn => detNorm === syn || detNorm.includes(syn))
    );
  });
}

interface BeatChecklistProps {
  detectedBeats: DetectedBeat[];
}

export default function BeatChecklist({ detectedBeats }: BeatChecklistProps) {
  const phases = Array.from(new Set(ROMANCING_THE_BEAT.map(b => b.phase)));

  return (
    <div className="space-y-6">
      {phases.map(phase => (
        <div key={phase}>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
            {phase}
          </h3>
          <div className="space-y-2">
            {ROMANCING_THE_BEAT.filter(b => b.phase === phase).map(beat => {
              const match = matchBeat(beat, detectedBeats);
              return (
                <div
                  key={beat.name}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${
                    match
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <span className="text-lg flex-shrink-0">{match ? '✅' : '❌'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-gray-900">{beat.name}</p>
                      {match && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs">
                          📍 {match.location}
                        </span>
                      )}
                    </div>
                    {!match && (
                      <p className="text-sm text-red-800 mt-1">{beat.guidance}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
