'use client';

import { useState, useEffect } from 'react';
import type { Stop } from '@/lib/types';

export interface FoodPlace {
  name: string;
  address: string;
  rating: number;
  priceLevel?: number;
  location: {
    lat: number;
    lng: number;
  };
  placeId: string;
}

export function useFoodPlaces(stops: Stop[], enabled: boolean, query: string) {
  const [foodPlaces, setFoodPlaces] = useState<FoodPlace[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || stops.length === 0) {
      setFoodPlaces([]);
      return;
    }

    async function fetchPlaces() {
      setLoading(true);
      const allPlaces: FoodPlace[] = [];

      try {
        for (const stop of stops) {
          const res = await fetch(
            `/api/places?lat=${stop.coordinates.lat}&lng=${stop.coordinates.lng}&query=${encodeURIComponent(query)}`
          );

          if (!res.ok) continue;

          const data = await res.json();
          if (data.places) {
            allPlaces.push(...data.places);
          }
        }

        setFoodPlaces(allPlaces);
      } catch (error) {
        console.error('Error fetching food places:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPlaces();
  }, [stops, enabled, query]);

  return { foodPlaces, loading };
}
