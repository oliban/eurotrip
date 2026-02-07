'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useReactToPrint } from 'react-to-print';
import { TripProvider, useTripState } from '@/store/trip-context';
import ViewTabs from '@/components/ViewTabs';
import MobileNav from '@/components/MobileNav';
import PlanView from '@/components/PlanView';
import TripPrintLayout from '@/components/TripPrintLayout';

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-zinc-100" />,
});

const ChatPanel = dynamic(() => import('@/components/ChatPanel'), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-zinc-50" />,
});

type ActiveView = 'chat' | 'map' | 'plan';

function AppContent() {
  const tripState = useTripState();
  const [activeView, setActiveView] = useState<ActiveView>('chat');
  const [desktopTab, setDesktopTab] = useState<'map' | 'plan'>('map');

  const mapImageRef = useRef<string | undefined>(undefined);
  const [mapImageUrl, setMapImageUrl] = useState<string | undefined>();
  const printRef = useRef<HTMLDivElement>(null);

  // Initialize from URL hash
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash === 'chat' || hash === 'map' || hash === 'plan') {
      setActiveView(hash as ActiveView);
    }
  }, []);

  // Listen for hash changes (browser back/forward)
  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'chat' || hash === 'map' || hash === 'plan') {
        setActiveView(hash as ActiveView);
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const handleMobileViewChange = useCallback((view: ActiveView) => {
    setActiveView(view);
    window.location.hash = view;
  }, []);

  const captureMapImage = useCallback((): string | undefined => {
    try {
      const canvas = document.querySelector('canvas.mapboxgl-canvas') as HTMLCanvasElement | null;
      if (!canvas) return undefined;
      return canvas.toDataURL('image/png');
    } catch {
      return undefined;
    }
  }, []);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: tripState.metadata.name || 'Eurotrip Itinerary',
    onBeforePrint: async () => {
      const img = captureMapImage();
      mapImageRef.current = img;
      setMapImageUrl(img);
      await new Promise((resolve) => setTimeout(resolve, 50));
    },
    onAfterPrint: () => {
      mapImageRef.current = undefined;
      setMapImageUrl(undefined);
    },
  });

  const handleExportPdf = useCallback(() => {
    const img = captureMapImage();
    mapImageRef.current = img;
    setMapImageUrl(img);
    setTimeout(() => {
      handlePrint();
    }, 150);
  }, [captureMapImage, handlePrint]);

  // Determine visibility for map and plan (considering both mobile activeView and desktop tab)
  const showMap = activeView === 'map' || desktopTab === 'map';
  const showPlan = activeView === 'plan' || desktopTab === 'plan';

  return (
    <div className="relative h-[100dvh] overflow-hidden bg-white">
      <div className="flex h-full flex-col lg:flex-row">
        {/* Chat Panel — single instance */}
        {/* Mobile: shown/hidden based on activeView */}
        {/* Desktop (lg+): always visible as sidebar */}
        <div
          className={[
            // Desktop: always show as sidebar
            'lg:flex lg:w-[380px] lg:shrink-0 lg:flex-col lg:border-r lg:border-zinc-200 xl:w-[420px]',
            // Mobile: pb-16 clears fixed MobileNav; desktop: pb-14 clears dev indicator
            activeView === 'chat' ? 'flex flex-1 flex-col pb-16 lg:pb-14 lg:flex-initial' : 'hidden lg:flex',
          ].join(' ')}
        >
          <ChatPanel />
        </div>

        {/* Right Panel: Map/Plan — single instance each */}
        <div
          className={[
            'lg:flex lg:flex-1 lg:flex-col',
            activeView !== 'chat' ? 'flex flex-1 flex-col' : 'hidden lg:flex',
          ].join(' ')}
        >
          {/* Desktop tab bar */}
          <div className="hidden lg:block">
            <ViewTabs activeTab={desktopTab} onTabChange={setDesktopTab} />
          </div>

          <div className="relative flex-1">
            {/* Map — always mounted, visibility toggled to avoid Mapbox remount */}
            <div
              className={[
                'absolute inset-0',
                showMap ? 'visible z-10' : 'invisible z-0',
              ].join(' ')}
            >
              <MapView />
            </div>

            {/* Plan view — only overlay when there are stops to show */}
            {showPlan && tripState.stops.length > 0 && (
              <div className="absolute inset-0 z-20 overflow-y-auto pb-14 lg:pb-0">
                <PlanView onExportPdf={handleExportPdf} />
              </div>
            )}
          </div>
        </div>

        {/* Mobile bottom navigation */}
        <div className="lg:hidden">
          <MobileNav activeView={activeView} onViewChange={handleMobileViewChange} />
        </div>
      </div>

      {/* Print layout (off-screen) */}
      <div
        style={{ position: 'absolute', left: '-9999px', top: 0, width: '210mm' }}
        aria-hidden="true"
      >
        <TripPrintLayout
          ref={printRef}
          tripState={tripState}
          mapImageUrl={mapImageUrl}
        />
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <TripProvider>
      <AppContent />
    </TripProvider>
  );
}
