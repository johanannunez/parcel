export interface Property {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  location: {
    city: string;
    state: string;
    coordinates: { lat: number; lng: number };
  };
  photos: string[];
  guests: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  sleepingArrangements: { room: string; beds: string }[];
  houseRules: string[];
  neighborhood: string;
  checkIn: string;
  checkOut: string;
  cancellationPolicy: string;
  petPolicy: string;
  pricePerNight: number;
  hospitablePropertyId: string;
  widgetEmbedCode: string;
  featured: boolean;
}

export interface PropertyCard {
  slug: string;
  title: string;
  tagline: string;
  location: { city: string; state: string };
  photos: string[];
  guests: number;
  bedrooms: number;
  bathrooms: number;
  pricePerNight: number;
  featured: boolean;
}
