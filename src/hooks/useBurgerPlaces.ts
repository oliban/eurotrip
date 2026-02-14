'use client';

import { useState, useEffect } from 'react';
import type { Stop } from '@/lib/types';

export interface BurgerPlace {
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

export function useBurgerPlaces(stops: Stop[], enabled: boolean = false) {
  const [burgerPlaces, setBurgerPlaces] = useState<BurgerPlace[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || stops.length === 0) {
      setBurgerPlaces([]);
      return;
    }

    async function fetchPlaces() {
      setLoading(true);
      const allPlaces: BurgerPlace[] = [];

      try {
        for (const stop of stops) {
          const res = await fetch(
            `/api/places?lat=${stop.coordinates.lat}&lng=${stop.coordinates.lng}&query=burger`
          );
          
          if (!res.ok) continue;
          
          const data = await res.json();
          if (data.places) {
            allPlaces.push(...data.places);
          }
        }

        setBurgerPlaces(allPlaces);
      } catch (error) {
        console.error('Error fetching burger places:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPlaces();
  }, [stops, enabled]);

  return { burgerPlaces, loading };
}
