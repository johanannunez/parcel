# Contacts Map View — Design Spec

**Date:** 2026-04-18
**Status:** Approved, ready for implementation planning

---

## Overview

Add a Map view to the admin Contacts page alongside the existing Kanban and List views. The map visualizes where owners live and where their properties are located, making the spatial relationship between an owner's home and their rentals immediately readable.

The `PipelineViewSwitcher` component already defines `map` as a supported mode with a `MapTrifold` icon. This spec covers what renders when that mode is active.

---

## Map Foundation

- **Library:** `react-map-gl` + `mapbox-gl` (already installed)
- **Clustering:** `supercluster` library — React markers for both clusters and individual pins, full design control
- **Map style:** Mapbox "Light" with saturation pulled down slightly. Understated backdrop; data is the star
- **Token:** `NEXT_PUBLIC_MAPBOX_TOKEN` from Doppler (parcel project, dev + prd configs)
- **Tile API:** Mapbox free tier, 50k map loads/month — no realistic usage concern for an internal admin tool

---

## Two Pin Types

### Property Pin
- Icon: building/home icon (Phosphor `House` weight `duotone`)
- Color: stage color of the owning contact (same palette as Kanban board stage pills)
- Shape: circle with icon inside, subtle drop shadow
- Always visible on map load when the contact has properties with lat/lng

### Owner Home Pin
- Icon: person icon (Phosphor `UserCircle` weight `duotone`) or avatar/initials
- Color: same stage color as the contact, slightly darker shade to differentiate
- Shape: circle, slightly larger than property pin to establish hierarchy
- Requires geocoded home coordinates (see Data Requirements below)

### Connecting Lines
- Hidden by default
- Appear when owner pin is clicked
- Dashed line from owner home to each of their properties
- Drive time label on each line ("~22 min"), loaded lazily via Mapbox Directions API on click

---

## Clustering

- `supercluster` groups nearby pins by zoom level
- Cluster pin: Parcel blue `#02AAEB` filled circle, white count number, soft drop shadow
- Spring animation when zooming breaks clusters into individual pins
- Clusters group property pins only (owner home pins always show individually)

---

## Interaction Flow

### Click owner home pin
1. Dashed lines appear connecting owner to each property
2. Mapbox Directions API fires for each owner-to-property pair (lazy, only on click)
3. Drive time labels appear on each line ("~22 min")
4. Popover opens above pin: avatar, name, company, stage pill, property count, "View contact" button

### Click "View contact" in popover
- Side panel slides in from right with full contact summary
- Map remains visible behind panel
- Panel uses same width and pattern as existing detail rail

### Click property pin
- Smaller popover: property address, "View owner" link that opens the owner popover

### Click cluster badge
- Map zooms in to break apart cluster (standard supercluster behavior)

---

## "Not Mapped" Contacts

Contacts with no properties, or whose properties have no lat/lng, are invisible on the map.

A floating chip in the bottom-left corner shows: "4 contacts not mapped" with a small `ListBullets` icon.

Clicking the chip opens a modal listing those contacts with:
- Avatar/initials
- Name and company
- Stage pill
- Link to their contact detail page

---

## Visual Design

- Stage color palette (from `ContactDetailShell.module.css`):
  - lead: `#02AAEB`
  - onboarding: `#8B5CF6`
  - active: `#047857`
  - cold: `#0369A1`
  - dormant: `#374151`
- Pin drop shadow: `0 2px 8px rgba(0,0,0,0.15)` — subtle, not flat
- Connecting lines: `stroke-dasharray: 6 4`, `opacity: 0.6`, stage color
- Popover: elevated card surface, 240px wide, 8px border-radius, matches admin card pattern
- "Not mapped" chip: muted surface, small text, `ListBullets` icon left of label
- Zoom controls: bottom-right corner, styled to match admin UI surface color

---

## Data Requirements

### Property pins — ready now
Properties table already has `latitude` and `longitude` columns. The contacts-list query needs to join properties to return coordinates alongside contact rows.

**Required change:** Extend `fetchAdminContactsList` to join `properties(id, address_line1, city, state, latitude, longitude)` on `contact_id`. Add `properties` array to `ContactRow` type.

### Owner home pins — requires schema work
The contacts table has no geocoded home location. The profiles table has:
- `location: string | null` — free-text city/region (e.g., "Austin, TX")
- `mailing_address: Json | null` — structured address JSON

Neither has lat/lng.

**Two options:**

**Option A (Recommended): Add home_lat/home_lng to contacts table**
- Add `home_lat: number | null` and `home_lng: number | null` columns to the contacts table
- Populate via Mapbox Geocoding API when a contact's address is set or updated
- One-time geocode per contact, stored permanently
- Clean, performant, no runtime geocoding on map load

**Option B: Geocode at runtime**
- On map load, call Mapbox Geocoding API for each contact's `location` or `mailing_address`
- Cache in React component state for the session
- No schema change required
- Slower map load, more API calls per session, `location` field is often too vague to geocode accurately

Option A is the right long-term approach. Option B is acceptable for a fast V1 if we want to ship quickly and defer the schema work.

### Mapbox Directions API (drive times)
- Uses the same `NEXT_PUBLIC_MAPBOX_TOKEN`
- Called lazily when owner pin is clicked, not on map load
- Free tier: 100k requests/month — no concern for internal admin tool
- Returns duration in seconds; display as "~X min"

---

## Phased Delivery

**Phase 1 — Ship now**
- Map view with property pins only
- Clustering with Parcel blue badges
- Click property pin: popover with address and owner name
- "Not mapped" chip with modal
- No owner home pin, no connecting lines, no drive times

**Phase 2 — After schema migration**
- Add `home_lat`/`home_lng` to contacts table
- Owner home pin with stage color
- Dashed connecting lines on click
- Drive time labels via Mapbox Directions API
- Full "owner at home, properties nearby" spatial story

---

## Scope Boundaries

- Contacts page only. Properties page map is a separate feature.
- No route planning or navigation links.
- No satellite/street style toggle in V1.
- Drive times are one-way estimates (owner to property), not round trips.
- The `PipelineViewSwitcher` and `ContactsViewSwitcher` changes are additive; existing Kanban and List views are untouched.

---

## Files to Create

- `apps/web/src/app/(admin)/admin/contacts/ContactsMapView.tsx`
- `apps/web/src/app/(admin)/admin/contacts/ContactsMapView.module.css`

## Files to Modify

- `apps/web/src/lib/admin/contact-types.ts` — add `properties` array to `ContactRow`
- `apps/web/src/lib/admin/contacts-list.ts` — join properties with lat/lng
- `apps/web/src/app/(admin)/admin/contacts/ContactsViewSwitcher.tsx` — add `'map'` to supported boards
- `apps/web/src/app/(admin)/admin/contacts/page.tsx` — render `ContactsMapView` when `mode === 'map'`

## Packages

- `react-map-gl` + `mapbox-gl` — already installed
- `supercluster` — needs installation
- `@types/supercluster` — needs installation
