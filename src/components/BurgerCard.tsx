import { Activity } from '@/lib/types';

interface BurgerCardProps {
  activity: Activity;
  travelers: number;
  currency?: string;
}

export function BurgerCard({ activity, travelers, currency = 'EUR' }: BurgerCardProps) {
  const currencySymbol = currency === 'SEK' ? 'kr' : '€';
  
  // Choose styling based on category
  const isFondue = activity.category === 'fondue';
  const borderColor = isFondue ? 'border-yellow-500' : 'border-amber-500';
  const bgGradient = isFondue ? 'from-yellow-50 to-amber-50' : 'from-amber-50 to-orange-50';
  const icon = isFondue ? '🧀' : '🍔';
  const tagColor = isFondue ? 'bg-yellow-200 text-yellow-900' : 'bg-amber-200 text-amber-900';
  
  return (
    <div className={`border-l-4 ${borderColor} bg-gradient-to-r ${bgGradient} p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-start gap-3">
        <span className="text-3xl flex-shrink-0">{icon}</span>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-lg text-gray-900">{activity.name}</h4>
          
          {activity.specialty && (
            <p className="text-sm italic text-amber-800 mt-1 font-medium">
              "{activity.specialty}"
            </p>
          )}
          
          {activity.description && (
            <p className="text-sm text-gray-700 mt-2">{activity.description}</p>
          )}
          
          {activity.address && (
            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
              <span>📍</span>
              <span>{activity.address}</span>
            </p>
          )}
          
          <div className="flex items-center gap-4 mt-3 flex-wrap">
            {activity.cost_estimate !== undefined && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">
                  {currencySymbol}{activity.cost_estimate}
                </span>
                {travelers > 1 && (
                  <span className="text-xs text-gray-500">
                    ({currencySymbol}{Math.round(activity.cost_estimate / travelers)}/person)
                  </span>
                )}
              </div>
            )}
            
            {activity.time && (
              <span className="text-xs bg-amber-200 text-amber-900 px-2 py-1 rounded-full font-medium">
                {activity.time}
              </span>
            )}
            
            {activity.duration_hours && (
              <span className="text-xs text-gray-500">
                ~{activity.duration_hours}h
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
