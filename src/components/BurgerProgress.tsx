'use client';

import { useState } from 'react';
import { BurgerAchievement } from '@/lib/types';

interface BurgerProgressProps {
  achievements: BurgerAchievement[];
  score: number;
}

export function BurgerProgress({ achievements, score }: BurgerProgressProps) {
  const [expanded, setExpanded] = useState(false);

  const legendary = achievements.filter((a) => a.rarity === 'legendary' && a.collected).length;
  const legendaryTotal = achievements.filter((a) => a.rarity === 'legendary').length;

  const rare = achievements.filter((a) => a.rarity === 'rare' && a.collected).length;
  const rareTotal = achievements.filter((a) => a.rarity === 'rare').length;

  const common = achievements.filter((a) => a.rarity === 'common' && a.collected).length;
  const commonTotal = achievements.filter((a) => a.rarity === 'common').length;

  const legendaryPercent = legendaryTotal > 0 ? (legendary / legendaryTotal) * 100 : 0;
  const rarePercent = rareTotal > 0 ? (rare / rareTotal) * 100 : 0;
  const commonPercent = commonTotal > 0 ? (common / commonTotal) * 100 : 0;

  const total = legendary + rare + common;

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="flex w-full items-center gap-2 rounded-xl border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-3 py-2 shadow-sm transition-colors hover:border-amber-300 active:bg-amber-100"
      >
        <span className="text-lg">🏆</span>
        <span className="text-sm font-semibold text-gray-900">{score} pts</span>
        <span className="text-xs text-gray-500">·</span>
        <span className="text-xs text-gray-600">{total} burgers</span>
        <svg className="ml-auto h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>
    );
  }

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-4 shadow-lg">
      <button
        onClick={() => setExpanded(false)}
        className="flex w-full items-center gap-3 mb-4"
      >
        <span className="text-3xl">🏆</span>
        <div className="text-left">
          <h3 className="font-bold text-lg text-gray-900">Burger Hunter Progress</h3>
          <p className="text-sm text-gray-600">Score: {score} points</p>
        </div>
        <svg className="ml-auto h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M14.77 12.79a.75.75 0 01-1.06-.02L10 8.832 6.29 12.77a.75.75 0 11-1.08-1.04l4.25-4.5a.75.75 0 011.08 0l4.25 4.5a.75.75 0 01-.02 1.06z" clipRule="evenodd" />
        </svg>
      </button>

      <div className="space-y-3">
        {/* Legendary */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold text-amber-900 flex items-center gap-1">
              <span>⭐</span> Legendary
            </span>
            <span className="text-xs text-gray-600">{legendary}/{legendaryTotal}</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 transition-all duration-500"
              style={{ width: `${legendaryPercent}%` }}
            />
          </div>
        </div>

        {/* Rare */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold text-purple-700 flex items-center gap-1">
              <span>💎</span> Rare
            </span>
            <span className="text-xs text-gray-600">{rare}/{rareTotal}</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-400 to-purple-600 transition-all duration-500"
              style={{ width: `${rarePercent}%` }}
            />
          </div>
        </div>

        {/* Common */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold text-gray-600 flex items-center gap-1">
              <span>🍔</span> Common
            </span>
            <span className="text-xs text-gray-600">{common}/{commonTotal}</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-gray-300 to-gray-500 transition-all duration-500"
              style={{ width: `${commonPercent}%` }}
            />
          </div>
        </div>
      </div>

      {achievements.length === 0 && (
        <p className="text-xs text-gray-500 text-center mt-4">
          Start your burger hunt to earn achievements!
        </p>
      )}
    </div>
  );
}
