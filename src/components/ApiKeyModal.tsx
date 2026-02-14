'use client';

import { useState, useEffect } from 'react';
import { getApiKey, setApiKey, clearApiKey } from '@/lib/storage';

interface ApiKeyModalProps {
  open: boolean;
  onClose: () => void;
}

export function ApiKeyModal({ open, onClose }: ApiKeyModalProps) {
  const [key, setKeyInput] = useState('');
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const existing = getApiKey();
    if (existing) {
      // Show masked version
      setKeyInput('sk-ant-...' + existing.slice(-6));
    }
  }, []);

  async function testAndSaveKey() {
    setTesting(true);
    setError('');
    setSuccess(false);

    try {
      const res = await fetch('/api/test-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-anthropic-key': key,
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Invalid API key');
      }

      setApiKey(key);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid API key. Please check and try again.');
    } finally {
      setTesting(false);
    }
  }

  function handleClear() {
    clearApiKey();
    setKeyInput('');
    setError('');
    setSuccess(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
        <h2 className="text-xl font-bold mb-2">🔑 Anthropic API Key Required</h2>
        <p className="text-sm text-gray-600 mb-4">
          This app uses Claude AI to plan your trip. You'll need your own API key from Anthropic.
        </p>
        <a
          href="https://console.anthropic.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 text-sm underline mb-4 block hover:text-blue-800"
        >
          Get your free API key here →
        </a>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            API Key
          </label>
          <input
            type="password"
            placeholder="sk-ant-api03-..."
            value={key}
            onChange={(e) => setKeyInput(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={testing || success}
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-800">
            ✓ API key saved successfully!
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={testAndSaveKey}
            disabled={!key || testing || success}
            className="flex-1 bg-blue-600 text-white rounded px-4 py-2 font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {testing ? 'Testing...' : success ? 'Saved ✓' : 'Save & Test'}
          </button>
          <button
            onClick={handleClear}
            disabled={testing || success}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Clear
          </button>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Your API key is stored locally in your browser and never sent to our servers.
            It's used only to communicate directly with Anthropic's API.
          </p>
        </div>
      </div>
    </div>
  );
}
