'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useTripState, useTripDispatch, useTripContext } from '@/store/trip-context';
import { useRoute } from '@/hooks/useRoute';
import { useFoodPlaces } from '@/hooks/useFoodPlaces';
import { useLocale } from '@/hooks/useLocale';
import { Stop, RouteSegment } from '@/lib/types';

export default function MapView() {
  const { stops, route_segments } = useTripState();
  const { state: tripState } = useTripContext();
  const dispatch = useTripDispatch();
  const { isLoading } = useRoute();
  const { currency } = useLocale();
  const [showFood, setShowFood] = useState(false);

  const isBurgerMode = tripState.metadata.mode === 'burger_challenge';
  const foodQuery = isBurgerMode ? 'burger' : (tripState.metadata.foodQuery || 'restaurant');
  const hasPreferences = isBurgerMode || !!tripState.metadata.foodQuery;

  const { foodPlaces, loading: foodLoading } = useFoodPlaces(stops, showFood && hasPreferences, foodQuery);
  const [mapboxToken, setMapboxToken] = useState<string>('');

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const foodMarkersRef = useRef<mapboxgl.Marker[]>([]);

  const handleFoodToggle = () => {
    if (!showFood && !hasPreferences) {
      // No preferences yet — switch to chat and ask Claude
      window.location.hash = 'chat';
      window.dispatchEvent(new CustomEvent('food-preferences-request'));
      return;
    }
    setShowFood(!showFood);
  };

  // Auto-enable food overlay once preferences come in
  useEffect(() => {
    if (hasPreferences && !showFood && tripState.metadata.foodQuery) {
      setShowFood(true);
    }
  }, [tripState.metadata.foodQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch Mapbox token from server
  useEffect(() => {
    async function fetchToken() {
      try {
        const res = await fetch('/api/mapbox-token');
        const data = await res.json();
        if (data.token) {
          setMapboxToken(data.token);
          mapboxgl.accessToken = data.token;
        }
      } catch (error) {
        console.error('Failed to fetch Mapbox token:', error);
      }
    }
    fetchToken();
  }, []);

  // Initialize map ONCE (after token is loaded)
  useEffect(() => {
    if (!containerRef.current || mapRef.current || !mapboxToken) return;

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
  }, [mapboxToken]);

  // Resize map when container becomes visible (e.g. switching from chat to map tab on mobile)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ro = new ResizeObserver(() => {
      if (mapRef.current && container.clientWidth > 0 && container.clientHeight > 0) {
        mapRef.current.resize();
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
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
      const sym = currency === 'SEK' ? 'kr' : currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '€';

      const activitiesHtml = stop.activities.slice(0, 4).map((a) => {
        const icon = a.category === 'burger' ? '🍔' : a.category === 'fondue' ? '🧀' : a.category === 'food' ? '🍽️' : a.category === 'adventure' ? '🏔️' : a.category === 'culture' ? '🏛️' : a.category === 'nightlife' ? '🌙' : a.category === 'shopping' ? '🛍️' : '📍';
        return `<div style="display:flex;align-items:center;gap:4px;"><span style="font-size:12px;">${icon}</span><span style="font-size:11px;color:#374151;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:180px;">${a.name}</span></div>`;
      }).join('');
      const moreCount = stop.activities.length - 4;

      const accomHtml = stop.accommodation
        ? `<div style="display:flex;align-items:center;gap:4px;margin-top:4px;padding-top:4px;border-top:1px solid #e5e7eb;"><span style="font-size:12px;">🏨</span><span style="font-size:11px;color:#374151;">${stop.accommodation.name}</span>${stop.accommodation.cost_per_night ? `<span style="font-size:10px;color:#9ca3af;margin-left:auto;">${sym}${stop.accommodation.cost_per_night}/n</span>` : ''}</div>`
        : '';

      const stopCost = (stop.accommodation?.cost_per_night || 0) * stop.nights + stop.activities.reduce((s, a) => s + (a.cost_estimate || 0), 0);

      const popupHtml = `
        <div style="font-family: system-ui, sans-serif; padding: 4px; min-width: 200px; max-width: 260px;">
          <div style="display:flex;justify-content:space-between;align-items:baseline;">
            <strong style="font-size: 14px;">${stop.name}</strong>
            ${stop.country ? `<span style="font-size:11px;color:#9ca3af;">${stop.country}</span>` : ''}
          </div>
          <div style="font-size:11px;color:#6b7280;margin:2px 0 6px;">🗓️ ${nightsText}${stopCost > 0 ? ` · ~${sym}${Math.round(stopCost)}` : ''}</div>
          ${activitiesHtml ? `<div style="display:flex;flex-direction:column;gap:2px;">${activitiesHtml}</div>` : ''}
          ${moreCount > 0 ? `<div style="font-size:10px;color:#9ca3af;margin-top:2px;">+${moreCount} more</div>` : ''}
          ${accomHtml}
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
  }, [stops, dispatch, currency]);

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

  // Update food markers when food places change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !showFood) {
      foodMarkersRef.current.forEach((marker) => marker.remove());
      foodMarkersRef.current = [];
      return;
    }

    foodMarkersRef.current.forEach((marker) => marker.remove());
    foodMarkersRef.current = [];

    const markerEmoji = isBurgerMode ? '\u{1F354}' : '\u{1F37D}\u{FE0F}';
    const markerColor = isBurgerMode ? '#f59e0b' : '#ec4899';
    const markerHoverColor = isBurgerMode ? '#d97706' : '#db2777';
    const category = isBurgerMode ? 'burger' as const : 'food' as const;

    foodPlaces.forEach((place) => {
      const el = document.createElement('div');
      el.style.width = '28px';
      el.style.height = '28px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = markerColor;
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.fontSize = '16px';
      el.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.3)';
      el.style.cursor = 'pointer';
      el.style.border = '2px solid white';
      el.textContent = markerEmoji;

      const nearestStop = stops.reduce<Stop | null>((best, stop) => {
        const d = Math.hypot(stop.coordinates.lat - place.location.lat, stop.coordinates.lng - place.location.lng);
        if (!best) return stop;
        const bestD = Math.hypot(best.coordinates.lat - place.location.lat, best.coordinates.lng - place.location.lng);
        return d < bestD ? stop : best;
      }, null);

      const popupEl = document.createElement('div');
      popupEl.style.fontFamily = 'system-ui, sans-serif';
      popupEl.style.padding = '4px';
      popupEl.style.maxWidth = '220px';
      popupEl.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:start;gap:8px;">
          <strong style="font-size: 13px;">${place.name}</strong>
        </div>
        <span style="color: #6b7280; font-size: 11px;">\u{2B50} ${place.rating}/5</span>
        ${place.priceLevel ? `<span style="color: #6b7280; font-size: 11px;"> \u{00B7} ${'\u{20AC}'.repeat(place.priceLevel)}</span>` : ''}
        <br/>
        <span style="color: #6b7280; font-size: 11px;">${place.address}</span>
      `;

      const addBtn = document.createElement('button');
      addBtn.textContent = '+ Add to plan';
      addBtn.style.cssText = `margin-top:6px;width:100%;padding:4px 0;border:none;border-radius:6px;background:${markerColor};color:white;font-size:12px;font-weight:600;cursor:pointer;`;
      addBtn.addEventListener('mouseenter', () => { addBtn.style.background = markerHoverColor; });
      addBtn.addEventListener('mouseleave', () => { addBtn.style.background = markerColor; });
      addBtn.addEventListener('click', () => {
        if (!nearestStop) return;
        dispatch({
          type: 'UPDATE_STOP',
          payload: {
            stopId: nearestStop.id,
            updates: {
              activities: [
                ...nearestStop.activities,
                {
                  name: place.name,
                  category,
                  address: place.address,
                  description: `\u{2B50} ${place.rating}/5 on Google`,
                  duration_hours: 1,
                },
              ],
            },
          },
        });
        addBtn.textContent = '\u{2713} Added to ' + nearestStop.name;
        addBtn.style.background = '#16a34a';
        addBtn.style.cursor = 'default';
        addBtn.disabled = true;
      });
      popupEl.appendChild(addBtn);

      const popup = new mapboxgl.Popup({
        offset: 15,
        closeButton: false,
      }).setDOMContent(popupEl);

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([place.location.lng, place.location.lat])
        .setPopup(popup)
        .addTo(map);

      foodMarkersRef.current.push(marker);
    });
  }, [foodPlaces, showFood, stops, dispatch, isBurgerMode]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" style={{ minHeight: '300px' }} />
      
      {/* Food toggle button */}
      {stops.length > 0 && (
        <button
          onClick={handleFoodToggle}
          className={`absolute top-3 left-3 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md text-sm font-medium flex items-center gap-2 transition-colors ${
            showFood
              ? isBurgerMode ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-pink-500 text-white hover:bg-pink-600'
              : 'bg-white/90 text-gray-700 hover:bg-white'
          }`}
        >
          <span className="text-base">{isBurgerMode ? '\u{1F354}' : '\u{1F37D}\u{FE0F}'}</span>
          {isBurgerMode
            ? (showFood ? 'Hide Burger Spots' : 'Show Burger Spots')
            : (showFood ? 'Hide Restaurants' : 'Find Restaurants')
          }
          {foodLoading && (
            <svg
              className="animate-spin h-3 w-3"
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
          )}
        </button>
      )}

      {/* Route loading indicator */}
      {isLoading && (
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-md text-sm text-gray-700 flex items-center gap-2">
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
