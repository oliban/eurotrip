'use client';

import React, { createContext, useContext, useEffect, useRef, useCallback } from 'react';
import { TripState, TripAction, DEFAULT_TRIP_STATE } from '@/lib/types';
import { useTrip } from '@/hooks/useTrip';

interface TripContextValue {
  state: TripState;
  dispatch: React.Dispatch<TripAction>;
}

const TripContext = createContext<TripContextValue | null>(null);

const STORAGE_KEY = 'eurotrip_state';

function loadFromStorage(): TripState {
  if (typeof window === 'undefined') return DEFAULT_TRIP_STATE;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Validate basic structure
      if (parsed && parsed.metadata && Array.isArray(parsed.stops)) {
        return {
          ...DEFAULT_TRIP_STATE,
          ...parsed,
          // Always clear route segments on load — they'll be re-fetched
          route_segments: [],
        };
      }
    }
  } catch {
    // Corrupted storage, start fresh
  }
  return DEFAULT_TRIP_STATE;
}

export function TripProvider({ children }: { children: React.ReactNode }) {
  // Always initialize with default state to avoid hydration mismatch.
  // Load from localStorage in an effect after mount.
  const { state, dispatch } = useTrip(DEFAULT_TRIP_STATE);
  const isInitialized = useRef(false);

  // Load saved state from localStorage after mount (avoids SSR hydration mismatch)
  useEffect(() => {
    const stored = loadFromStorage();
    if (stored !== DEFAULT_TRIP_STATE && stored.stops.length > 0) {
      dispatch({ type: 'LOAD_STATE', payload: stored });
    }
    isInitialized.current = true;
  }, [dispatch]);

  // Debounced persistence to localStorage
  useEffect(() => {
    if (!isInitialized.current) {
      return;
    }

    const timer = setTimeout(() => {
      try {
        // Strip route segment geometry to reduce storage size
        const toStore: TripState = {
          ...state,
          route_segments: state.route_segments.map((seg) => ({
            from_stop_id: seg.from_stop_id,
            to_stop_id: seg.to_stop_id,
            distance_km: seg.distance_km,
            duration_hours: seg.duration_hours,
            // Omit geometry to save space
          })),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
      } catch (e) {
        if (e instanceof DOMException && e.name === 'QuotaExceededError') {
          console.warn('localStorage quota exceeded, trip data not persisted');
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [state]);

  return (
    <TripContext.Provider value={{ state, dispatch }}>
      {children}
    </TripContext.Provider>
  );
}

export function useTripContext(): TripContextValue {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error('useTripContext must be used within TripProvider');
  return ctx;
}

export function useTripState(): TripState {
  const { state } = useTripContext();
  return state;
}

export function useTripDispatch(): React.Dispatch<TripAction> {
  const { dispatch } = useTripContext();
  return dispatch;
}
