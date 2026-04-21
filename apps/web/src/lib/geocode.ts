import 'server-only';

export type GeoPoint = { lat: number; lng: number };

export async function geocodeAddress(
  street: string,
  city: string,
  state: string,
  zip: string,
): Promise<GeoPoint | null> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) return null;

  const query = encodeURIComponent(`${street}, ${city}, ${state} ${zip}`);
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${token}&limit=1&country=US`;

  try {
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) return null;
    const json = await res.json() as {
      features?: Array<{ center?: [number, number] }>;
    };
    const center = json.features?.[0]?.center;
    if (!center) return null;
    const [lng, lat] = center;
    return { lat, lng };
  } catch {
    return null;
  }
}
