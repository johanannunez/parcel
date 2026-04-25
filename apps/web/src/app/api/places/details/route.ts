import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const placeId = req.nextUrl.searchParams.get('place_id');
  if (!placeId) {
    return NextResponse.json({ error: 'place_id required' }, { status: 400 });
  }

  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) {
    return NextResponse.json({ error: 'Maps API not configured' }, { status: 500 });
  }

  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
  url.searchParams.set('place_id', placeId);
  url.searchParams.set('fields', 'formatted_address,address_components');
  url.searchParams.set('key', key);

  const res = await fetch(url.toString());
  if (!res.ok) {
    return NextResponse.json({ error: 'Places API error' }, { status: 502 });
  }

  const data = await res.json();
  return NextResponse.json({ result: data.result ?? null });
}
