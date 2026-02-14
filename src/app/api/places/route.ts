import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const query = searchParams.get('query') || 'burger restaurant';
  
  if (!lat || !lng) {
    return Response.json({ error: 'lat and lng are required' }, { status: 400 });
  }

  const GOOGLE_PLACES_KEY = process.env.GOOGLE_PLACES_API_KEY;
  
  if (!GOOGLE_PLACES_KEY) {
    // Gracefully fail if no API key configured
    return Response.json({ places: [] }, { status: 200 });
  }

  try {
    // Google Places Nearby Search
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&type=restaurant&keyword=${encodeURIComponent(query)}&key=${GOOGLE_PLACES_KEY}`
    );

    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google Places API error:', data.status, data.error_message);
      return Response.json({ places: [] }, { status: 200 });
    }

    // Filter: rating >= 4.5
    const filtered = (data.results || []).filter((place: any) => place.rating >= 4.5);

    return Response.json({
      places: filtered.map((p: any) => ({
        name: p.name,
        address: p.vicinity,
        rating: p.rating,
        priceLevel: p.price_level,
        location: p.geometry.location,
        placeId: p.place_id,
      })),
    });
  } catch (error) {
    console.error('Places API error:', error);
    return Response.json({ places: [] }, { status: 200 });
  }
}
