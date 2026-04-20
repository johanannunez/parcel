# Global Admin Map — Design Spec

**Date:** 2026-04-19
**Status:** Approved, ready for implementation planning

---

## Overview

A dedicated global command-center map at `/admin/map` that shows all spatial relationships across the Parcel portfolio in one view. Owners, properties, projects, and tasks are rendered as independent, toggleable layers on a single Mapbox map.

The existing per-section contacts map (Phase 1, already live) remains unchanged. This global map is the premium destination — a "war room" for understanding your whole portfolio at a glance.

---

## Page Structure

- **Route:** `/admin/map`
- **Sidebar nav item:** "Map" with a `MapTrifold` icon from Phosphor, added between Contacts and Properties in the admin sidebar
- **Layout:** Full-bleed map — no page chrome, no header, no padding. The map fills the entire content area.
- **Server component** (`page.tsx`) fetches all four data types in parallel, passes as props to the client `AdminMapView` component

---

## Layer Toggle Chips

A floating pill bar at the top-center of the map. Four chips — one per layer. Always visible; no extra click to access.

**Default state:** Owners ON, Properties ON, Projects OFF, Tasks OFF.

Each chip:
- **Active:** Filled with the layer's brand color, white label, bold
- **Inactive:** White background, light border, muted text

| Layer | Color | Default |
|-------|-------|---------|
| Owners | `#10B981` (green) | ON |
| Properties | `#02AAEB` (Parcel blue) | ON |
| Projects | `#8B5CF6` (purple) | OFF |
| Tasks | `#F59E0B` (amber) | OFF |

Clicking a chip toggles the layer. Toggle state is local React state — not persisted in the URL.

---

## Pin Types

### Owner Pin
- **Shape:** Circle, 36px diameter
- **Content:** Avatar image if available; initials fallback (same `initials()` helper from `lifecycle-stage.ts`)
- **Color:** Lifecycle stage color from `STAGE_COLOR` in `lifecycle-stage.ts`
- **Border:** 2.5px white, drop shadow
- **Data source:** Contacts table — owners with `home_lat` and `home_lng` populated

### Property Pin
- **Shape:** Circle, 30px diameter (smaller than owner, establishes hierarchy)
- **Content:** House icon (Phosphor `House`, weight `duotone`)
- **Color:** Lifecycle stage color of the primary owner (`properties.owner_id`). When a property has multiple owners (via `property_owners` junction table), the primary owner's stage color takes precedence.
- **Border:** 2px white, drop shadow
- **Data source:** Properties table — rows with `latitude` and `longitude` populated

### Project Pin
- **Shape:** Rounded square (8px radius), 30px
- **Content:** Project emoji if set; otherwise `◈` symbol
- **Color:** `#8B5CF6` purple (all project pins, regardless of status)
- **Border:** 2px white, drop shadow
- **Position:** Renders at its `linked_property_id`'s coordinates. Projects with no linked property are excluded (shown in "not mapped" count).

### Task Pin
- **Shape:** Circle, 22px diameter (smallest — tasks are detail-level)
- **Content:** Checkmark icon
- **Color:** Status-based: `todo` = `#F59E0B`, `in_progress` = `#02AAEB`, `blocked` = `#EF4444`, `done` = `#10B981`
- **Border:** 1.5px white
- **Position:** Renders at its parent's property coordinates. Tasks with no resolvable property location are excluded.

---

## Clustering

Supercluster handles clustering for each layer independently. Clusters group pins of the same type only (owner clusters never merge with property clusters).

**Cluster pin appearance:**
- Circle sized by count: `36 + Math.min(count, 50) * 0.9` px
- Background: layer color (green for owners, blue for properties, etc.)
- White count number, bold
- Click → `easeTo` the cluster expansion zoom

---

## Click Interactions

### Click owner pin
1. Selection ring appears around the pin (3px colored glow)
2. Dashed lines draw from the owner to each of their properties (if Properties layer is ON)
3. Drive time labels appear on each line (`~22 min`) — loaded lazily via Mapbox Directions API per owner-property pair, fired on click
4. Popover opens above the pin:
   - Avatar / initials
   - Full name + company
   - Lifecycle stage pill
   - Property count (e.g., "2 properties")
   - "View contact" button → `/admin/contacts/{id}`

### Click property pin
1. Selection ring appears on the clicked property pin
2. The owning owner pin gets a subtle highlight (if Owners layer is ON)
3. Other properties owned by the same owner dim slightly (opacity 0.5) and dashed lines connect them all
4. Popover opens:
   - Address line 1 + city, state
   - Owner name (linked)
   - Occupancy status if available
   - "View property" button → `/admin/properties/{id}`

### Click project pin
- Popover: project name, emoji, status pill, "View project" button
- Highlights the linked property pin

### Click task pin
- Popover: task title, status pill, due date, assignee, "View task" button
- Highlights the parent property pin

### Click empty map area
- Deselects everything, hides dashed lines

---

## "Not Mapped" Chip

A floating chip in the bottom-left corner of the map shows a count of entities that have no resolvable coordinates:

```
☰  5 not mapped
```

Clicking opens a modal listing them (same pattern as the existing contacts `NotMappedModal`). The count combines all active layers — if Owners is ON and 3 owners have no home coordinates, they contribute to the count.

---

## Data Architecture

### Schema changes required

**`contacts` table — new columns:**
```sql
ALTER TABLE contacts
  ADD COLUMN home_lat  FLOAT,
  ADD COLUMN home_lng  FLOAT;
```

Owner home coordinates are separate from property coordinates. The geocoding step populates these when an owner's address is saved or updated.

**Properties table:** `latitude` and `longitude` columns already exist.

### Geocoding

When an owner's mailing address is saved via the admin contact detail form (the address fields on the contact's profile), a server action calls the Mapbox Geocoding API. The address is assembled as `{addressLine1}, {city}, {state} {postalCode}` before encoding:

```
GET https://api.mapbox.com/geocoding/v5/mapbox.places/{address}.json
  ?access_token={MAPBOX_TOKEN}
  &limit=1
```

The returned `[longitude, latitude]` is written to `contacts.home_lat` and `contacts.home_lng`. This runs server-side only (token never exposed to client). Address changes are logged to the timeline system as before.

### Data fetched at page load (`/admin/map`)

The server component runs four parallel queries:

1. **Owners** — contacts with `home_lat IS NOT NULL AND home_lng IS NOT NULL`, joining `profiles` for avatar URL
2. **Properties** — all properties with `latitude IS NOT NULL AND longitude IS NOT NULL`, joining `contacts` for lifecycle stage + owner name
3. **Projects** — all non-archived projects with `linked_property_id`, joining the property for coordinates
4. **Tasks** — all non-done tasks with a parent property, joining the property for coordinates

All four datasets are passed as props to `AdminMapView`. The client component holds layer toggle state and renders only the active layers.

---

## Component Structure

```
app/(admin)/admin/map/
  page.tsx                  ← Server component, parallel data fetch
  AdminMapView.tsx          ← Client component, map + layers + interactions
  AdminMapView.module.css
  LayerToggleBar.tsx        ← Floating chip row, local toggle state
  LayerToggleBar.module.css
  OwnerPin.tsx              ← Owner marker (avatar/initials circle)
  PropertyPin.tsx           ← Property marker (house icon circle)
  ProjectPin.tsx            ← Project marker (rounded square)
  TaskPin.tsx               ← Task marker (small status circle)
  MapPopover.tsx            ← Shared popover shell (close, CTA button)
  NotMappedChip.tsx         ← Bottom-left chip + modal (reuse pattern from contacts)
```

Shared utilities reused from existing code:
- `STAGE_COLOR`, `stageGroup`, `initials` from `@/lib/admin/lifecycle-stage`
- Mapbox token from `process.env.NEXT_PUBLIC_MAPBOX_TOKEN`
- `react-map-gl`, `mapbox-gl`, `supercluster` — already installed

---

## Sidebar Navigation

Add "Map" to the admin sidebar between Contacts and Properties:

- Icon: `MapTrifold` (Phosphor, weight `duotone`)
- Label: "Map"
- Active state matches existing sidebar item styling

---

## Phased Delivery

### Phase 1 — Owners + Properties (build first)
- Schema migration: `home_lat`, `home_lng` on contacts
- Geocoding on address save
- `/admin/map` page with Owners + Properties layers
- Click interactions: owner popover + dashed lines to properties + drive times
- Click interactions: property popover + owner highlight + sibling highlight
- Layer toggle chips (all four chips present; Projects + Tasks show "coming soon" tooltip when toggled)
- Sidebar nav item

### Phase 2 — Projects layer
- Wire projects to their linked property coordinates
- Project pin rendering + popover
- Toggle chip activates Projects layer

### Phase 3 — Tasks layer
- Wire tasks to their parent property coordinates
- Task pin rendering + popover
- Toggle chip activates Tasks layer

---

## Design Notes

- Map style: Mapbox `light-v11` (same as existing contacts map — consistent, understated)
- Dashed connecting lines: rendered as SVG overlays or Mapbox `LineLayer` — SVG preferred for design control
- Drive times: Mapbox Directions API, lazy-loaded on pin click, cached per session in a `Map<string, string>` ref
- No page title / breadcrumbs — the map speaks for itself
- Missing token fallback: same `House` icon placeholder as the contacts map
