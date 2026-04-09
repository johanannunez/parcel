export type SetupStepEntry = {
  stepKey: string;
  label: string;
  keywords: string[];
  href: string;
  track: "property" | "owner";
  group: string;
  estimateMinutes: number;
};

export const setupSearchIndex: SetupStepEntry[] = [
  // ── Property Setup ──────────────────────────────────────
  // Group: Getting started
  {
    stepKey: "agreement-preview",
    label: "Agreement preview",
    keywords: [
      "agreement", "contract", "host agreement", "terms", "commission",
      "management", "preview", "summary", "legal",
    ],
    href: "/portal/setup/agreement-preview",
    track: "property",
    group: "Getting started",
    estimateMinutes: 3,
  },
  {
    stepKey: "basics",
    label: "The basics",
    keywords: [
      "basics", "nickname", "property type", "launch date", "rental type",
      "short term", "long term", "arbitrage", "co-hosting", "name",
    ],
    href: "/portal/setup/basics",
    track: "property",
    group: "Getting started",
    estimateMinutes: 3,
  },
  {
    stepKey: "address",
    label: "Address",
    keywords: [
      "address", "street", "city", "state", "zip", "postal code", "location",
      "map", "unit", "apartment", "geolocation",
    ],
    href: "/portal/setup/address",
    track: "property",
    group: "Getting started",
    estimateMinutes: 2,
  },

  // Group: Your home
  {
    stepKey: "space",
    label: "Space and capacity",
    keywords: [
      "space", "capacity", "sqft", "square feet", "bedrooms", "beds",
      "bathrooms", "guests", "max guests", "bed arrangement", "king",
      "queen", "twin", "bunk", "sofa bed", "sleeps",
    ],
    href: "/portal/setup/space",
    track: "property",
    group: "Your home",
    estimateMinutes: 4,
  },
  {
    stepKey: "amenities",
    label: "Amenities",
    keywords: [
      "amenities", "essentials", "kitchen", "laundry", "entertainment",
      "outdoor", "pool", "hot tub", "wifi", "parking", "safety",
      "accessibility", "family", "sports", "recreation", "gym",
      "washer", "dryer", "coffee", "tv", "grill",
    ],
    href: "/portal/setup/amenities",
    track: "property",
    group: "Your home",
    estimateMinutes: 5,
  },
  {
    stepKey: "rules",
    label: "House rules and access",
    keywords: [
      "rules", "house rules", "pets", "pet policy", "smoking", "events",
      "quiet hours", "check-in", "check-out", "lockbox", "gate code",
      "backup key", "access", "keys", "instructions", "parking",
    ],
    href: "/portal/setup/rules",
    track: "property",
    group: "Your home",
    estimateMinutes: 4,
  },
  {
    stepKey: "wifi",
    label: "Wi-Fi and tech",
    keywords: [
      "wifi", "wi-fi", "ssid", "password", "router", "modem", "internet",
      "provider", "isp", "network name", "network", "tech", "account",
      "billing",
    ],
    href: "/portal/setup/wifi",
    track: "property",
    group: "Your home",
    estimateMinutes: 3,
  },

  // Group: Finishing touches
  {
    stepKey: "financial",
    label: "Financial baseline",
    keywords: [
      "financial", "income", "revenue", "budget", "furnishing", "goal",
      "red line", "minimum", "target", "go live", "ready", "money",
    ],
    href: "/portal/setup/financial",
    track: "property",
    group: "Finishing touches",
    estimateMinutes: 3,
  },
  {
    stepKey: "recommendations",
    label: "Local recommendations",
    keywords: [
      "recommendations", "guidebook", "local", "restaurants", "places",
      "spots", "tips", "neighborhood", "area", "attractions",
    ],
    href: "/portal/setup/recommendations",
    track: "property",
    group: "Finishing touches",
    estimateMinutes: 5,
  },
  {
    stepKey: "cleaning",
    label: "Your cleaning team",
    keywords: [
      "cleaning", "cleaner", "housekeeping", "turnover", "byoc",
      "bring your own", "team", "schedule", "emergency",
    ],
    href: "/portal/setup/cleaning",
    track: "property",
    group: "Finishing touches",
    estimateMinutes: 3,
  },
  {
    stepKey: "photos",
    label: "Photos",
    keywords: [
      "photos", "images", "gallery", "hero", "upload", "pictures",
      "photography", "listing photos",
    ],
    href: "/portal/setup/photos",
    track: "property",
    group: "Finishing touches",
    estimateMinutes: 5,
  },
  {
    stepKey: "compliance",
    label: "Compliance",
    keywords: [
      "compliance", "permit", "str permit", "hoa", "insurance",
      "certificate", "license", "regulation", "zoning",
    ],
    href: "/portal/setup/compliance",
    track: "property",
    group: "Finishing touches",
    estimateMinutes: 3,
  },

  // Group: Go live
  {
    stepKey: "host-agreement",
    label: "Host agreement signing",
    keywords: [
      "host agreement", "sign", "e-sign", "boldsign", "signature",
      "contract", "legal", "document",
    ],
    href: "/portal/setup/host-agreement",
    track: "property",
    group: "Go live",
    estimateMinutes: 5,
  },
  {
    stepKey: "review",
    label: "Review and submit",
    keywords: [
      "review", "submit", "final", "launch", "go live", "summary",
      "checklist", "confirmation",
    ],
    href: "/portal/setup/review",
    track: "property",
    group: "Go live",
    estimateMinutes: 3,
  },

  // ── Owner Essentials ────────────────────────────────────
  // Group: About you
  {
    stepKey: "account",
    label: "Your account",
    keywords: [
      "account", "name", "phone", "mailing address", "contact",
      "personal", "profile",
    ],
    href: "/portal/setup/account",
    track: "owner",
    group: "About you",
    estimateMinutes: 2,
  },
  {
    stepKey: "identity",
    label: "Identity verification",
    keywords: [
      "identity", "verification", "id", "drivers license", "driver license",
      "kyc", "photo id", "government id",
    ],
    href: "/portal/setup/identity",
    track: "owner",
    group: "About you",
    estimateMinutes: 3,
  },

  // Group: Payments and tax
  {
    stepKey: "w9",
    label: "Tax form (W-9)",
    keywords: [
      "w9", "w-9", "tax", "tax form", "irs", "tin", "ssn", "ein",
      "taxpayer",
    ],
    href: "/portal/setup/w9",
    track: "owner",
    group: "Payments and tax",
    estimateMinutes: 5,
  },
  {
    stepKey: "payout",
    label: "Payout method",
    keywords: [
      "payout", "payment", "ach", "bank", "direct deposit", "card",
      "authorization", "bank account", "routing number",
    ],
    href: "/portal/setup/payout",
    track: "owner",
    group: "Payments and tax",
    estimateMinutes: 5,
  },
];

/**
 * Get the next incomplete step for a given track.
 * completedKeys: set of step keys already completed.
 */
export function getNextIncompleteStep(
  track: "property" | "owner",
  completedKeys: Set<string>,
): SetupStepEntry | null {
  const trackSteps = setupSearchIndex.filter((s) => s.track === track);
  return trackSteps.find((s) => !completedKeys.has(s.stepKey)) ?? null;
}

/**
 * Group steps by their group header for rendering.
 */
export function groupStepsByGroup(
  track: "property" | "owner",
): { group: string; steps: SetupStepEntry[] }[] {
  const trackSteps = setupSearchIndex.filter((s) => s.track === track);
  const groups: { group: string; steps: SetupStepEntry[] }[] = [];
  let current: { group: string; steps: SetupStepEntry[] } | null = null;

  for (const step of trackSteps) {
    if (!current || current.group !== step.group) {
      current = { group: step.group, steps: [] };
      groups.push(current);
    }
    current.steps.push(step);
  }

  return groups;
}
