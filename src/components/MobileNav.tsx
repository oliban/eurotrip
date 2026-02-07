'use client';

import { useLocale } from '@/hooks/useLocale';

interface MobileNavProps {
  activeView: 'chat' | 'map' | 'plan';
  onViewChange: (view: 'chat' | 'map' | 'plan') => void;
}

function ChatIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={active ? '#2563eb' : '#9ca3af'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function MapIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={active ? '#2563eb' : '#9ca3af'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function PlanIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={active ? '#2563eb' : '#9ca3af'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

export default function MobileNav({ activeView, onViewChange }: MobileNavProps) {
  const { t } = useLocale();

  const tabs = [
    { key: 'chat' as const, label: t['nav.chat'], Icon: ChatIcon },
    { key: 'map' as const, label: t['nav.map'], Icon: MapIcon },
    { key: 'plan' as const, label: t['nav.plan'], Icon: PlanIcon },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 flex h-14 items-center border-t border-zinc-200 bg-white shadow-[0_-2px_8px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom)]">
      {tabs.map(({ key, label, Icon }) => {
        const active = activeView === key;
        return (
          <button
            key={key}
            onClick={() => onViewChange(key)}
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 pt-1 transition-colors ${
              active ? 'text-blue-600' : 'text-zinc-400'
            }`}
          >
            <Icon active={active} />
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
