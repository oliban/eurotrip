'use client';

import { useLocale } from '@/hooks/useLocale';

interface ViewTabsProps {
  activeTab: 'map' | 'plan';
  onTabChange: (tab: 'map' | 'plan') => void;
  className?: string;
}

export default function ViewTabs({ activeTab, onTabChange, className = '' }: ViewTabsProps) {
  const { t } = useLocale();

  return (
    <div className={`flex h-10 border-b border-zinc-200 bg-white ${className}`}>
      <button
        onClick={() => onTabChange('map')}
        className={`relative flex-1 text-sm font-medium transition-colors ${
          activeTab === 'map'
            ? 'text-blue-600'
            : 'text-zinc-500 hover:text-zinc-700'
        }`}
      >
        {t['tabs.map']}
        {activeTab === 'map' && (
          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
        )}
      </button>
      <button
        onClick={() => onTabChange('plan')}
        className={`relative flex-1 text-sm font-medium transition-colors ${
          activeTab === 'plan'
            ? 'text-blue-600'
            : 'text-zinc-500 hover:text-zinc-700'
        }`}
      >
        {t['tabs.plan']}
        {activeTab === 'plan' && (
          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
        )}
      </button>
    </div>
  );
}
