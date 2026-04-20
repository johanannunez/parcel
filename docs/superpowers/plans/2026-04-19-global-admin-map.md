# Global Admin Map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a global command-center map at `/admin/map` showing owners (home pins) and properties (rental pins) as independent toggleable layers with click-to-connect proximity interactions.

**Architecture:** A Next.js server component (`page.tsx`) runs parallel Supabase queries for owners and properties, passing typed props to a client component (`AdminMapView`) that manages layer state, clustering via supercluster, and all interaction logic. Owner home coordinates are stored in a new `home_lat`/`home_lng` column pair on the `contacts` table, populated by a geocoding utility called from the portal onboarding save action.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, react-map-gl v8, mapbox-gl v3, supercluster v8, @phosphor-icons/react, Supabase (service client for geocoding writes), CSS Modules, Mapbox Geocoding API v5, Mapbox Directions API v5.

---

## File Map

### New files
- `apps/web/src/lib/geocode.ts` — server-only geocoding utility
- `apps/web/src/app/(admin)/admin/map/page.tsx` — server component, parallel data fetch
- `apps/web/src/app/(admin)/admin/map/AdminMapView.tsx` — client component, full map logic
- `apps/web/src/app/(admin)/admin/map/AdminMapView.module.css`
- `apps/web/src/app/(admin)/admin/map/LayerToggleBar.tsx` — floating chip row
- `apps/web/src/app/(admin)/admin/map/LayerToggleBar.module.css`
- `apps/web/src/app/(admin)/admin/map/MapPopover.tsx` — shared popover shell
- `apps/web/src/app/(admin)/admin/map/MapPopover.module.css`
- `apps/web/src/app/(admin)/admin/map/NotMappedChip.tsx` — bottom-left chip + modal
- `apps/web/src/app/(admin)/admin/map/NotMappedChip.module.css`

### Modified files
- `apps/web/src/app/(portal)/portal/setup/account/actions.ts` — hook geocoding after address save
- `apps/web/src/components/admin/AdminSidebar.tsx` — add Map nav item to `navItems` and `adminRailItems`
- `apps/web/src/components/admin/AdminBottomNav.tsx` — add Map to `sheetItems`

---

## Task 1: Schema migration — add home coordinates to contacts

**Files:**
- Run SQL in Supabase SQL Editor (no file to create)

- [ ] **Step 1: Run the migration**

Open the Supabase SQL Editor for project `pwoxwpryummqeqsxdgyc` and run:

```sql
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS home_lat  DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS home_lng  DOUBLE PRECISION;

COMMENT ON COLUMN contacts.home_lat IS 'Geocoded latitude of the owner home address (from profiles.mailing_address)';
COMMENT ON COLUMN contacts.home_lng IS 'Geocoded longitude of the owner home address (from profiles.mailing_address)';
```

- [ ] **Step 2: Verify the columns exist**

In the Supabase SQL Editor run:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'contacts'
  AND column_name IN ('home_lat', 'home_lng');
```

Expected output: two rows, both with `data_type = 'double precision'`.

- [ ] **Step 3: Commit**

```bash
cd /Users/johanannunez/workspace/parcel-integrated
git add -A
git commit -m "feat(db): add home_lat/home_lng to contacts for owner geocoding"
```

---

## Task 2: Geocoding utility

**Files:**
- Create: `apps/web/src/lib/geocode.ts`

- [ ] **Step 1: Create the file**

```typescript
// apps/web/src/lib/geocode.ts
import 'server-only';

export type GeoPoint = { lat: number; lng: number };

/**
 * Geocodes a mailing address using the Mapbox Geocoding API.
 * Returns null when the address cannot be resolved or the token is missing.
 * Must only be called from server actions or server components.
 */
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/johanannunez/workspace/parcel-integrated/apps/web
pnpm exec tsc --noEmit 2>&1 | head -20
```

Expected: no errors related to `geocode.ts`.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/geocode.ts
git commit -m "feat(lib): add server-only Mapbox geocoding utility"
```

---

## Task 3: Hook geocoding into the portal account save action

**Files:**
- Modify: `apps/web/src/app/(portal)/portal/setup/account/actions.ts`

The portal onboarding `saveAccount` action already saves `mailing_address` to `profiles`. After it succeeds, geocode the address and write `home_lat`/`home_lng` to `contacts` where `profile_id = user.id`.

- [ ] **Step 1: Add the import at the top of actions.ts**

Open `apps/web/src/app/(portal)/portal/setup/account/actions.ts`. After the existing imports, add:

```typescript
import { geocodeAddress } from '@/lib/geocode';
```

- [ ] **Step 2: Add geocoding after the successful profile update**

Find the block that ends with `if (error) return { error: error.message };` (the profile update error check). Immediately after it, before the activity log section, add:

```typescript
  // Geocode owner home address and store on contacts record.
  // Fire-and-forget style: a geocoding failure must never break onboarding.
  (async () => {
    try {
      const point = await geocodeAddress(v.street, v.city, v.state, v.zip);
      if (!point) return;
      const svcForGeo = createServiceClient();
      await svcForGeo
        .from('contacts')
        .update({ home_lat: point.lat, home_lng: point.lng })
        .eq('profile_id', user.id);
    } catch {
      // Intentionally swallowed — geocoding is best-effort.
    }
  })();
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/johanannunez/workspace/parcel-integrated/apps/web
pnpm exec tsc --noEmit 2>&1 | head -20
```

Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/\(portal\)/portal/setup/account/actions.ts
git commit -m "feat(portal/onboarding): geocode owner home address on account save"
```

---

## Task 4: Server component — /admin/map page

**Files:**
- Create: `apps/web/src/app/(admin)/admin/map/page.tsx`

- [ ] **Step 1: Create the page**

```typescript
// apps/web/src/app/(admin)/admin/map/page.tsx
import { createClient } from '@/lib/supabase/server';
import type { LifecycleStage } from '@/lib/admin/contact-types';
import { AdminMapView } from './AdminMapView';

export const dynamic = 'force-dynamic';

export type OwnerMapPin = {
  contactId: string;
  fullName: string;
  companyName: string | null;
  avatarUrl: string | null;
  lifecycleStage: LifecycleStage;
  homeLat: number;
  homeLng: number;
};

export type PropertyMapPin = {
  propertyId: string;
  primaryOwnerId: string;
  ownerName: string;
  ownerLifecycleStage: LifecycleStage;
  addressLine1: string;
  city: string | null;
  state: string | null;
  latitude: number;
  longitude: number;
};

export default async function AdminMapPage() {
  const supabase = await createClient();

  const [ownersResult, propertiesResult] = await Promise.all([
    // Owners: contacts with a geocoded home address
    supabase
      .from('contacts')
      .select(
        'id, full_name, company_name, avatar_url, lifecycle_stage, home_lat, home_lng',
      )
      .not('home_lat', 'is', null)
      .not('home_lng', 'is', null),

    // Properties: rows with coordinates, joined to primary owner contact
    supabase
      .from('properties')
      .select(
        `id, address_line1, city, state, latitude, longitude, owner_id,
         owner_contact:contacts!properties_contact_id_fkey(
           id, full_name, lifecycle_stage
         )`,
      )
      .not('latitude', 'is', null)
      .not('longitude', 'is', null),
  ]);

  const owners: OwnerMapPin[] = (ownersResult.data ?? []).map((r) => ({
    contactId: r.id,
    fullName: r.full_name,
    companyName: r.company_name,
    avatarUrl: r.avatar_url,
    lifecycleStage: r.lifecycle_stage as LifecycleStage,
    homeLat: Number(r.home_lat),
    homeLng: Number(r.home_lng),
  }));

  const properties: PropertyMapPin[] = (propertiesResult.data ?? [])
    .filter((p) => p.owner_id != null)
    .map((p) => {
      const ownerContact = Array.isArray(p.owner_contact)
        ? p.owner_contact[0]
        : p.owner_contact;
      return {
        propertyId: p.id,
        primaryOwnerId: p.owner_id as string,
        ownerName: (ownerContact as { full_name?: string } | null)?.full_name ?? 'Unknown',
        ownerLifecycleStage: ((ownerContact as { lifecycle_stage?: string } | null)
          ?.lifecycle_stage ?? 'lead_new') as LifecycleStage,
        addressLine1: p.address_line1,
        city: p.city,
        state: p.state,
        latitude: Number(p.latitude),
        longitude: Number(p.longitude),
      };
    });

  return <AdminMapView owners={owners} properties={properties} />;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/johanannunez/workspace/parcel-integrated/apps/web
pnpm exec tsc --noEmit 2>&1 | head -30
```

Expected: no errors for the new file. (There will be an error about `AdminMapView` not existing yet — that's fine and expected at this step.)

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/\(admin\)/admin/map/page.tsx
git commit -m "feat(admin/map): server component with parallel owner + property queries"
```

---

## Task 5: LayerToggleBar component

**Files:**
- Create: `apps/web/src/app/(admin)/admin/map/LayerToggleBar.tsx`
- Create: `apps/web/src/app/(admin)/admin/map/LayerToggleBar.module.css`

- [ ] **Step 1: Create the CSS**

```css
/* apps/web/src/app/(admin)/admin/map/LayerToggleBar.module.css */
.bar {
  position: absolute;
  top: 14px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  display: flex;
  gap: 6px;
  align-items: center;
  background: white;
  padding: 6px 8px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 13px;
  border-radius: 99px;
  font-size: 12px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  border: 1.5px solid transparent;
  transition: opacity 0.15s ease;
  white-space: nowrap;
}

.chip:hover {
  opacity: 0.85;
}

.chipActive {
  color: white;
  border-color: transparent;
}

.chipInactive {
  background: white;
  border-color: #d1d5db;
  color: #94a3b8;
}

.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}
```

- [ ] **Step 2: Create the component**

```typescript
// apps/web/src/app/(admin)/admin/map/LayerToggleBar.tsx
'use client';

import styles from './LayerToggleBar.module.css';

export type LayerKey = 'owners' | 'properties' | 'projects' | 'tasks';

export type LayerState = Record<LayerKey, boolean>;

const LAYER_CONFIG: {
  key: LayerKey;
  label: string;
  color: string;
}[] = [
  { key: 'owners',     label: 'Owners',     color: '#10B981' },
  { key: 'properties', label: 'Properties', color: '#02AAEB' },
  { key: 'projects',   label: 'Projects',   color: '#8B5CF6' },
  { key: 'tasks',      label: 'Tasks',      color: '#F59E0B' },
];

type Props = {
  layers: LayerState;
  onToggle: (key: LayerKey) => void;
};

export function LayerToggleBar({ layers, onToggle }: Props) {
  return (
    <div className={styles.bar}>
      {LAYER_CONFIG.map(({ key, label, color }) => {
        const active = layers[key];
        return (
          <button
            key={key}
            type="button"
            className={`${styles.chip} ${active ? styles.chipActive : styles.chipInactive}`}
            style={active ? { background: color, borderColor: color } : undefined}
            onClick={() => onToggle(key)}
            aria-pressed={active}
            aria-label={`${active ? 'Hide' : 'Show'} ${label}`}
          >
            <span
              className={styles.dot}
              style={{ background: active ? 'rgba(255,255,255,0.8)' : color }}
            />
            {label}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/johanannunez/workspace/parcel-integrated/apps/web
pnpm exec tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/\(admin\)/admin/map/LayerToggleBar.tsx \
        apps/web/src/app/\(admin\)/admin/map/LayerToggleBar.module.css
git commit -m "feat(admin/map): layer toggle chip bar component"
```

---

## Task 6: MapPopover shared shell

**Files:**
- Create: `apps/web/src/app/(admin)/admin/map/MapPopover.tsx`
- Create: `apps/web/src/app/(admin)/admin/map/MapPopover.module.css`

- [ ] **Step 1: Create the CSS**

```css
/* apps/web/src/app/(admin)/admin/map/MapPopover.module.css */
.popover {
  background: white;
  border-radius: 12px;
  padding: 14px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.14), 0 1px 4px rgba(0, 0, 0, 0.06);
  width: 200px;
  font-family: inherit;
}

.header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.avatarFallback {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}

.headerText {
  flex: 1;
  min-width: 0;
}

.name {
  font-size: 13px;
  font-weight: 700;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sub {
  font-size: 12px;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stagePill {
  display: inline-block;
  padding: 3px 9px;
  border-radius: 99px;
  font-size: 11px;
  font-weight: 600;
  margin-bottom: 10px;
}

.address {
  font-size: 12px;
  color: #475569;
  margin-bottom: 10px;
  line-height: 1.4;
}

.meta {
  font-size: 11px;
  color: #94a3b8;
  margin-bottom: 10px;
}

.cta {
  display: block;
  width: 100%;
  padding: 7px 12px;
  background: #0f172a;
  color: white;
  border: none;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 700;
  font-family: inherit;
  text-align: center;
  text-decoration: none;
  cursor: pointer;
}

.cta:hover {
  background: #1e293b;
}

.closeButton {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #f1f5f9;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #64748b;
  padding: 0;
}

.closeButton:hover {
  background: #e2e8f0;
}
```

- [ ] **Step 2: Create the component**

```typescript
// apps/web/src/app/(admin)/admin/map/MapPopover.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { X } from '@phosphor-icons/react';
import { initials, stageColor, stageLabel } from '@/lib/admin/lifecycle-stage';
import type { LifecycleStage } from '@/lib/admin/contact-types';
import styles from './MapPopover.module.css';

type Props = {
  kind: 'owner' | 'property';
  name: string;
  sub: string | null;
  avatarUrl: string | null;
  avatarColor: string;
  lifecycleStage: LifecycleStage;
  address?: string;
  addressSub?: string | null;
  meta?: string | null;
  ctaLabel: string;
  ctaHref: string;
  onClose: () => void;
};

export function MapPopover({
  name,
  sub,
  avatarUrl,
  avatarColor,
  lifecycleStage,
  address,
  addressSub,
  meta,
  ctaLabel,
  ctaHref,
  onClose,
}: Props) {
  const color = stageColor(lifecycleStage);

  return (
    <div className={styles.popover} style={{ position: 'relative' }}>
      <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close">
        <X size={12} weight="bold" />
      </button>

      <div className={styles.header}>
        {avatarUrl ? (
          <Image src={avatarUrl} alt="" width={36} height={36} className={styles.avatar} />
        ) : (
          <div className={styles.avatarFallback} style={{ background: avatarColor }}>
            {initials(name)}
          </div>
        )}
        <div className={styles.headerText}>
          <div className={styles.name}>{name}</div>
          {sub ? <div className={styles.sub}>{sub}</div> : null}
        </div>
      </div>

      <span
        className={styles.stagePill}
        style={{ background: `${color}1f`, color }}
      >
        {stageLabel(lifecycleStage)}
      </span>

      {address ? (
        <div className={styles.address}>
          {address}
          {addressSub ? <div>{addressSub}</div> : null}
        </div>
      ) : null}

      {meta ? <div className={styles.meta}>{meta}</div> : null}

      <Link href={ctaHref} className={styles.cta}>
        {ctaLabel}
      </Link>
    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/johanannunez/workspace/parcel-integrated/apps/web
pnpm exec tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/\(admin\)/admin/map/MapPopover.tsx \
        apps/web/src/app/\(admin\)/admin/map/MapPopover.module.css
git commit -m "feat(admin/map): shared map popover shell"
```

---

## Task 7: NotMappedChip component

**Files:**
- Create: `apps/web/src/app/(admin)/admin/map/NotMappedChip.tsx`
- Create: `apps/web/src/app/(admin)/admin/map/NotMappedChip.module.css`

- [ ] **Step 1: Create the CSS**

```css
/* apps/web/src/app/(admin)/admin/map/NotMappedChip.module.css */
.chip {
  position: absolute;
  bottom: 14px;
  left: 14px;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 99px;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  font-family: inherit;
}

.chip:hover {
  background: #f8fafc;
}

.backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal {
  background: white;
  border-radius: 16px;
  width: 360px;
  max-height: 480px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.modalHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px 14px;
  border-bottom: 1px solid #f1f5f9;
}

.modalTitle {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.modalSubtitle {
  font-size: 12px;
  color: #94a3b8;
  margin: 2px 0 0;
}

.modalClose {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #64748b;
  padding: 0;
}

.list {
  overflow-y: auto;
  padding: 8px 0;
}

.row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  text-decoration: none;
  color: inherit;
  transition: background 0.1s;
}

.row:hover {
  background: #f8fafc;
}

.avatarFallback {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}

.rowName {
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
}

.rowSub {
  font-size: 12px;
  color: #94a3b8;
}

.pill {
  margin-left: auto;
  padding: 2px 9px;
  border-radius: 99px;
  font-size: 11px;
  font-weight: 600;
}
```

- [ ] **Step 2: Create the component**

```typescript
// apps/web/src/app/(admin)/admin/map/NotMappedChip.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ListBullets, X } from '@phosphor-icons/react';
import { initials, stageColor, stageLabel } from '@/lib/admin/lifecycle-stage';
import type { LifecycleStage } from '@/lib/admin/contact-types';
import styles from './NotMappedChip.module.css';

type NotMappedItem = {
  id: string;
  fullName: string;
  companyName: string | null;
  avatarUrl: string | null;
  lifecycleStage: LifecycleStage;
  kind: 'owner' | 'property';
  href: string;
};

type Props = {
  items: NotMappedItem[];
};

export function NotMappedChip({ items }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  if (items.length === 0) return null;

  return (
    <>
      <button
        type="button"
        className={styles.chip}
        onClick={() => setOpen(true)}
      >
        <ListBullets size={13} weight="duotone" />
        {items.length} {items.length === 1 ? 'contact' : 'contacts'} not mapped
      </button>

      {open ? (
        <div
          className={styles.backdrop}
          role="dialog"
          aria-modal="true"
          aria-label="Contacts not mapped"
          onClick={() => setOpen(false)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalTitle}>Not mapped</h2>
                <p className={styles.modalSubtitle}>
                  {items.length} {items.length === 1 ? 'contact' : 'contacts'} without a geocoded address
                </p>
              </div>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                <X size={14} weight="bold" />
              </button>
            </div>

            <div className={styles.list}>
              {items.map((item) => {
                const color = stageColor(item.lifecycleStage);
                return (
                  <Link key={item.id} href={item.href} className={styles.row}>
                    {item.avatarUrl ? (
                      <Image
                        src={item.avatarUrl}
                        alt=""
                        width={32}
                        height={32}
                        className={styles.avatarFallback}
                        style={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        className={styles.avatarFallback}
                        style={{ background: color }}
                      >
                        {initials(item.fullName)}
                      </div>
                    )}
                    <div>
                      <div className={styles.rowName}>{item.fullName}</div>
                      {item.companyName ? (
                        <div className={styles.rowSub}>{item.companyName}</div>
                      ) : null}
                    </div>
                    <span
                      className={styles.pill}
                      style={{ background: `${color}1f`, color }}
                    >
                      {stageLabel(item.lifecycleStage)}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export type { NotMappedItem };
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/\(admin\)/admin/map/NotMappedChip.tsx \
        apps/web/src/app/\(admin\)/admin/map/NotMappedChip.module.css
git commit -m "feat(admin/map): not-mapped chip and modal for owners without coordinates"
```

---

## Task 8: AdminMapView — main client component

**Files:**
- Create: `apps/web/src/app/(admin)/admin/map/AdminMapView.tsx`
- Create: `apps/web/src/app/(admin)/admin/map/AdminMapView.module.css`

This is the central component. It manages all state: layer toggles, selected pin, viewport, clusters. It renders the Mapbox map, markers, popover, and supporting components.

- [ ] **Step 1: Create the CSS**

```css
/* apps/web/src/app/(admin)/admin/map/AdminMapView.module.css */
.shell {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.missingToken {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 12px;
  color: #64748b;
  text-align: center;
  padding: 40px;
}

.missingToken h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.missingToken p {
  margin: 0;
  font-size: 14px;
  max-width: 360px;
  line-height: 1.6;
}

/* Owner pin */
.ownerPin {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2.5px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  color: white;
  cursor: pointer;
  padding: 0;
  overflow: hidden;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  background: none;
  font-family: inherit;
}

.ownerPin:hover,
.ownerPinSelected {
  transform: scale(1.12);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

.ownerPinSelected {
  outline: 3px solid rgba(255, 255, 255, 0.6);
  outline-offset: 2px;
}

.ownerPinImg {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Property pin */
.propertyPin {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  color: white;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  background: none;
  font-family: inherit;
}

.propertyPin:hover,
.propertyPinSelected {
  transform: scale(1.12);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.22);
}

.propertyPinSelected {
  outline: 3px solid rgba(255, 255, 255, 0.6);
  outline-offset: 2px;
}

/* Cluster */
.cluster {
  border-radius: 50%;
  border: 3px solid white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  padding: 0;
  font-family: inherit;
  transition: transform 0.15s ease;
}

.cluster:hover {
  transform: scale(1.08);
}

/* SVG overlay for connecting lines */
.linesOverlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 5;
}
```

- [ ] **Step 2: Create the AdminMapView component**

```typescript
// apps/web/src/app/(admin)/admin/map/AdminMapView.tsx
'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Map, {
  Marker,
  NavigationControl,
  Popup,
  type MapRef,
} from 'react-map-gl/mapbox';
import Supercluster from 'supercluster';
import { House } from '@phosphor-icons/react';
import {
  STAGE_COLOR,
  initials,
  stageGroup,
} from '@/lib/admin/lifecycle-stage';
import type { OwnerMapPin, PropertyMapPin } from './page';
import { LayerToggleBar, type LayerKey, type LayerState } from './LayerToggleBar';
import { MapPopover } from './MapPopover';
import { NotMappedChip, type NotMappedItem } from './NotMappedChip';
import styles from './AdminMapView.module.css';
import 'mapbox-gl/dist/mapbox-gl.css';

type BBox = [number, number, number, number];

type OwnerFeatureProps = OwnerMapPin;
type PropertyFeatureProps = PropertyMapPin;

type OwnerFeature = {
  type: 'Feature';
  properties: OwnerFeatureProps;
  geometry: { type: 'Point'; coordinates: [number, number] };
};

type PropertyFeature = {
  type: 'Feature';
  properties: PropertyFeatureProps;
  geometry: { type: 'Point'; coordinates: [number, number] };
};

type SelectedPin =
  | { kind: 'owner'; feature: OwnerFeature }
  | { kind: 'property'; feature: PropertyFeature };

const DEFAULT_VIEWPORT = { latitude: 39.5, longitude: -98.35, zoom: 3.5 };

type DriveTimeCache = Map<string, string>;

type Props = {
  owners: OwnerMapPin[];
  properties: PropertyMapPin[];
};

export function AdminMapView({ owners, properties }: Props) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const mapRef = useRef<MapRef>(null);

  const [layers, setLayers] = useState<LayerState>({
    owners: true,
    properties: true,
    projects: false,
    tasks: false,
  });

  const [viewport, setViewport] = useState(DEFAULT_VIEWPORT);
  const [selected, setSelected] = useState<SelectedPin | null>(null);
  const [driveTimes, setDriveTimes] = useState<DriveTimeCache>(new Map());

  const ownerFeatures = useMemo<OwnerFeature[]>(
    () =>
      owners.map((o) => ({
        type: 'Feature',
        properties: o,
        geometry: { type: 'Point', coordinates: [o.homeLng, o.homeLat] },
      })),
    [owners],
  );

  const propertyFeatures = useMemo<PropertyFeature[]>(
    () =>
      properties.map((p) => ({
        type: 'Feature',
        properties: p,
        geometry: { type: 'Point', coordinates: [p.longitude, p.latitude] },
      })),
    [properties],
  );

  // Build supercluster instances per layer.
  const ownerCluster = useMemo(() => {
    const sc = new Supercluster<OwnerFeatureProps>({ radius: 60, maxZoom: 16 });
    sc.load(ownerFeatures);
    return sc;
  }, [ownerFeatures]);

  const propertyCluster = useMemo(() => {
    const sc = new Supercluster<PropertyFeatureProps>({ radius: 60, maxZoom: 16 });
    sc.load(propertyFeatures);
    return sc;
  }, [propertyFeatures]);

  const getBBox = useCallback((): BBox => {
    const map = mapRef.current?.getMap();
    if (!map) return [-180, -85, 180, 85];
    const b = map.getBounds();
    if (!b) return [-180, -85, 180, 85];
    return [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()];
  }, []);

  const zoom = Math.floor(viewport.zoom);

  const visibleOwnerClusters = useMemo(
    () => (layers.owners ? ownerCluster.getClusters(getBBox(), zoom) : []),
    [layers.owners, ownerCluster, getBBox, zoom],
  );

  const visiblePropertyClusters = useMemo(
    () => (layers.properties ? propertyCluster.getClusters(getBBox(), zoom) : []),
    [layers.properties, propertyCluster, getBBox, zoom],
  );

  const handleToggle = useCallback((key: LayerKey) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleOwnerClick = useCallback(
    async (feature: OwnerFeature) => {
      setSelected({ kind: 'owner', feature });

      if (!token) return;
      const ownerProps = feature.properties;
      const ownerProps_ = properties.filter(
        (p) => p.primaryOwnerId === ownerProps.contactId,
      );
      for (const prop of ownerProps_) {
        const cacheKey = `${ownerProps.contactId}:${prop.propertyId}`;
        if (driveTimes.has(cacheKey)) continue;
        try {
          const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${ownerProps.homeLng},${ownerProps.homeLat};${prop.longitude},${prop.latitude}?access_token=${token}&overview=false`;
          const res = await fetch(url);
          const json = await res.json() as { routes?: Array<{ duration?: number }> };
          const seconds = json.routes?.[0]?.duration;
          if (seconds != null) {
            const mins = Math.round(seconds / 60);
            setDriveTimes((prev) => new Map(prev).set(cacheKey, `~${mins} min`));
          }
        } catch {
          // Drive time is best-effort.
        }
      }
    },
    [token, properties, driveTimes],
  );

  const handlePropertyClick = useCallback((feature: PropertyFeature) => {
    setSelected({ kind: 'property', feature });
  }, []);

  const handleClusterClick = useCallback(
    (
      sc: Supercluster,
      clusterId: number,
      longitude: number,
      latitude: number,
    ) => {
      const zoom = Math.min(sc.getClusterExpansionZoom(clusterId), 16);
      mapRef.current?.easeTo({ center: [longitude, latitude], zoom, duration: 500 });
    },
    [],
  );

  // Compute dashed lines when an owner is selected.
  const dashedLines = useMemo(() => {
    if (!selected || selected.kind !== 'owner') return [];
    const ownerId = selected.feature.properties.contactId;
    return properties
      .filter((p) => p.primaryOwnerId === ownerId)
      .map((p) => ({
        propId: p.propertyId,
        ownerLng: selected.feature.geometry.coordinates[0],
        ownerLat: selected.feature.geometry.coordinates[1],
        propLng: p.longitude,
        propLat: p.latitude,
        driveTime: driveTimes.get(`${ownerId}:${p.propertyId}`) ?? null,
      }));
  }, [selected, properties, driveTimes]);

  // Project lat/lng to pixel coordinates for SVG line overlay.
  const projectPoint = useCallback(
    (lng: number, lat: number): { x: number; y: number } | null => {
      const map = mapRef.current?.getMap();
      if (!map) return null;
      const p = map.project([lng, lat]);
      return { x: p.x, y: p.y };
    },
    [],
  );

  // Not-mapped owners (contacts without home_lat/home_lng).
  const notMappedItems = useMemo<NotMappedItem[]>(() => {
    if (!layers.owners) return [];
    // Owners passed to this component already have coordinates — not-mapped
    // are those the server excluded. We can't know them here without a separate
    // prop. For Phase 1, the chip is omitted if all owners are mapped.
    // A future enhancement passes unmapped owners from page.tsx.
    return [];
  }, [layers.owners]);

  if (!token) {
    return (
      <div className={styles.missingToken}>
        <House size={28} weight="duotone" />
        <h3>Map is not configured</h3>
        <p>
          The <code>NEXT_PUBLIC_MAPBOX_TOKEN</code> environment variable is not
          set. Add it via Doppler and redeploy to enable the map view.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      <Map
        ref={mapRef}
        mapboxAccessToken={token}
        mapStyle="mapbox://styles/mapbox/light-v11"
        initialViewState={DEFAULT_VIEWPORT}
        onMove={(e) =>
          setViewport({
            latitude: e.viewState.latitude,
            longitude: e.viewState.longitude,
            zoom: e.viewState.zoom,
          })
        }
        onClick={() => setSelected(null)}
        style={{ width: '100%', height: '100%' }}
      >
        <NavigationControl position="bottom-right" showCompass={false} />

        {/* Owner clusters */}
        {visibleOwnerClusters.map((c) => {
          const [lng, lat] = c.geometry.coordinates;
          const cp = c.properties as Supercluster.ClusterProperties & Partial<OwnerFeatureProps>;
          if (cp.cluster) {
            const count = cp.point_count ?? 0;
            const size = 36 + Math.min(count, 50) * 0.9;
            return (
              <Marker key={`oc-${cp.cluster_id}`} longitude={lng} latitude={lat} anchor="center">
                <button
                  type="button"
                  className={styles.cluster}
                  style={{ width: size, height: size, background: '#10B981' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClusterClick(ownerCluster, cp.cluster_id as number, lng, lat);
                  }}
                  aria-label={`${count} owners`}
                >
                  {count}
                </button>
              </Marker>
            );
          }
          const feature = c as unknown as OwnerFeature;
          const color = STAGE_COLOR[stageGroup(feature.properties.lifecycleStage)];
          const isSelected =
            selected?.kind === 'owner' &&
            selected.feature.properties.contactId === feature.properties.contactId;
          return (
            <Marker
              key={`owner-${feature.properties.contactId}`}
              longitude={lng}
              latitude={lat}
              anchor="center"
            >
              <button
                type="button"
                className={`${styles.ownerPin} ${isSelected ? styles.ownerPinSelected : ''}`}
                style={{ background: color }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleOwnerClick(feature);
                }}
                aria-label={feature.properties.fullName}
              >
                {feature.properties.avatarUrl ? (
                  <Image
                    src={feature.properties.avatarUrl}
                    alt=""
                    width={36}
                    height={36}
                    className={styles.ownerPinImg}
                  />
                ) : (
                  initials(feature.properties.fullName)
                )}
              </button>
            </Marker>
          );
        })}

        {/* Property clusters */}
        {visiblePropertyClusters.map((c) => {
          const [lng, lat] = c.geometry.coordinates;
          const cp = c.properties as Supercluster.ClusterProperties & Partial<PropertyFeatureProps>;
          if (cp.cluster) {
            const count = cp.point_count ?? 0;
            const size = 32 + Math.min(count, 50) * 0.8;
            return (
              <Marker key={`pc-${cp.cluster_id}`} longitude={lng} latitude={lat} anchor="center">
                <button
                  type="button"
                  className={styles.cluster}
                  style={{ width: size, height: size, background: '#02AAEB' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClusterClick(propertyCluster, cp.cluster_id as number, lng, lat);
                  }}
                  aria-label={`${count} properties`}
                >
                  {count}
                </button>
              </Marker>
            );
          }
          const feature = c as unknown as PropertyFeature;
          const color = STAGE_COLOR[stageGroup(feature.properties.ownerLifecycleStage)];
          const isSelected =
            selected?.kind === 'property' &&
            selected.feature.properties.propertyId === feature.properties.propertyId;
          return (
            <Marker
              key={`prop-${feature.properties.propertyId}`}
              longitude={lng}
              latitude={lat}
              anchor="center"
            >
              <button
                type="button"
                className={`${styles.propertyPin} ${isSelected ? styles.propertyPinSelected : ''}`}
                style={{ background: color }}
                onClick={(e) => {
                  e.stopPropagation();
                  handlePropertyClick(feature);
                }}
                aria-label={feature.properties.addressLine1}
              >
                <House size={14} weight="duotone" color="white" />
              </button>
            </Marker>
          );
        })}

        {/* Popover for selected owner */}
        {selected?.kind === 'owner' ? (
          <Popup
            longitude={selected.feature.geometry.coordinates[0]}
            latitude={selected.feature.geometry.coordinates[1]}
            anchor="bottom"
            offset={22}
            closeOnClick={false}
            closeButton={false}
            onClose={() => setSelected(null)}
            className="global-map-popup"
          >
            <MapPopover
              kind="owner"
              name={selected.feature.properties.fullName}
              sub={selected.feature.properties.companyName}
              avatarUrl={selected.feature.properties.avatarUrl}
              avatarColor={STAGE_COLOR[stageGroup(selected.feature.properties.lifecycleStage)]}
              lifecycleStage={selected.feature.properties.lifecycleStage}
              meta={(() => {
                const count = properties.filter(
                  (p) => p.primaryOwnerId === selected.feature.properties.contactId,
                ).length;
                return count > 0 ? `${count} ${count === 1 ? 'property' : 'properties'}` : null;
              })()}
              ctaLabel="View contact"
              ctaHref={`/admin/contacts/${selected.feature.properties.contactId}`}
              onClose={() => setSelected(null)}
            />
          </Popup>
        ) : null}

        {/* Popover for selected property */}
        {selected?.kind === 'property' ? (
          <Popup
            longitude={selected.feature.geometry.coordinates[0]}
            latitude={selected.feature.geometry.coordinates[1]}
            anchor="bottom"
            offset={18}
            closeOnClick={false}
            closeButton={false}
            onClose={() => setSelected(null)}
            className="global-map-popup"
          >
            <MapPopover
              kind="property"
              name={selected.feature.properties.addressLine1}
              sub={selected.feature.properties.ownerName}
              avatarUrl={null}
              avatarColor={STAGE_COLOR[stageGroup(selected.feature.properties.ownerLifecycleStage)]}
              lifecycleStage={selected.feature.properties.ownerLifecycleStage}
              address={selected.feature.properties.addressLine1}
              addressSub={
                [selected.feature.properties.city, selected.feature.properties.state]
                  .filter(Boolean)
                  .join(', ') || null
              }
              ctaLabel="View property"
              ctaHref={`/admin/properties/${selected.feature.properties.propertyId}`}
              onClose={() => setSelected(null)}
            />
          </Popup>
        ) : null}
      </Map>

      {/* SVG dashed lines overlay for owner-to-property connections */}
      {dashedLines.length > 0 ? (
        <svg
          className={styles.linesOverlay}
          style={{ width: '100%', height: '100%' }}
        >
          {dashedLines.map((line) => {
            const from = projectPoint(line.ownerLng, line.ownerLat);
            const to = projectPoint(line.propLng, line.propLat);
            if (!from || !to) return null;
            const midX = (from.x + to.x) / 2;
            const midY = (from.y + to.y) / 2;
            return (
              <g key={line.propId}>
                <line
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke="#10B981"
                  strokeWidth={1.5}
                  strokeDasharray="6,4"
                  opacity={0.7}
                />
                {line.driveTime ? (
                  <text
                    x={midX}
                    y={midY - 6}
                    textAnchor="middle"
                    fontSize={10}
                    fill="#10B981"
                    fontWeight={600}
                    style={{ fontFamily: 'inherit' }}
                  >
                    {line.driveTime}
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>
      ) : null}

      <LayerToggleBar layers={layers} onToggle={handleToggle} />
      <NotMappedChip items={notMappedItems} />
    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/johanannunez/workspace/parcel-integrated/apps/web
pnpm exec tsc --noEmit 2>&1 | head -40
```

Expected: no errors. Fix any type errors before proceeding — do not suppress with `any`.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/\(admin\)/admin/map/AdminMapView.tsx \
        apps/web/src/app/\(admin\)/admin/map/AdminMapView.module.css
git commit -m "feat(admin/map): AdminMapView client component with owners, properties, clustering, and interactions"
```

---

## Task 9: Update page.tsx to pass unmapped owners to NotMappedChip

The `AdminMapView` receives all owners with coordinates from `page.tsx`, but the server also needs to pass owners WITHOUT coordinates so the chip can list them.

**Files:**
- Modify: `apps/web/src/app/(admin)/admin/map/page.tsx`
- Modify: `apps/web/src/app/(admin)/admin/map/AdminMapView.tsx`

- [ ] **Step 1: Add UnmappedOwner type and second query to page.tsx**

Replace the owners query in `page.tsx` with two queries: one for mapped (with coordinates), one for unmapped:

```typescript
// In page.tsx, replace the ownersResult line with:
const [mappedOwnersResult, unmappedOwnersResult, propertiesResult] = await Promise.all([
  // Owners WITH coordinates
  supabase
    .from('contacts')
    .select('id, full_name, company_name, avatar_url, lifecycle_stage, home_lat, home_lng')
    .not('home_lat', 'is', null)
    .not('home_lng', 'is', null),

  // Owners WITHOUT coordinates
  supabase
    .from('contacts')
    .select('id, full_name, company_name, avatar_url, lifecycle_stage')
    .is('home_lat', null),

  // Properties with coordinates (unchanged)
  supabase
    .from('properties')
    .select(
      `id, address_line1, city, state, latitude, longitude, owner_id,
       owner_contact:contacts!properties_contact_id_fkey(
         id, full_name, lifecycle_stage
       )`,
    )
    .not('latitude', 'is', null)
    .not('longitude', 'is', null),
]);
```

Add an `UnmappedOwner` export type and build the array:

```typescript
export type UnmappedOwner = {
  contactId: string;
  fullName: string;
  companyName: string | null;
  avatarUrl: string | null;
  lifecycleStage: LifecycleStage;
};
```

```typescript
const unmappedOwners: UnmappedOwner[] = (unmappedOwnersResult.data ?? []).map((r) => ({
  contactId: r.id,
  fullName: r.full_name,
  companyName: r.company_name,
  avatarUrl: r.avatar_url,
  lifecycleStage: r.lifecycle_stage as LifecycleStage,
}));
```

Update the return:

```typescript
return <AdminMapView owners={owners} properties={properties} unmappedOwners={unmappedOwners} />;
```

- [ ] **Step 2: Update AdminMapView to accept and use unmappedOwners**

Add `unmappedOwners: UnmappedOwner[]` to the `Props` type in `AdminMapView.tsx`:

```typescript
import type { OwnerMapPin, PropertyMapPin, UnmappedOwner } from './page';

type Props = {
  owners: OwnerMapPin[];
  properties: PropertyMapPin[];
  unmappedOwners: UnmappedOwner[];
};
```

Replace the `notMappedItems` useMemo with:

```typescript
const notMappedItems = useMemo<NotMappedItem[]>(() => {
  if (!layers.owners) return [];
  return unmappedOwners.map((o) => ({
    id: o.contactId,
    fullName: o.fullName,
    companyName: o.companyName,
    avatarUrl: o.avatarUrl,
    lifecycleStage: o.lifecycleStage,
    kind: 'owner' as const,
    href: `/admin/contacts/${o.contactId}`,
  }));
}, [layers.owners, unmappedOwners]);
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/johanannunez/workspace/parcel-integrated/apps/web
pnpm exec tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/\(admin\)/admin/map/page.tsx \
        apps/web/src/app/\(admin\)/admin/map/AdminMapView.tsx
git commit -m "feat(admin/map): surface unmapped owners in not-mapped chip"
```

---

## Task 10: Add Map to the admin sidebar navigation

**Files:**
- Modify: `apps/web/src/components/admin/AdminSidebar.tsx`
- Modify: `apps/web/src/components/admin/AdminBottomNav.tsx`

- [ ] **Step 1: Add MapTrifold import to AdminSidebar.tsx**

Find the existing import block at the top of `AdminSidebar.tsx`:

```typescript
import {
  House,
  UsersThree,
  Buildings,
  Wallet,
  EnvelopeSimple,
  ChatCircle,
  ListChecks,
  BookOpenText,
  Kanban,
  MagnifyingGlass,
  List as HamburgerIcon,
} from "@phosphor-icons/react";
```

Add `MapTrifold` to it:

```typescript
import {
  House,
  UsersThree,
  Buildings,
  Wallet,
  EnvelopeSimple,
  ChatCircle,
  ListChecks,
  BookOpenText,
  Kanban,
  MapTrifold,
  MagnifyingGlass,
  List as HamburgerIcon,
} from "@phosphor-icons/react";
```

- [ ] **Step 2: Add Map item to navItems array in AdminSidebar.tsx**

Find the `navItems` array. After the Contacts entry and before the Properties entry, add:

```typescript
{ href: "/admin/map", label: "Map", icon: <MapTrifold size={18} weight="duotone" />, matchPrefix: "/admin/map" },
```

The array should look like:

```typescript
const navItems: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: <House size={18} weight="duotone" /> },
  { href: "/admin/inbox", label: "Inbox", icon: <ChatCircle size={18} weight="duotone" />, matchPrefix: "/admin/inbox" },
  { href: "/admin/tasks", label: "Tasks", icon: <ListChecks size={18} weight="duotone" />, matchPrefix: "/admin/tasks" },
  { href: "/admin/contacts", label: "Contacts", icon: <UsersThree size={18} weight="duotone" />, matchPrefix: "/admin/contacts" },
  { href: "/admin/map", label: "Map", icon: <MapTrifold size={18} weight="duotone" />, matchPrefix: "/admin/map" },
  { href: "/admin/properties", label: "Properties", icon: <Buildings size={18} weight="duotone" />, matchPrefix: "/admin/properties" },
  { href: "/admin/projects", label: "Projects", icon: <Kanban size={18} weight="duotone" />, matchPrefix: "/admin/projects" },
  { href: "/admin/help", label: "Help Center", icon: <BookOpenText size={18} weight="duotone" />, matchPrefix: "/admin/help" },
];
```

- [ ] **Step 3: Add Map item to adminRailItems array in AdminSidebar.tsx**

Find the `adminRailItems` array (around line 445). After Contacts, before Properties, add:

```typescript
{ href: "/admin/map", icon: <MapTrifold size={20} weight="duotone" />, label: "Map", matchPrefix: "/admin/map" },
```

- [ ] **Step 4: Add MapTrifold import to AdminBottomNav.tsx**

Open `AdminBottomNav.tsx`. Add `MapTrifold` to its import from `@phosphor-icons/react`.

- [ ] **Step 5: Add Map to sheetItems in AdminBottomNav.tsx**

Find `sheetItems`. After Contacts, before Properties, add:

```typescript
{ href: "/admin/map", label: "Map", icon: <MapTrifold size={19} weight="duotone" />, matchPrefix: "/admin/map" },
```

- [ ] **Step 6: Verify TypeScript compiles**

```bash
cd /Users/johanannunez/workspace/parcel-integrated/apps/web
pnpm exec tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/components/admin/AdminSidebar.tsx \
        apps/web/src/components/admin/AdminBottomNav.tsx
git commit -m "feat(admin/nav): add Map entry to sidebar and bottom nav"
```

---

## Task 11: Strip default Mapbox popup chrome and wire the map layout

The Mapbox `Popup` component adds its own wrapper styles (close button, padding, border, arrow). Remove those so only `MapPopover` content shows.

**Files:**
- Modify: `apps/web/src/app/(admin)/admin/map/AdminMapView.module.css` (add global popup reset)
- Modify: `apps/web/src/app/(admin)/admin/layout.tsx` — verify the map page's `<main>` doesn't overflow

- [ ] **Step 1: Add a global popup CSS reset in AdminMapView.module.css**

Append to the bottom of `AdminMapView.module.css`:

```css
/* Strip Mapbox popup chrome — MapPopover provides all styling */
:global(.global-map-popup .mapboxgl-popup-content) {
  padding: 0;
  border-radius: 12px;
  box-shadow: none;
  background: transparent;
}

:global(.global-map-popup .mapboxgl-popup-tip) {
  display: none;
}
```

- [ ] **Step 2: Verify the admin layout allows full-height content**

The `/admin/map` page renders inside the `<main>` element in `AdminLayout`. That element has `overflow-y: auto` and `pb-20 md:pb-0`. Confirm the map shell fills height by checking that the layout gives the content area `flex: 1` and `overflow: hidden`.

Open `apps/web/src/app/(admin)/admin/layout.tsx` and verify the content wrapper has:

```tsx
<div className="flex min-w-0 flex-1 flex-col overflow-hidden" ...>
```

If it does, no change needed. If it uses `overflow-y: auto` on the outer wrapper, add a check — the map shell's `height: 100%` needs an ancestor with a defined height.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/\(admin\)/admin/map/AdminMapView.module.css
git commit -m "fix(admin/map): strip Mapbox popup default chrome"
```

---

## Task 12: Manual QA pass

- [ ] **Step 1: Start the dev server**

```bash
cd /Users/johanannunez/workspace/parcel-integrated/apps/web
doppler run -- ./node_modules/.bin/next dev -p 4000
```

- [ ] **Step 2: Verify sidebar nav item appears**

Visit `http://localhost:4000/admin`. Confirm "Map" appears between Contacts and Properties in the sidebar.

- [ ] **Step 3: Verify map loads**

Visit `http://localhost:4000/admin/map`. The Mapbox Light map should fill the content area. Layer toggle chips should appear at top-center. No console errors.

- [ ] **Step 4: Verify owner pins appear (if any contacts have home_lat/home_lng)**

If no contacts are geocoded yet, test by manually inserting a row in Supabase:

```sql
UPDATE contacts
SET home_lat = 36.1627, home_lng = -86.7816
WHERE id = (SELECT id FROM contacts LIMIT 1);
```

Reload the map. An owner pin should appear near Nashville.

- [ ] **Step 5: Verify property pins appear**

Properties already have lat/lng from Phase 1. Confirm blue house pins render on the map.

- [ ] **Step 6: Test click interactions**

- Click an owner pin: popover appears, dashed lines draw to their properties (if Properties layer ON).
- Click a property pin: popover appears showing address and owner name.
- Click empty map area: popover closes, lines disappear.
- Click a cluster: map zooms to expand it.

- [ ] **Step 7: Test layer toggles**

Toggle Owners chip: owner pins hide/show. Toggle Properties chip: property pins hide/show. Projects and Tasks chips toggle without error (layers are empty in Phase 1).

- [ ] **Step 8: Test not-mapped chip**

If any contacts have `home_lat IS NULL`, the chip should appear in the bottom-left. Clicking it opens the modal listing them.

- [ ] **Step 9: Take screenshots and verify**

```bash
cd /Users/johanannunez/workspace/parcel-integrated
node screenshot.mjs http://localhost:4000/admin/map map-global
```

Read the screenshot. Confirm: map fills the view, layer chips visible, no layout overflow.

- [ ] **Step 10: Final commit**

```bash
git add -A
git commit -m "feat(admin/map): global command-center map Phase 1 complete"
```

---

## Self-Review Checklist

- Schema migration: `home_lat`/`home_lng` on contacts. ✓ Task 1
- Geocoding utility (server-only). ✓ Task 2
- Geocoding hooked into `saveAccount`. ✓ Task 3
- Server component parallel queries (owners + properties + unmapped). ✓ Tasks 4, 9
- LayerToggleBar with 4 chips, default ON/OFF state. ✓ Task 5
- MapPopover shared shell. ✓ Task 6
- NotMappedChip + modal. ✓ Task 7
- AdminMapView: owner clusters, property clusters, pin rendering, click handlers. ✓ Task 8
- Dashed SVG connecting lines (owner-to-property on click). ✓ Task 8
- Drive time labels via Mapbox Directions API (lazy, cached). ✓ Task 8
- Sidebar nav item (full sidebar + icon rail + bottom sheet). ✓ Task 10
- Mapbox popup chrome stripped. ✓ Task 11
- QA pass. ✓ Task 12
