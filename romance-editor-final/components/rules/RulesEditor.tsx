'use client';

import { useState, useEffect } from 'react';
import { WritingRule, RuleCategory } from '@/lib/rules/writing-rules-manager';

interface RulesEditorProps {
  projectId: string;
}

const CATEGORIES: { value: RuleCategory; label: string; icon: string; description: string }[] = [
  { value: 'style', label: 'Style', icon: '✍️', description: 'Formatting, structure, and stylistic choices' },
  { value: 'voice', label: 'Voice', icon: '🎭', description: 'Character dialect, tense, and narrative voice' },
  { value: 'grammar', label: 'Grammar', icon: '📐', description: 'Intentional grammar patterns and exceptions' },
  { value: 'forbidden', label: 'Forbidden', icon: '🚫', description: 'Phrases, clichés, or patterns to avoid' },
];

export default function RulesEditor({ projectId }: RulesEditorProps) {
  const [rules, setRules] = useState<WritingRule[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingRule, setEditingRule] = useState<WritingRule | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    category: 'style' as RuleCategory,
    rule: '',
    examples: [] as string[],
    priority: 50,
  });
  const [exampleInput, setExampleInput] = useState('');

  useEffect(() => {
    fetchRules();
    fetchSuggestions();
  }, [projectId]);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/rules?projectId=${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setRules(data);
      }
    } catch (error) {
      console.error('Failed to fetch rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestions = async () => {
    try {
      const response = await fetch('/api/rules?suggestions=true');
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data);
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    }
  };

  const handleCreateRule = () => {
    setIsCreating(true);
    setEditingRule(null);
    setFormData({ category: 'style', rule: '', examples: [], priority: 50 });
    setExampleInput('');
  };

  const handleEditRule = (rule: WritingRule) => {
    setIsCreating(false);
    setEditingRule(rule);
    setFormData({
      category: rule.category,
      rule: rule.rule,
      examples: rule.examples,
      priority: rule.priority,
    });
    setExampleInput('');
  };

  const handleSaveRule = async () => {
    try {
      if (isCreating) {
        const response = await fetch('/api/rules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, ...formData }),
        });

        if (response.ok) {
          await fetchRules();
          setIsCreating(false);
        }
      } else if (editingRule) {
        const response = await fetch('/api/rules', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingRule.id, ...formData }),
        });

        if (response.ok) {
          await fetchRules();
          setEditingRule(null);
        }
      }

      setFormData({ category: 'style', rule: '', examples: [], priority: 50 });
    } catch (error) {
      console.error('Failed to save rule:', error);
    }
  };

  const handleToggleRule = async (ruleId: string) => {
    try {
      const response = await fetch('/api/rules', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ruleId, toggle: true }),
      });

      if (response.ok) {
        await fetchRules();
      }
    } catch (error) {
      console.error('Failed to toggle rule:', error);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;

    try {
      const response = await fetch(`/api/rules?id=${ruleId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchRules();
        if (editingRule?.id === ruleId) {
          setEditingRule(null);
        }
      }
    } catch (error) {
      console.error('Failed to delete rule:', error);
    }
  };

  const handleAddExample = () => {
    if (exampleInput.trim() && !formData.examples.includes(exampleInput.trim())) {
      setFormData({
        ...formData,
        examples: [...formData.examples, exampleInput.trim()],
      });
      setExampleInput('');
    }
  };

  const handleRemoveExample = (exampleToRemove: string) => {
    setFormData({
      ...formData,
      examples: formData.examples.filter(ex => ex !== exampleToRemove),
    });
  };

  const handleUseSuggestion = (suggestion: any) => {
    setIsCreating(true);
    setEditingRule(null);
    setFormData({
      category: suggestion.category,
      rule: suggestion.rule,
      examples: suggestion.examples,
      priority: 50,
    });
    setShowSuggestions(false);
  };

  const rulesByCategory = CATEGORIES.map(cat => ({
    ...cat,
    rules: rules.filter(rule => rule.category === cat.value),
  }));

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Writing Rules</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            💡 Suggestions
          </button>
          <button
            onClick={handleCreateRule}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            + New Rule
          </button>
        </div>
      </div>

      {/* Suggestions Panel */}
      {showSuggestions && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-3">Suggested Rules</h3>
          <div className="space-y-2">
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => handleUseSuggestion(suggestion)}
                className="w-full text-left p-3 bg-white rounded border border-blue-200 hover:border-blue-400 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <span className="text-xs font-medium text-blue-600 uppercase">
                      {suggestion.category}
                    </span>
                    <p className="text-sm text-gray-900 font-medium">{suggestion.rule}</p>
                    {suggestion.examples.length > 0 && (
                      <p className="text-xs text-gray-600 mt-1">
                        Examples: {suggestion.examples.join(', ')}
                      </p>
                    )}
                  </div>
                  <span className="text-blue-600 ml-2">→</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Editor Form */}
      {(isCreating || editingRule) && (
        <div className="bg-white border-2 border-indigo-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {isCreating ? 'Create New Rule' : 'Edit Rule'}
          </h3>

          <div className="space-y-4">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <div className="grid grid-cols-4 gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.value}
                    onClick={() => setFormData({ ...formData, category: cat.value })}
                    className={`p-3 border-2 rounded-lg text-center transition-all ${
                      formData.category === cat.value
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">{cat.icon}</div>
                    <div className="text-xs font-medium text-gray-900">{cat.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Rule Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rule Description *
              </label>
              <input
                type="text"
                value={formData.rule}
                onChange={(e) => setFormData({ ...formData, rule: e.target.value })}
                placeholder="e.g., I use sentence fragments for dramatic effect"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Examples */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Examples (optional)
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={exampleInput}
                  onChange={(e) => setExampleInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddExample();
                    }
                  }}
                  placeholder="Add an example and press Enter"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={handleAddExample}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  Add
                </button>
              </div>
              {formData.examples.length > 0 && (
                <div className="space-y-1">
                  {formData.examples.map((example, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <span className="flex-1 text-sm text-gray-700">"{example}"</span>
                      <button
                        onClick={() => handleRemoveExample(example)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Priority Slider */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority: {formData.priority} (higher = more important)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Low</span>
                <span>Medium</span>
                <span>High</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <button
                onClick={() => {
                  setIsCreating(false);
                  setEditingRule(null);
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRule}
                disabled={!formData.rule.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Rule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rules List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading rules...</p>
          </div>
        ) : rules.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600 mb-4">No writing rules yet</p>
            <button
              onClick={handleCreateRule}
              className="text-indigo-600 hover:text-indigo-800"
            >
              Create your first rule
            </button>
          </div>
        ) : (
          rulesByCategory.map(({ value, label, icon, rules: categoryRules }) => (
            categoryRules.length > 0 && (
              <div key={value} className="bg-white rounded-lg border border-gray-200">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">
                    {icon} {label} ({categoryRules.length})
                  </h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {categoryRules.map(rule => (
                    <div key={rule.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <button
                              onClick={() => handleToggleRule(rule.id)}
                              className={`w-10 h-6 rounded-full transition-colors ${
                                rule.enabled ? 'bg-green-500' : 'bg-gray-300'
                              }`}
                            >
                              <div
                                className={`w-4 h-4 bg-white rounded-full transition-transform ${
                                  rule.enabled ? 'translate-x-5' : 'translate-x-1'
                                }`}
                              />
                            </button>
                            <p className={`font-medium ${rule.enabled ? 'text-gray-900' : 'text-gray-400'}`}>
                              {rule.rule}
                            </p>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              Priority: {rule.priority}
                            </span>
                          </div>
                          {rule.examples.length > 0 && (
                            <div className="ml-13 space-y-1">
                              <p className="text-xs font-medium text-gray-600">Examples:</p>
                              {rule.examples.map((example, idx) => (
                                <p key={idx} className="text-sm text-gray-600 italic">
                                  "{example}"
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleEditRule(rule)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteRule(rule.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          ))
        )}
      </div>
    </div>
  );
}
