'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import UploadZone from '@/components/manuscript/UploadZone';
import type { ProjectSettings, Subgenre, HeatLevel, Trope, POVStyle, TargetTone } from '@/types';

export default function SettingsPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [project, setProject] = useState<any>(null);
  const [settings, setSettings] = useState<ProjectSettings>({
    subgenre: 'contemporary',
    heatLevel: 'open-door',
    tropes: [],
    povStyle: 'third-limited',
    targetTone: 'punchy',
  });
  const [hasManuscript, setHasManuscript] = useState(false);

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setProject(data);
        setSettings(JSON.parse(data.settingsJson));
        setHasManuscript(data.manuscripts && data.manuscripts.length > 0);
      }
    } catch (error) {
      console.error('Error fetching project:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });

      if (response.ok) {
        router.push(`/projects/${projectId}`);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleUploadComplete = () => {
    setHasManuscript(true);
    fetchProject();
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <p className="text-center">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Project Settings: {project?.title}
      </h1>

      <div className="space-y-8">
        {/* Genre Settings */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Genre Settings</h2>
          <div className="space-y-4">
            {/* Subgenre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subgenre
              </label>
              <select
                value={settings.subgenre}
                onChange={(e) =>
                  setSettings({ ...settings, subgenre: e.target.value as Subgenre })
                }
                className="input-field"
              >
                <option value="contemporary">Contemporary</option>
                <option value="historical">Historical</option>
                <option value="romantic-suspense">Romantic Suspense</option>
                <option value="paranormal">Paranormal</option>
                <option value="fantasy-romance">Fantasy Romance</option>
                <option value="ya-romance">YA Romance</option>
                <option value="romcom">Romcom</option>
              </select>
            </div>

            {/* Heat Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Heat Level
              </label>
              <select
                value={settings.heatLevel}
                onChange={(e) =>
                  setSettings({ ...settings, heatLevel: e.target.value as HeatLevel })
                }
                className="input-field"
              >
                <option value="sweet">Sweet (no intimacy)</option>
                <option value="closed-door">Closed Door (fade to black)</option>
                <option value="open-door">Open Door (some detail)</option>
                <option value="explicit">Explicit (detailed scenes)</option>
              </select>
            </div>

            {/* Tropes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tropes (select all that apply)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  'enemies-to-lovers',
                  'friends-to-lovers',
                  'fake-dating',
                  'second-chance',
                  'forced-proximity',
                  'marriage-of-convenience',
                  'opposites-attract',
                  'grumpy-sunshine',
                  'forbidden-love',
                ].map((trope) => (
                  <label key={trope} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.tropes.includes(trope as Trope)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSettings({
                            ...settings,
                            tropes: [...settings.tropes, trope as Trope],
                          });
                        } else {
                          setSettings({
                            ...settings,
                            tropes: settings.tropes.filter((t) => t !== trope),
                          });
                        }
                      }}
                      className="rounded text-romance-600"
                    />
                    <span className="text-sm capitalize">
                      {trope.replace(/-/g, ' ')}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* POV Style */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                POV Style
              </label>
              <select
                value={settings.povStyle}
                onChange={(e) =>
                  setSettings({ ...settings, povStyle: e.target.value as POVStyle })
                }
                className="input-field"
              >
                <option value="first-person">First Person</option>
                <option value="third-limited">Third Limited</option>
                <option value="dual-pov">Dual POV</option>
                <option value="multi-pov">Multi POV</option>
              </select>
            </div>

            {/* Target Tone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Tone
              </label>
              <select
                value={settings.targetTone}
                onChange={(e) =>
                  setSettings({ ...settings, targetTone: e.target.value as TargetTone })
                }
                className="input-field"
              >
                <option value="lyrical">Lyrical</option>
                <option value="punchy">Punchy</option>
                <option value="comedic">Comedic</option>
                <option value="dark">Dark</option>
              </select>
            </div>

            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>

        {/* Manuscript Upload */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Upload Manuscript</h2>
          {hasManuscript ? (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium">
                ✓ Manuscript uploaded successfully
              </p>
              <p className="text-sm text-green-700 mt-1">
                You can upload a new version to replace the current manuscript.
              </p>
            </div>
          ) : null}
          <div className="mt-4">
            <UploadZone projectId={projectId} onUploadComplete={handleUploadComplete} />
          </div>
        </div>

        {hasManuscript && (
          <div className="flex justify-end">
            <button
              onClick={() => router.push(`/projects/${projectId}`)}
              className="btn-primary"
            >
              Continue to Analysis →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
