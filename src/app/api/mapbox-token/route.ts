// Server-side proxy for Mapbox token
// This allows us to keep the token secret and avoid NEXT_PUBLIC_ build-time issues

export async function GET() {
  const token = process.env.MAPBOX_TOKEN;
  
  if (!token) {
    return Response.json({ error: 'Mapbox token not configured' }, { status: 500 });
  }
  
  return Response.json({ token });
}
