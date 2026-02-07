'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useTripState, useTripDispatch } from '@/store/trip-context';
import { useRoute } from '@/hooks/useRoute';
import { Stop, RouteSegment } from '@/lib/types';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

export default function MapView() {
  const { stops, route_segments } = useTripState();
  const dispatch = useTripDispatch();
  const { isLoading } = useRoute();

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  // Initialize map ONCE
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [10, 50], // Europe
      zoom: 4,
      preserveDrawingBuffer: true,
    });

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add route source and layer once the map style loads
    map.on('load', () => {
      map.addSource('route', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });

      map.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        filter: ['!=', ['get', 'is_ferry'], true],
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
        paint: {
          'line-color': '#2563eb',
          'line-width': 4,
          'line-opacity': 0.7,
        },
      });

      map.addLayer({
        id: 'route-line-ferry',
        type: 'line',
        source: 'route',
        filter: ['==', ['get', 'is_ferry'], true],
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
        paint: {
          'line-color': '#2563eb',
          'line-width': 3,
          'line-opacity': 0.5,
          'line-dasharray': [4, 4],
        },
      });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers when stops change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add new markers
    stops.forEach((stop: Stop, index: number) => {
      // Create custom numbered marker element
      const el = document.createElement('div');
      el.style.width = '32px';
      el.style.height = '32px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = '#2563eb';
      el.style.color = 'white';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.fontWeight = 'bold';
      el.style.fontSize = '14px';
      el.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.3)';
      el.style.cursor = 'pointer';
      el.style.border = '2px solid white';
      el.textContent = String(index + 1);

      // Build popup HTML
      const nightsText = stop.nights === 1 ? '1 night' : `${stop.nights} nights`;
      const countryText = stop.country ? `<br/><span style="color: #6b7280; font-size: 12px;">${stop.country}</span>` : '';
      const popupHtml = `
        <div style="font-family: system-ui, sans-serif; padding: 2px;">
          <strong style="font-size: 14px;">${stop.name}</strong>
          ${countryText}
          <br/>
          <span style="color: #6b7280; font-size: 12px;">${nightsText}</span>
        </div>
      `;

      const popup = new mapboxgl.Popup({
        offset: 20,
        closeButton: true,
        closeOnClick: false,
      }).setHTML(popupHtml);

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([stop.coordinates.lng, stop.coordinates.lat])
        .setPopup(popup)
        .addTo(map);

      // Click handler: select stop and show popup
      el.addEventListener('click', () => {
        dispatch({ type: 'SET_SELECTED_STOP', payload: stop.id });
      });

      markersRef.current.push(marker);
    });
  }, [stops, dispatch]);

  // Fit bounds when stops change (2+ stops)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || stops.length < 2) return;

    const bounds = new mapboxgl.LngLatBounds();
    stops.forEach((stop: Stop) => {
      bounds.extend([stop.coordinates.lng, stop.coordinates.lat]);
    });

    map.fitBounds(bounds, {
      padding: 60,
      maxZoom: 12,
      duration: 1000,
    });
  }, [stops]);

  // Update route lines when route_segments change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const updateRouteSource = () => {
      const source = map.getSource('route') as mapboxgl.GeoJSONSource | undefined;
      if (!source) return;

      // Combine all segment geometries into a FeatureCollection
      const features: GeoJSON.Feature<GeoJSON.LineString>[] = route_segments
        .filter((seg: RouteSegment) => seg.geometry)
        .map((seg: RouteSegment) => ({
          type: 'Feature' as const,
          properties: {
            from_stop_id: seg.from_stop_id,
            to_stop_id: seg.to_stop_id,
            is_ferry: seg.is_ferry ?? false,
          },
          geometry: seg.geometry!,
        }));

      const featureCollection: GeoJSON.FeatureCollection<GeoJSON.LineString> = {
        type: 'FeatureCollection',
        features,
      };

      source.setData(featureCollection);
    };

    // If the map style is already loaded, update immediately.
    // Otherwise wait for the load event.
    if (map.isStyleLoaded()) {
      updateRouteSource();
    } else {
      map.once('load', updateRouteSource);
    }
  }, [route_segments]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" style={{ minHeight: '300px' }} />
      {isLoading && (
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-md text-sm text-gray-700 flex items-center gap-2">
          <svg
            className="animate-spin h-4 w-4 text-blue-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Loading routes...
        </div>
      )}
    </div>
  );
}
