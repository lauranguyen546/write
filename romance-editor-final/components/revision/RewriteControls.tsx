'use client';

export interface RewriteControlsState {
  tone: string | null;
  sensoryRichness: number; // 0-100, 50 = neutral
  pacing: number; // 0-100, 50 = neutral
  emotionalIntensity: number; // 0-100, 50 = neutral
  varySentences: boolean;
  showDontTell: boolean;
}

export const DEFAULT_CONTROLS: RewriteControlsState = {
  tone: null,
  sensoryRichness: 50,
  pacing: 50,
  emotionalIntensity: 50,
  varySentences: false,
  showDontTell: false,
};

const TONES = ['playful', 'serious', 'romantic', 'tense', 'humorous', 'dark'];

function sliderDirective(
  value: number,
  lowText: string,
  highText: string
): string | null {
  // Neutral band 40-60 emits nothing
  if (value >= 40 && value <= 60) return null;
  const strength = value > 60 ? (value > 80 ? 'strongly ' : '') : value < 20 ? 'strongly ' : '';
  return value > 60 ? `${strength}${highText}` : `${strength}${lowText}`;
}

/**
 * Compose the controls into natural-language guidance for the rewrite
 * prompt. Returns an empty string when everything is neutral so the
 * default prompt is untouched.
 */
export function buildGuidance(controls: RewriteControlsState): string {
  const parts: string[] = [];

  if (controls.tone) {
    parts.push(`Aim for a ${controls.tone} tone.`);
  }

  const sensory = sliderDirective(
    controls.sensoryRichness,
    'keep description spare and economical',
    'increase sensory detail (sight, sound, touch, scent)'
  );
  if (sensory) parts.push(`In the rewrite, ${sensory}.`);

  const pacing = sliderDirective(
    controls.pacing,
    'slow the pacing — let the moment breathe',
    'quicken the pacing with shorter, punchier sentences'
  );
  if (pacing) parts.push(`Also ${pacing}.`);

  const intensity = sliderDirective(
    controls.emotionalIntensity,
    'keep the emotion understated and subtle',
    'heighten the emotional intensity'
  );
  if (intensity) parts.push(`And ${intensity}.`);

  if (controls.varySentences) {
    parts.push('Vary sentence length for rhythm.');
  }
  if (controls.showDontTell) {
    parts.push('Convert any telling into showing through action and sensation.');
  }

  return parts.join(' ');
}

interface RewriteControlsProps {
  controls: RewriteControlsState;
  onChange: (controls: RewriteControlsState) => void;
  disabled?: boolean;
}

function Slider({
  label,
  lowLabel,
  highLabel,
  value,
  onChange,
  disabled,
}: {
  label: string;
  lowLabel: string;
  highLabel: string;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  const isNeutral = value >= 40 && value <= 60;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-medium text-gray-700">{label}</label>
        {!isNeutral && (
          <button
            onClick={() => onChange(50)}
            className="text-xs text-gray-400 hover:text-gray-600"
            type="button"
          >
            reset
          </button>
        )}
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        disabled={disabled}
        className="w-full accent-romance-600"
      />
      <div className="flex justify-between text-[11px] text-gray-500">
        <span>{lowLabel}</span>
        <span className={isNeutral ? 'text-gray-400' : 'text-romance-600 font-medium'}>
          {isNeutral ? 'neutral' : value}
        </span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
}

export default function RewriteControls({
  controls,
  onChange,
  disabled,
}: RewriteControlsProps) {
  const set = (patch: Partial<RewriteControlsState>) =>
    onChange({ ...controls, ...patch });

  return (
    <div className="space-y-4">
      {/* Tone presets */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">Tone</label>
        <div className="flex flex-wrap gap-2">
          {TONES.map((tone) => (
            <button
              key={tone}
              type="button"
              disabled={disabled}
              onClick={() => set({ tone: controls.tone === tone ? null : tone })}
              className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${
                controls.tone === tone
                  ? 'bg-romance-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tone}
            </button>
          ))}
        </div>
      </div>

      {/* Sliders */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Slider
          label="Sensory richness"
          lowLabel="sparse"
          highLabel="vivid"
          value={controls.sensoryRichness}
          onChange={(v) => set({ sensoryRichness: v })}
          disabled={disabled}
        />
        <Slider
          label="Pacing"
          lowLabel="contemplative"
          highLabel="brisk"
          value={controls.pacing}
          onChange={(v) => set({ pacing: v })}
          disabled={disabled}
        />
        <Slider
          label="Emotional intensity"
          lowLabel="subtle"
          highLabel="dramatic"
          value={controls.emotionalIntensity}
          onChange={(v) => set({ emotionalIntensity: v })}
          disabled={disabled}
        />
      </div>

      {/* Technical toggles */}
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={controls.varySentences}
            onChange={(e) => set({ varySentences: e.target.checked })}
            disabled={disabled}
            className="rounded border-gray-300 text-romance-600 focus:ring-romance-500"
          />
          Vary sentence length
        </label>
        <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={controls.showDontTell}
            onChange={(e) => set({ showDontTell: e.target.checked })}
            disabled={disabled}
            className="rounded border-gray-300 text-romance-600 focus:ring-romance-500"
          />
          Show, don't tell
        </label>
      </div>
    </div>
  );
}
