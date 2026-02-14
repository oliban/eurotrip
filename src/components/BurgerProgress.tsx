import { BurgerAchievement } from '@/lib/types';

interface BurgerProgressProps {
  achievements: BurgerAchievement[];
  score: number;
}

export function BurgerProgress({ achievements, score }: BurgerProgressProps) {
  const legendary = achievements.filter((a) => a.rarity === 'legendary' && a.collected).length;
  const legendaryTotal = achievements.filter((a) => a.rarity === 'legendary').length;
  
  const rare = achievements.filter((a) => a.rarity === 'rare' && a.collected).length;
  const rareTotal = achievements.filter((a) => a.rarity === 'rare').length;
  
  const common = achievements.filter((a) => a.rarity === 'common' && a.collected).length;
  const commonTotal = achievements.filter((a) => a.rarity === 'common').length;

  const legendaryPercent = legendaryTotal > 0 ? (legendary / legendaryTotal) * 100 : 0;
  const rarePercent = rareTotal > 0 ? (rare / rareTotal) * 100 : 0;
  const commonPercent = commonTotal > 0 ? (common / commonTotal) * 100 : 0;

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-4 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">🏆</span>
        <div>
          <h3 className="font-bold text-lg text-gray-900">Burger Hunter Progress</h3>
          <p className="text-sm text-gray-600">Score: {score} points</p>
        </div>
      </div>

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
