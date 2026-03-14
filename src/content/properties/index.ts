import type { Property } from "@/types/property";

/**
 * Property content data. In production, this will merge with
 * Hospitable API data for availability and pricing.
 *
 * Photos use Unsplash placeholders until real property images are added.
 * Replace with actual property photos from Hospitable or local uploads.
 */
export const properties: Property[] = [
  {
    slug: "cozy-pasco-retreat",
    title: "The Cozy Pasco Retreat",
    tagline: "A warm escape in the heart of wine country",
    description:
      "Nestled in downtown Pasco, this beautifully appointed home offers the perfect blend of comfort and convenience. Walking distance to local wineries, restaurants, and the Saturday market. The open-concept living space flows seamlessly into a fully equipped kitchen, perfect for cooking with locally sourced ingredients. Step outside to a private patio where you can enjoy your morning coffee with views of the Columbia Basin.",
    location: {
      city: "Pasco",
      state: "WA",
      coordinates: { lat: 46.2396, lng: -119.1006 },
    },
    photos: [
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80",
      "https://images.unsplash.com/photo-1616137466211-f939a420be84?w=1200&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80",
    ],
    guests: 6,
    bedrooms: 3,
    bathrooms: 2,
    amenities: [
      "wifi",
      "kitchen",
      "washer",
      "dryer",
      "parking",
      "air-conditioning",
      "heating",
      "tv",
      "coffee-maker",
      "patio",
    ],
    sleepingArrangements: [
      { room: "Primary Bedroom", beds: "1 King Bed" },
      { room: "Second Bedroom", beds: "1 Queen Bed" },
      { room: "Third Bedroom", beds: "2 Twin Beds" },
    ],
    houseRules: [
      "No smoking",
      "No parties or events",
      "Quiet hours: 10:00 PM to 7:00 AM",
      "Maximum 6 guests",
    ],
    neighborhood:
      "Walking distance to downtown Pasco, local wineries, and the Pasco Farmers Market. Ten minutes from the Tri-Cities Airport.",
    checkIn: "3:00 PM",
    checkOut: "11:00 AM",
    cancellationPolicy: "Flexible: full refund up to 24 hours before check-in",
    petPolicy: "Dogs welcome ($50 pet fee)",
    pricePerNight: 149,
    hospitablePropertyId: "prop_pasco_001",
    widgetEmbedCode: "",
    featured: true,
  },
  {
    slug: "kennewick-modern-loft",
    title: "The Kennewick Modern Loft",
    tagline: "Contemporary living with Columbia River views",
    description:
      "A stunning modern loft in the heart of Kennewick, featuring floor-to-ceiling windows with sweeping views of the Columbia River. The industrial-chic design pairs exposed brick with warm wood accents. A chef's kitchen with premium appliances makes this the perfect base for exploring the Tri-Cities wine region.",
    location: {
      city: "Kennewick",
      state: "WA",
      coordinates: { lat: 46.2112, lng: -119.1372 },
    },
    photos: [
      "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=1200&q=80",
      "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=1200&q=80",
      "https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?w=1200&q=80",
      "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=1200&q=80",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&q=80",
    ],
    guests: 4,
    bedrooms: 2,
    bathrooms: 1,
    amenities: [
      "wifi",
      "kitchen",
      "washer",
      "dryer",
      "parking",
      "air-conditioning",
      "heating",
      "tv",
      "workspace",
      "river-view",
    ],
    sleepingArrangements: [
      { room: "Primary Loft", beds: "1 King Bed" },
      { room: "Second Bedroom", beds: "1 Queen Bed" },
    ],
    houseRules: [
      "No smoking",
      "No parties or events",
      "Quiet hours: 10:00 PM to 7:00 AM",
      "Maximum 4 guests",
    ],
    neighborhood:
      "Steps from Columbia Park and the riverside walking trail. Five minutes to downtown Kennewick dining and shops.",
    checkIn: "4:00 PM",
    checkOut: "11:00 AM",
    cancellationPolicy: "Moderate: full refund up to 5 days before check-in",
    petPolicy: "No pets allowed",
    pricePerNight: 179,
    hospitablePropertyId: "prop_kennewick_001",
    widgetEmbedCode: "",
    featured: true,
  },
  {
    slug: "spokane-craftsman-cottage",
    title: "The Spokane Craftsman Cottage",
    tagline: "Historic charm meets modern comfort in the Lilac City",
    description:
      "A beautifully restored 1920s craftsman cottage in Spokane's historic South Hill neighborhood. Original hardwood floors, built-in bookshelves, and a wrap-around porch create a timeless atmosphere. Updated with modern amenities including a spa-like bathroom with heated floors and a gourmet kitchen.",
    location: {
      city: "Spokane",
      state: "WA",
      coordinates: { lat: 47.6588, lng: -117.426 },
    },
    photos: [
      "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=1200&q=80",
      "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&q=80",
      "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=1200&q=80",
      "https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=1200&q=80",
      "https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=1200&q=80",
    ],
    guests: 8,
    bedrooms: 4,
    bathrooms: 2.5,
    amenities: [
      "wifi",
      "kitchen",
      "washer",
      "dryer",
      "parking",
      "air-conditioning",
      "heating",
      "fireplace",
      "porch",
      "garden",
    ],
    sleepingArrangements: [
      { room: "Primary Suite", beds: "1 King Bed" },
      { room: "Second Bedroom", beds: "1 Queen Bed" },
      { room: "Third Bedroom", beds: "1 Queen Bed" },
      { room: "Sunroom", beds: "1 Daybed + 1 Trundle" },
    ],
    houseRules: [
      "No smoking (indoor or outdoor)",
      "No parties or events",
      "Quiet hours: 10:00 PM to 7:00 AM",
      "Maximum 8 guests",
      "Please remove shoes indoors",
    ],
    neighborhood:
      "Walk to Manito Park, South Hill shops, and restaurants. Ten minutes to downtown Spokane and Riverfront Park.",
    checkIn: "3:00 PM",
    checkOut: "11:00 AM",
    cancellationPolicy: "Flexible: full refund up to 24 hours before check-in",
    petPolicy: "Dogs welcome ($75 pet fee, max 2 dogs)",
    pricePerNight: 219,
    hospitablePropertyId: "prop_spokane_001",
    widgetEmbedCode: "",
    featured: true,
  },
  {
    slug: "richland-riverside-suite",
    title: "The Richland Riverside Suite",
    tagline: "Waterfront tranquility on the Columbia",
    description:
      "Wake up to the gentle sounds of the Columbia River at this premium waterfront suite. Floor-to-ceiling windows frame unobstructed river views from the open living area and primary bedroom. The minimalist Scandinavian-inspired design creates a serene retreat, while the private dock provides direct river access for kayaking and paddleboarding.",
    location: {
      city: "Richland",
      state: "WA",
      coordinates: { lat: 46.2856, lng: -119.2845 },
    },
    photos: [
      "https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?w=1200&q=80",
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1200&q=80",
      "https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?w=1200&q=80",
      "https://images.unsplash.com/photo-1600210491369-e753d80a41f3?w=1200&q=80",
      "https://images.unsplash.com/photo-1600573472591-ee6981cf81d6?w=1200&q=80",
    ],
    guests: 4,
    bedrooms: 2,
    bathrooms: 2,
    amenities: [
      "wifi",
      "kitchen",
      "washer",
      "dryer",
      "parking",
      "air-conditioning",
      "heating",
      "tv",
      "river-view",
      "dock-access",
      "kayaks",
    ],
    sleepingArrangements: [
      { room: "Primary Suite", beds: "1 King Bed" },
      { room: "Guest Room", beds: "1 Queen Bed" },
    ],
    houseRules: [
      "No smoking",
      "No parties or events",
      "Quiet hours: 10:00 PM to 7:00 AM",
      "Maximum 4 guests",
      "Life jackets required for dock use",
    ],
    neighborhood:
      "Directly on the Columbia River with private dock access. Walking distance to Howard Amon Park and the Richland Riverfront Trail.",
    checkIn: "4:00 PM",
    checkOut: "10:00 AM",
    cancellationPolicy: "Strict: 50% refund up to 7 days before check-in",
    petPolicy: "No pets allowed",
    pricePerNight: 259,
    hospitablePropertyId: "prop_richland_001",
    widgetEmbedCode: "",
    featured: true,
  },
  {
    slug: "vancouver-urban-oasis",
    title: "The Vancouver Urban Oasis",
    tagline: "City convenience with a Pacific Northwest soul",
    description:
      "A chic urban retreat in Vancouver, Washington, just across the river from Portland. This thoughtfully designed space features a living wall of native plants, a rain shower, and a rooftop terrace with views of Mount Hood. The perfect launchpad for exploring both cities.",
    location: {
      city: "Vancouver",
      state: "WA",
      coordinates: { lat: 45.6387, lng: -122.6615 },
    },
    photos: [
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80",
      "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=1200&q=80",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&q=80",
    ],
    guests: 5,
    bedrooms: 2,
    bathrooms: 1.5,
    amenities: [
      "wifi",
      "kitchen",
      "washer",
      "dryer",
      "parking",
      "air-conditioning",
      "heating",
      "tv",
      "rooftop-terrace",
      "workspace",
    ],
    sleepingArrangements: [
      { room: "Primary Bedroom", beds: "1 King Bed" },
      { room: "Flex Room", beds: "1 Queen Sofa Bed + 1 Twin" },
    ],
    houseRules: [
      "No smoking",
      "No parties or events",
      "Quiet hours: 10:00 PM to 8:00 AM",
      "Maximum 5 guests",
    ],
    neighborhood:
      "Downtown Vancouver, WA. Walk to restaurants, breweries, and the waterfront. Ten minutes to Portland via the Interstate Bridge.",
    checkIn: "3:00 PM",
    checkOut: "11:00 AM",
    cancellationPolicy: "Flexible: full refund up to 24 hours before check-in",
    petPolicy: "Small dogs welcome ($40 pet fee, max 1 dog under 30 lbs)",
    pricePerNight: 189,
    hospitablePropertyId: "prop_vancouver_001",
    widgetEmbedCode: "",
    featured: false,
  },
];

export function getProperty(slug: string): Property | undefined {
  return properties.find((p) => p.slug === slug);
}

export function getFeaturedProperties(): Property[] {
  return properties.filter((p) => p.featured);
}

export function getAllProperties(): Property[] {
  return properties;
}
