# Properties Page Redesign

**Date:** 2026-04-11
**Scope:** Owner portal — `/portal/properties` listing page

---

## Summary

Redesign the portal properties listing page to use address as the sole property identifier, show a photo-first card layout, and add gallery/table view switching with customizable columns. Property names are removed from the entire portal UI (not just this page).

---

## Decisions

### 1. No property names anywhere

The `name` field on `properties` is hidden from all portal UI. Address is the identifier everywhere: page titles, breadcrumbs, cards, table rows, the app bar header on the property detail page. The DB column is left intact (it may still be used on the admin side) but never rendered in the portal.

### 2. Home type replaces business model label

The secondary line on cards and table rows shows `home_type` (e.g., Apartment, Single-family home, Condo, Townhouse) instead of `property_type` (Co-hosting, Arbitrage). `property_type` is the internal business model and is not surfaced to owners.

---

## Properties Listing Page (`/portal/properties`)

### Page header

- Title: "Your properties"
- Subtitle: "{n} properties under Parcel management"
- Right side: Gallery / Table view toggle (pill control, no Add property button here)
- Add property lives in the gallery grid only (see below)

### Gallery view (default)

- 2-column grid on desktop, 1-column on mobile
- Card structure (top to bottom):
  - **Photo zone** (230px tall): displays the active image source. Contains:
    - Active/Paused badge — top left, pill with status dot
    - Gear icon button — top right (opens property settings, see below)
    - Image source pill tabs — bottom center, frosted glass: **Aerial | Street | Photo**. The active tab is white-filled; others are translucent. Clicking a tab updates `image_source` on the property and swaps the displayed image.
  - **Body** (white, padded): address (bold, 15px), city + state + home type (12px muted), stats row (beds / baths / guests, separated by border-top)
- Last card in the grid is always the **Add property** dashed placeholder card (full card height, centered "+" icon and label). Tapping it navigates to `/portal/setup/basics`.

### Image sources

Each property stores an `image_source` field (`aerial` | `street` | `photo`, default `aerial`) and a nullable `cover_photo_url`.

| Source | What shows |
|--------|-----------|
| Aerial | Google Maps Static API — satellite view centered on the property address |
| Street | Google Maps Static Street View API — street-level view at the address |
| Photo | Owner-uploaded image stored in Supabase Storage (`cover_photo_url`) |

Aerial and Street are generated server-side using the property's `address_line1`, `city`, `state`. If the Maps API key is absent, the photo zone falls back to a branded placeholder gradient (no broken image state).

### Table view

- Toolbar row above the table: "Customize columns" button (right-aligned). Clicking opens an inline panel (below the button, above the table) with:
  - Drag handle + checkbox + column name per row
  - Address is always on and locked (no drag, no toggle)
  - All other columns are toggleable and reorderable: Status, Type, Bedrooms, Bathrooms, Guests, Square feet
  - Preference is saved to `localStorage` (no backend needed)
- Each row has: thumbnail (38px, shows current image source), address + city, then active columns, then a "..." overflow menu
- Clicking a row navigates to the property detail page

---

## Property Settings (gear icon)

The gear icon on each gallery card opens a small modal (centered, matches portal modal pattern) titled "Property settings" with:

- **Image source** — radio or segmented control: Aerial / Street View / Uploaded photo. If "Uploaded photo" is selected, shows an upload control for `cover_photo_url`.
- Nothing else for now. The modal is deliberately minimal — full property editing (beds, baths, address) is on the property detail page.

---

## Removed

- "Add property" button from the portal app bar / page header
- Property name from all portal UI (cards, detail page app bar title, page `<title>` tags, breadcrumbs)
- `property_type` (business model label) from portal UI — replaced by `home_type`

---

## Schema additions required

| Column | Table | Type | Default |
|--------|-------|------|---------|
| `image_source` | `properties` | `text` check (`aerial`, `street`, `photo`) | `aerial` |
| `cover_photo_url` | `properties` | `text` nullable | `null` |

If these columns already exist under different names, map to them instead.

---

## Files to change

| File | Change |
|------|--------|
| `apps/web/src/app/(portal)/portal/properties/page.tsx` | Full rewrite: gallery/table views, new card layout, view toggle, add-property card in grid |
| `apps/web/src/app/(portal)/portal/properties/[id]/page.tsx` | Replace `name`-based header title with address only |
| `apps/web/src/app/(portal)/portal/properties/components/PropertyCard.tsx` | New component — gallery card with photo zone, pill tabs, gear |
| `apps/web/src/app/(portal)/portal/properties/components/PropertySettingsModal.tsx` | New component — gear modal (image source selector, photo upload) |
| `apps/web/src/app/(portal)/portal/properties/components/PropertyTable.tsx` | New component — table view with customizable columns |
| `apps/web/src/app/(portal)/portal/properties/actions.ts` | New server action — `updatePropertyImageSource(id, source)` |
| Any portal page that renders `property.name` | Replace with address |

---

## Out of scope

- Admin-side property display (admin keeps the name field)
- Full property editing form (address, beds, baths) — that stays on the detail page
- Mobile-specific bottom sheet for settings
- Map zoom level / map type (satellite vs roadmap) controls
- Bulk actions on table rows
