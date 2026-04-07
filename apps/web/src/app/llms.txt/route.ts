import { NextResponse } from "next/server";

const LLMS_TXT = `# The Parcel Company

> Vacation homes and furnished residences, handpicked for people who notice the details.

The Parcel Company is a US-based vacation rental and corporate housing provider. We offer handpicked, verified properties for short-term vacation stays and extended furnished corporate residences across major US markets.

## Services

- **Vacation Rentals**: Curated vacation homes in destinations like Lake Tahoe, Breckenridge, Destin, Scottsdale, and more
- **Corporate Housing**: Furnished residences for business travelers and relocating professionals in Austin, Nashville, Denver, Seattle, and other metro areas
- **Property Management**: End-to-end management for property owners — listing optimization, guest communication, cleaning coordination, and revenue maximization

## Key Features

- Verified properties with quality guarantees
- Flexible cancellation policies
- Responsive on-ground management
- Dark and light mode website experience
- Blog with travel guides, investment tips, and property management insights

## Properties

We manage 12+ properties across the US including:

- Lakeside Villa with Private Dock — Lake Tahoe, CA (from $420/night, 4 bedrooms)
- Downtown Executive Suite — Austin, TX (from $185/night, 1 bedroom)
- Mountain Retreat with Hot Tub — Breckenridge, CO (from $375/night, 3 bedrooms)
- Modern Furnished Loft — Nashville, TN (from $165/night, 2 bedrooms)
- Beachfront Bungalow — Destin, FL (from $310/night, 3 bedrooms)
- Corporate Park Residence — Denver, CO (from $145/night, 2 bedrooms)

## For Property Owners

List your property with The Parcel Company to maximize revenue. Our revenue calculator estimates earnings based on property type, bedrooms, and location using Tri-Cities market data.

## Links

- [Homepage](https://theparcelco.com)
- [Browse Properties](https://theparcelco.com/properties)
- [List With Us](https://theparcelco.com/list-with-us)
- [Blog](https://theparcelco.com/blog)
- [About](https://theparcelco.com/about)
- [Contact](https://theparcelco.com/contact)
- [Help Center](https://theparcelco.com/help)
- [Terms of Service](https://theparcelco.com/terms)
- [Privacy Policy](https://theparcelco.com/privacy)

## Contact

- Email: hello@theparcelco.com
- Website: https://theparcelco.com
`;

export async function GET() {
  return new NextResponse(LLMS_TXT, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
