import { Coordinates, RouteSegment, Stop } from '@/lib/types';

interface DirectionsResponse {
  routes: Array<{
    geometry: GeoJSON.LineString;
    distance: number; // meters
    duration: number; // seconds
    legs?: Array<{
      steps?: Array<{
        mode?: string;
      }>;
    }>;
  }>;
  code: string;
}

function haversineDistanceKm(from: Coordinates, to: Coordinates): number {
  const R = 6371;
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((from.lat * Math.PI) / 180) *
      Math.cos((to.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Fetches a driving route between two coordinates using the Mapbox Directions API.
 * Returns a RouteSegment with empty stop IDs (caller should set them).
 *
 * Detects ferry/water crossings by:
 * 1. Checking if any step has mode "ferry" in the response
 * 2. Detecting when Mapbox routes far around water (driving >> straight-line)
 */
export async function fetchRouteSegment(
  from: Coordinates,
  to: Coordinates,
  token: string
): Promise<RouteSegment> {
  const url =
    `https://api.mapbox.com/directions/v5/mapbox/driving/` +
    `${from.lng},${from.lat};${to.lng},${to.lat}` +
    `?geometries=geojson&overview=full&steps=true&access_token=${token}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Mapbox Directions API error: ${res.status} ${res.statusText}`);
  }

  const data: DirectionsResponse = await res.json();

  if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
    throw new Error(`Mapbox Directions API returned no routes (code: ${data.code})`);
  }

  const route = data.routes[0];

  // Detect ferry mode in any step
  const hasFerryStep =
    route.legs?.some((leg) => leg.steps?.some((step) => step.mode === 'ferry')) ?? false;

  // Detect water detour: driving distance is unreasonably long vs straight-line
  const straightKm = haversineDistanceKm(from, to);
  const drivingKm = route.distance / 1000;
  const isWaterDetour = straightKm > 50 && drivingKm > straightKm * 3;

  // If Mapbox routed around water on land, replace with straight dashed line
  if (isWaterDetour && !hasFerryStep) {
    return {
      from_stop_id: '',
      to_stop_id: '',
      geometry: {
        type: 'LineString',
        coordinates: [
          [from.lng, from.lat],
          [to.lng, to.lat],
        ],
      },
      is_ferry: true,
    };
  }

  return {
    from_stop_id: '',
    to_stop_id: '',
    geometry: route.geometry,
    distance_km: drivingKm,
    duration_hours: route.duration / 3600,
    is_ferry: hasFerryStep || undefined,
  };
}

/**
 * Delays execution for the specified number of milliseconds.
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetches driving routes between all consecutive stops.
 * Makes sequential requests with a 100ms delay between each to avoid rate limiting.
 * Errors on individual segments are caught so one failure does not break all.
 */
export async function fetchAllRouteSegments(
  stops: Stop[],
  token: string
): Promise<RouteSegment[]> {
  if (stops.length < 2) return [];

  const segments: RouteSegment[] = [];

  for (let i = 0; i < stops.length - 1; i++) {
    // Rate limit: 100ms delay between requests (skip for the first one)
    if (i > 0) {
      await delay(100);
    }

    try {
      const segment = await fetchRouteSegment(
        stops[i].coordinates,
        stops[i + 1].coordinates,
        token
      );
      segment.from_stop_id = stops[i].id;
      segment.to_stop_id = stops[i + 1].id;
      segments.push(segment);
    } catch (err) {
      console.error(
        `Failed to fetch route from "${stops[i].name}" to "${stops[i + 1].name}":`,
        err
      );
      // Push a segment without geometry so the itinerary still shows the connection
      segments.push({
        from_stop_id: stops[i].id,
        to_stop_id: stops[i + 1].id,
      });
    }
  }

  return segments;
}
