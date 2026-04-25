import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const input = req.nextUrl.searchParams.get('input');
  if (!input || input.trim().length < 2) {
    return NextResponse.json({ predictions: [] });
  }

  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) {
    return NextResponse.json({ error: 'Maps API not configured' }, { status: 500 });
  }

  const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
  url.searchParams.set('input', input);
  url.searchParams.set('types', 'address');
  url.searchParams.set('key', key);

  const res = await fetch(url.toString());
  if (!res.ok) {
    return NextResponse.json({ error: 'Places API error' }, { status: 502 });
  }

  const data = await res.json();
  return NextResponse.json({ predictions: data.predictions ?? [] });
}
