'use client';

import { useState, useEffect, FormEvent } from 'react';

interface PasswordGateProps {
  children: React.ReactNode;
}

export default function PasswordGate({ children }: PasswordGateProps) {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if already authenticated this session
    if (sessionStorage.getItem('auth') === '1') {
      setAuthenticated(true);
    } else {
      // Check if password is even required
      fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: '' }),
      })
        .then((res) => {
          if (res.ok) {
            // No password configured
            sessionStorage.setItem('auth', '1');
            setAuthenticated(true);
          } else {
            setAuthenticated(false);
          }
        })
        .catch(() => setAuthenticated(false));
    }
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        sessionStorage.setItem('auth', '1');
        setAuthenticated(true);
      } else {
        setError('Wrong password');
        setPassword('');
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (authenticated === null) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-zinc-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-blue-600" />
      </div>
    );
  }

  // Authenticated
  if (authenticated) {
    return <>{children}</>;
  }

  // Password prompt
  return (
    <div className="flex h-[100dvh] items-center justify-center bg-gradient-to-br from-blue-50 to-zinc-100 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl"
      >
        <div className="mb-6 text-center">
          <span className="text-4xl">🗺️</span>
          <h1 className="mt-3 text-xl font-bold text-zinc-900">Eurotrip Planner</h1>
          <p className="mt-1 text-sm text-zinc-500">Enter password to continue</p>
        </div>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
          className="w-full rounded-lg border border-zinc-300 px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        />

        {error && (
          <p className="mt-2 text-center text-sm text-red-500">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !password}
          className="mt-4 w-full rounded-lg bg-blue-600 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Checking...' : 'Enter'}
        </button>
      </form>
    </div>
  );
}
