// Maps Hospitable property UUID → numeric widget ID
// Numeric IDs come from: Direct Bookings > Custom Sites > Properties > Copy widget code
// Look for the last number in: src="https://booking.hospitable.com/widget/SITE_ID/NUMBER"

export const HOSPITABLE_SITE_ID = "a176f883-0e69-43ee-a87f-6286eafa3335";

export const WIDGET_IDS: Record<string, string> = {
  // Tranquil Pasco Retreat: Modern Home (Sleeps 4) — 524 S Sycamore Ave, Unit B, Pasco
  "e1f79f66-4c70-421d-b88d-dd4eb25017c2": "1225094",

  // The Central Home: 2BR Hideaway — 19 S Edison St, Unit B, Kennewick
  "2d5da9e5-53fd-4ea7-a982-81f7b301be37": "1245162",

  // Modern 3b/2b Retreat near Portland — 5629 NE 129th Place, Vancouver
  "4633cb07-7d21-46c2-acd8-97c067840712": "",

  // Large Pasco Retreat for Groups (Sleeps 7) — 524 S Sycamore Ave, Unit A, Pasco
  "28b40b14-de05-4343-9b02-24b8661dc76a": "1576314",

  // Central Home in Tri-Cities — 3513 W 1st Pl, Kennewick
  "aef48432-89d9-4ad9-812b-4014cc17f132": "1626814",

  // Cozy 2BR by Hanford & Hospitals — 19 S Edison St, Unit C, Kennewick
  "cca44cd2-b3c1-4dad-a26b-df75f4f153c8": "1812436",

  // Chic Retreat 10 Min to Spokane — 811 E Everett Ave, Spokane
  "a5951f62-f9f0-4a66-9a32-3d33ed719e23": "1851044",

  // Stylish 1-Bedroom ADU — 5814 Pierre Dr, Unit B, Pasco
  "97a12246-bfe2-405d-829a-599960864729": "1995578",

  // Richland Home with Fenced Yard, Near Hanford — 1431 Jadwin Ave, Richland
  "1091ee9d-dc2b-4c56-8a9e-6682690644ec": "2041700",

  // Unfurnished 3BR Townhome - Utilities Included! — 34 Downing Dr, Adairsville, GA
  "b7cdff7e-5611-4293-bc3f-ef4734d3cc5f": "2155198",

  // Modern 2 bed | Near Hospitals | Family-Friendly — 403 E 8th Ave, Unit A, Spokane
  "599992ff-28c8-4cee-842c-76b4e352049e": "2223456",

  // Spokane Medical District | 2 Queens + Fenced Yard — 403 E 8th Ave, Unit B, Spokane
  "12fb02bd-a0e6-4155-a699-c323d6544c14": "2223766",

  // Richland Retreat near Hospitals & Parks — 1433 Jadwin Ave, Richland
  "5ac186a6-8c22-4a67-9bbf-7870c8cd6801": "2239304",
};

export function getWidgetId(propertyUuid: string): string | null {
  return WIDGET_IDS[propertyUuid] || null;
}
