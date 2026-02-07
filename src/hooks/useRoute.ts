import { useEffect, useRef, useCallback, useState } from 'react';
import { useTripState, useTripDispatch } from '@/store/trip-context';
import { RouteSegment, Stop } from '@/lib/types';

/**
 * Generates a cache key for a pair of stop IDs.
 */
function segmentCacheKey(fromId: string, toId: string): string {
  return `${fromId}-${toId}`;
}

/**
 * Hook that watches trip stops and automatically fetches driving routes
 * when route_segments is empty (i.e. after stops change).
 *
 * Features:
 * - 300ms debounce to handle rapid stop changes during tool processing
 * - Caches fetched segments by stop-pair key to avoid refetching unchanged segments
 * - Aborts in-flight requests on cleanup or re-trigger
 * - Returns loading state
 */
export function useRoute(): { isLoading: boolean } {
  const { stops, route_segments } = useTripState();
  const dispatch = useTripDispatch();
  const [isLoading, setIsLoading] = useState(false);

  // Cache: maps "fromId-toId" to the fetched RouteSegment
  const cacheRef = useRef<Map<string, RouteSegment>>(new Map());

  // Abort controller ref for cancelling in-flight fetches
  const abortRef = useRef<AbortController | null>(null);

  // Store stable reference to stops for the async callback
  const stopsRef = useRef<Stop[]>(stops);
  stopsRef.current = stops;

  const fetchRoutes = useCallback(async (currentStops: Stop[]) => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token || currentStops.length < 2) {
      return;
    }

    // Cancel any in-flight request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);

    try {
      // Determine which segments we need to fetch vs which are cached
      const cache = cacheRef.current;
      const cachedSegments: RouteSegment[] = [];
      const neededIndices: number[] = [];

      for (let i = 0; i < currentStops.length - 1; i++) {
        const key = segmentCacheKey(currentStops[i].id, currentStops[i + 1].id);
        const cached = cache.get(key);
        if (cached) {
          cachedSegments.push(cached);
        } else {
          neededIndices.push(i);
        }
      }

      // If everything is cached, just dispatch
      if (neededIndices.length === 0) {
        if (!controller.signal.aborted) {
          // Rebuild the full ordered segment list from cache
          const allSegments: RouteSegment[] = [];
          for (let i = 0; i < currentStops.length - 1; i++) {
            const key = segmentCacheKey(currentStops[i].id, currentStops[i + 1].id);
            allSegments.push(cache.get(key)!);
          }
          dispatch({ type: 'SET_ROUTE_SEGMENTS', payload: allSegments });
        }
        setIsLoading(false);
        return;
      }

      // Build a list of stop-pairs to fetch (only uncached ones)
      // We still use fetchAllRouteSegments for simplicity, passing only needed pairs
      // But since fetchAllRouteSegments works on consecutive stops, we fetch them individually
      const fetchedSegments: RouteSegment[] = [];
      for (let idx = 0; idx < neededIndices.length; idx++) {
        if (controller.signal.aborted) return;

        const i = neededIndices[idx];
        const from = currentStops[i];
        const to = currentStops[i + 1];

        // Small delay between requests to avoid rate limiting (skip first)
        if (idx > 0) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        if (controller.signal.aborted) return;

        try {
          const { fetchRouteSegment } = await import('@/lib/mapbox');
          const segment = await fetchRouteSegment(
            from.coordinates,
            to.coordinates,
            token
          );
          segment.from_stop_id = from.id;
          segment.to_stop_id = to.id;

          // Store in cache
          const key = segmentCacheKey(from.id, to.id);
          cache.set(key, segment);
          fetchedSegments.push(segment);
        } catch (err) {
          console.error(`Failed to fetch route from "${from.name}" to "${to.name}":`, err);
          // Create a straight-line ferry/flight segment
          const fallback: RouteSegment = {
            from_stop_id: from.id,
            to_stop_id: to.id,
            geometry: {
              type: 'LineString',
              coordinates: [
                [from.coordinates.lng, from.coordinates.lat],
                [to.coordinates.lng, to.coordinates.lat],
              ],
            },
            is_ferry: true,
          };
          const key = segmentCacheKey(from.id, to.id);
          cache.set(key, fallback);
          fetchedSegments.push(fallback);
        }
      }

      if (controller.signal.aborted) return;

      // Rebuild the full ordered segment list from cache
      const allSegments: RouteSegment[] = [];
      for (let i = 0; i < currentStops.length - 1; i++) {
        const key = segmentCacheKey(currentStops[i].id, currentStops[i + 1].id);
        const seg = cache.get(key);
        if (seg) {
          allSegments.push(seg);
        }
      }

      dispatch({ type: 'SET_ROUTE_SEGMENTS', payload: allSegments });
    } catch (err) {
      if (!controller.signal.aborted) {
        console.error('Route fetching failed:', err);
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [dispatch]);

  useEffect(() => {
    // Only fetch when route_segments is empty (cleared by reducer on stop changes)
    // and there are at least 2 stops
    if (route_segments.length > 0 || stops.length < 2) {
      return;
    }

    // Debounce: wait 300ms in case stops are changing rapidly
    const timer = setTimeout(() => {
      fetchRoutes(stopsRef.current);
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [stops, route_segments.length, fetchRoutes]);

  // Cleanup: abort in-flight on unmount
  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, []);

  return { isLoading };
}
