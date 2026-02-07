'use client';

import { useState, useEffect } from 'react';

interface UserLocation {
  cityName: string | null;
  loading: boolean;
}

export function useUserLocation(): UserLocation {
  const [cityName, setCityName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        if (!token) {
          setLoading(false);
          return;
        }

        try {
          const res = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?types=place&limit=1&access_token=${token}`
          );
          if (res.ok) {
            const data = await res.json();
            const feature = data.features?.[0];
            if (feature) {
              // feature.text is the city, feature.place_name includes country
              const country = feature.context?.find(
                (c: { id: string }) => c.id.startsWith('country')
              );
              const name = country
                ? `${feature.text}, ${country.text}`
                : feature.place_name;
              setCityName(name);
            }
          }
        } catch {
          // Silently fail — location is optional
        }
        setLoading(false);
      },
      () => {
        // Permission denied or error — that's fine
        setLoading(false);
      },
      { timeout: 5000 }
    );
  }, []);

  return { cityName, loading };
}
