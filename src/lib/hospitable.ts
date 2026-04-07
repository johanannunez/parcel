const BASE_URL = "https://public.api.hospitable.com/v2";

function getToken(): string {
  const token = process.env.HOSPITABLE_API;
  if (!token) throw new Error("HOSPITABLE_API is not set");
  return token;
}

async function request<T>(
  path: string,
  options?: { params?: Record<string, string> }
): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  if (options?.params) {
    for (const [key, value] of Object.entries(options.params)) {
      url.searchParams.set(key, value);
    }
  }

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${getToken()}`,
      Accept: "application/json",
    },
    next: { revalidate: 3600 }, // cache 1 hour
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Hospitable API error ${res.status} on ${path}: ${body}`);
  }

  return res.json() as Promise<T>;
}

export interface HospitableProperty {
  id: string;
  name: string;
  public_name?: string;
  picture?: string;
  address?: {
    display?: string;
    city?: string;
    state?: string;
    country?: string;
  };
  listed?: boolean;
  capacity?: {
    max?: number;
    bedrooms?: number;
    beds?: number;
    bathrooms?: number;
  };
}

interface PaginatedResponse<T> {
  data: T[];
  links?: { next?: string | null };
}

export async function getProperties(): Promise<HospitableProperty[]> {
  const all: HospitableProperty[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const res = await request<PaginatedResponse<HospitableProperty>>(
      "/properties",
      { params: { page: String(page), per_page: "50" } }
    );
    all.push(...res.data);
    hasMore = res.links?.next != null;
    page++;
  }

  return all.filter((p) => p.listed !== false);
}

export async function getProperty(
  id: string
): Promise<HospitableProperty | null> {
  try {
    const res = await request<{ data: HospitableProperty }>(
      `/properties/${id}`
    );
    return res.data;
  } catch {
    return null;
  }
}
