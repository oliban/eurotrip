'use client';

import { TripMode } from '@/lib/types';

interface ModeSelectorProps {
  onSelect: (mode: TripMode) => void;
}

export function ModeSelector({ onSelect }: ModeSelectorProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-2xl w-full shadow-2xl">
        <h2 className="text-2xl font-bold mb-2 text-center">Choose Your Adventure</h2>
        <p className="text-gray-600 text-center mb-6">
          How do you want to plan your European road trip?
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Standard Mode */}
          <button
            onClick={() => onSelect('standard')}
            className="group relative overflow-hidden rounded-xl border-2 border-gray-200 bg-gradient-to-br from-blue-50 to-blue-100 p-6 text-left transition-all hover:border-blue-400 hover:shadow-lg active:scale-95"
          >
            <div className="text-4xl mb-3">🗺️</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Standard Trip Planner
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Plan a customized European road trip with stops, activities, accommodations, and budget estimates.
            </p>
            <div className="text-xs text-gray-500">
              ✓ Flexible destinations<br />
              ✓ Full activity planning<br />
              ✓ Accommodation suggestions<br />
              ✓ Budget tracking
            </div>
          </button>

          {/* Burger Challenge Mode */}
          <button
            onClick={() => onSelect('burger_challenge')}
            className="group relative overflow-hidden rounded-xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-100 p-6 text-left transition-all hover:border-amber-400 hover:shadow-lg active:scale-95"
          >
            <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
              NEW!
            </div>
            <div className="text-4xl mb-3">🍔</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Burger Route Challenge
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Embark on Europe's Ultimate Burger Tour! Visit legendary burger joints and collect achievements.
            </p>
            <div className="text-xs text-gray-500">
              ✓ Burger-focused routing<br />
              ✓ Achievement system<br />
              ✓ Legendary/rare burger spots<br />
              ✓ Foodie gamification 🏆
            </div>
          </button>
        </div>

        <p className="text-xs text-gray-400 text-center mt-6">
          You can change modes later by resetting the trip
        </p>
      </div>
    </div>
  );
}
