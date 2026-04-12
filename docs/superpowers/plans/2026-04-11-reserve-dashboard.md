# Reserve Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a premium landing dashboard at `/portal/reserve` and move the existing reservation form to `/portal/reserve/new`.

**Architecture:** The existing `page.tsx` data-fetching logic splits across two routes. The dashboard page runs the same Supabase queries, derives stats server-side (pending count, completed count, next stay, days-away countdown), and renders purely as a React Server Component. The form page is a straight file move with one import path fix. No new database tables, no new shared utilities, no client components needed for the dashboard.

**Tech Stack:** Next.js 15 App Router, React Server Components, Supabase SSR client, Tailwind v4, `@phosphor-icons/react`, TypeScript strict.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `apps/web/src/app/(portal)/portal/reserve/page.tsx` | **Rewrite** | Dashboard: banner, stats, next stay, flat reservations list |
| `apps/web/src/app/(portal)/portal/reserve/new/page.tsx` | **Create** | Copy of the current `page.tsx` — form + `MyReservationsList` |
| All other files in `/reserve/` | **Unchanged** | `ReserveForm`, `ReserveSummary`, `MyReservationsList`, `BlockDetailModal`, `actions.ts`, `types.ts` |

---

## Task 1: Create the form route at `/portal/reserve/new`

**Files:**
- Create: `apps/web/src/app/(portal)/portal/reserve/new/page.tsx`

- [ ] **Step 1: Create the new directory and copy the existing page**

Run:
```bash
mkdir -p /Users/johanannunez/workspace/parcel/apps/web/src/app/\(portal\)/portal/reserve/new
cp /Users/johanannunez/workspace/parcel/apps/web/src/app/\(portal\)/portal/reserve/page.tsx \
   /Users/johanannunez/workspace/parcel/apps/web/src/app/\(portal\)/portal/reserve/new/page.tsx
```

- [ ] **Step 2: Update the metadata and component name in the new file**

Open `apps/web/src/app/(portal)/portal/reserve/new/page.tsx`. The imports use relative paths like `"./ReserveForm"` — these must become `"../ReserveForm"` since the file is now one level deeper.

Replace the entire file with the following (identical logic, updated relative imports and metadata title):

```tsx
import type { Metadata } from "next";
import { CalendarBlank } from "@phosphor-icons/react/dist/ssr";
import { getPortalContext } from "@/lib/portal-context";
import { normalizeUnit } from "@/lib/address";
import { EmptyState } from "@/components/portal/EmptyState";
import { ReserveForm } from "../ReserveForm";
import { MyReservationsList } from "../MyReservationsList";
import type { BlockRequest, ReserveProperty } from "../types";

export const metadata: Metadata = { title: "New Reservation" };
export const dynamic = "force-dynamic";

export default async function NewReservationPage() {
  const { userId, client, ownerProfile, isImpersonating } = await getPortalContext();

  const [
    { data: properties },
    { data: profile },
    { data: rules },
    requestsResult,
  ] = await Promise.all([
    client
      .from("properties")
      .select(
        "id, address_line1, address_line2, city, state, postal_code, bedrooms",
      )
      .eq("owner_id", userId)
      .order("created_at", { ascending: true }),
    client
      .from("profiles")
      .select("full_name, phone, email, avatar_url")
      .eq("id", userId)
      .single(),
    client
      .from("property_rules")
      .select("property_id, pets_allowed, pet_fee, cleaning_fee"),
    client
      .from("block_requests")
      .select(
        "id, property_id, start_date, end_date, status, note, created_at, check_in_time, check_out_time, reason, is_owner_staying, guest_name, guest_email, guest_phone, adults, children, pets, needs_lock_code, requested_lock_code, wants_cleaning, cleaning_fee, damage_acknowledged",
      )
      .eq("owner_id", userId)
      .order("created_at", { ascending: false })
      .limit(40),
  ]);

  const rulesByProperty = new Map<
    string,
    {
      pets_allowed: boolean | null;
      pet_fee: number | null;
      cleaning_fee: number | null;
    }
  >();
  (rules ?? []).forEach((r) => {
    rulesByProperty.set(r.property_id, {
      pets_allowed: r.pets_allowed,
      pet_fee: r.pet_fee ? Number(r.pet_fee) : null,
      cleaning_fee: r.cleaning_fee ? Number(r.cleaning_fee) : null,
    });
  });

  const propertyList: ReserveProperty[] = (properties ?? []).map((p) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawUnit = (p as any).address_line2 as string | null | undefined;
    const unit = rawUnit ? normalizeUnit(rawUnit) : null;
    const name = p.address_line1?.trim() || "Property";
    const address = [p.city, p.state, p.postal_code]
      .filter(Boolean)
      .join(", ");
    const rule = rulesByProperty.get(p.id) ?? null;
    return {
      id: p.id,
      name,
      unit,
      address,
      bedrooms: (p as { bedrooms?: number | null }).bedrooms ?? null,
      petsAllowed: rule?.pets_allowed ?? null,
      cleaningFee: rule?.cleaning_fee ?? null,
      petFee: rule?.pet_fee ?? null,
    };
  });

  const hasProperties = propertyList.length > 0;
  const fullName =
    profile?.full_name?.trim() ||
    (profile as { email?: string | null })?.email?.split("@")[0] ||
    "Owner";
  const ownerEmail =
    (profile as { email?: string | null })?.email ??
    (isImpersonating ? (ownerProfile?.email ?? "") : "");
  const ownerAvatarUrl =
    (profile as { avatar_url?: string | null })?.avatar_url ?? null;

  const requests: BlockRequest[] = (requestsResult.data ?? []).map((r) => ({
    id: r.id,
    property_id: r.property_id,
    start_date: r.start_date,
    end_date: r.end_date,
    status: r.status as BlockRequest["status"],
    note: r.note,
    created_at: r.created_at,
    check_in_time: r.check_in_time,
    check_out_time: r.check_out_time,
    reason: r.reason,
    is_owner_staying: r.is_owner_staying ?? true,
    guest_name: r.guest_name,
    guest_email: r.guest_email,
    guest_phone: r.guest_phone,
    adults: r.adults ?? 1,
    children: r.children ?? 0,
    pets: r.pets ?? 0,
    needs_lock_code: r.needs_lock_code ?? false,
    requested_lock_code: r.requested_lock_code,
    wants_cleaning: r.wants_cleaning ?? false,
    cleaning_fee: r.cleaning_fee ? Number(r.cleaning_fee) : null,
    damage_acknowledged: r.damage_acknowledged ?? false,
  }));

  if (!hasProperties) {
    return (
      <div className="flex flex-col gap-4">
        <EmptyState
          icon={<CalendarBlank size={26} weight="duotone" />}
          title="Reserve unlocks with your first property"
          body="Add a home and you'll be able to reserve time in it right here."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-12 pb-12">
      <ReserveForm
        properties={propertyList}
        ownerName={fullName}
        ownerEmail={ownerEmail}
        ownerPhone={(profile as { phone?: string | null })?.phone ?? ""}
        ownerAvatarUrl={ownerAvatarUrl}
      />

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2
            className="text-[11px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            Your reservations
          </h2>
          <p
            className="text-[13px]"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Every block you&apos;ve sent, grouped by status.
          </p>
        </div>
        <MyReservationsList
          requests={requests}
          properties={propertyList.map((p) => ({ id: p.id, name: p.name }))}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify the new route renders**

Run the dev server if not already running:
```bash
pnpm --filter web dev
```

Navigate to `http://localhost:4000/portal/reserve/new`. It should render exactly as `/portal/reserve` does today — property dropdown, form, and reservations list below.

- [ ] **Step 4: Commit**

```bash
cd /Users/johanannunez/workspace/parcel
git add apps/web/src/app/\(portal\)/portal/reserve/new/page.tsx
git commit -m "feat(reserve): add /portal/reserve/new route for reservation form"
```

---

## Task 2: Rewrite `/portal/reserve/page.tsx` as the dashboard

**Files:**
- Modify: `apps/web/src/app/(portal)/portal/reserve/page.tsx`

The dashboard needs these derived values computed on the server from `block_requests`:

- `pendingCount` — rows where `status === "pending"`
- `completedCount` — rows where `status === "approved"` AND `end_date < today` (ISO string compare)
- `nextStay` — first row where `status === "approved"` AND `start_date >= today`, sorted by `start_date` ascending
- `daysAway` — `Math.ceil((new Date(nextStay.start_date + "T00:00:00") - now) / 86_400_000)`
- `recentList` — all rows sorted by `created_at` descending, capped at 20, used for the flat status list at the bottom

For the next stay card, the property `name` and `unit` are needed. Build a quick property lookup map from the properties query (same query as today).

The flat reservations list shows: property name + unit (in brand blue), date range, stay type label ("Owner staying" / "Guest staying"), and a status pill. The status pill colors match the existing `blockStatusVisual` map in `src/lib/labels.ts` — import it.

- [ ] **Step 1: Rewrite `apps/web/src/app/(portal)/portal/reserve/page.tsx`**

Replace the entire file:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { CalendarBlank, CalendarCheck, CheckCircle, Clock } from "@phosphor-icons/react/dist/ssr";
import { getPortalContext } from "@/lib/portal-context";
import { normalizeUnit } from "@/lib/address";
import { EmptyState } from "@/components/portal/EmptyState";
import { blockStatusVisual, labelForBlockStatus } from "@/lib/labels";
import type { BlockRequestStatus } from "./types";

export const metadata: Metadata = { title: "Reserve" };
export const dynamic = "force-dynamic";

// ── Helpers ────────────────────────────────────────────────────────

function formatDateRange(start: string, end: string): string {
  const s = new Date(`${start}T00:00:00`);
  const e = new Date(`${end}T00:00:00`);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const yearOpts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };
  const sameYear = s.getFullYear() === e.getFullYear();
  if (sameYear) {
    return `${s.toLocaleDateString("en-US", opts)} \u2013 ${e.toLocaleDateString("en-US", yearOpts)}`;
  }
  return `${s.toLocaleDateString("en-US", yearOpts)} \u2013 ${e.toLocaleDateString("en-US", yearOpts)}`;
}

function formatTime(raw: string | null): string {
  if (!raw) return "";
  // raw is "HH:MM" 24h. Convert to 12h display.
  const [hStr, mStr] = raw.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const suffix = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

// ── Page ───────────────────────────────────────────────────────────

export default async function ReserveDashboardPage() {
  const { userId, client } = await getPortalContext();

  const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
  const now = new Date();

  const [{ data: properties }, requestsResult] = await Promise.all([
    client
      .from("properties")
      .select("id, address_line1, address_line2, city, state, postal_code")
      .eq("owner_id", userId)
      .order("created_at", { ascending: true }),
    client
      .from("block_requests")
      .select(
        "id, property_id, start_date, end_date, status, created_at, check_in_time, check_out_time, is_owner_staying, adults, children",
      )
      .eq("owner_id", userId)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const hasProperties = (properties ?? []).length > 0;

  if (!hasProperties) {
    return (
      <div className="flex flex-col gap-4">
        <EmptyState
          icon={<CalendarBlank size={26} weight="duotone" />}
          title="Reserve unlocks with your first property"
          body="Add a home and you'll be able to reserve time in it right here."
        />
      </div>
    );
  }

  // Build property lookup: id → { name, unit }
  const propMap = new Map<string, { name: string; unit: string | null }>();
  (properties ?? []).forEach((p) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawUnit = (p as any).address_line2 as string | null | undefined;
    propMap.set(p.id, {
      name: p.address_line1?.trim() || "Property",
      unit: rawUnit ? normalizeUnit(rawUnit) : null,
    });
  });

  const requests = requestsResult.data ?? [];

  // ── Derived stats ──
  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const completedCount = requests.filter(
    (r) => r.status === "approved" && r.end_date < today,
  ).length;

  // Next stay: soonest approved block starting today or later
  const nextStay = requests
    .filter((r) => r.status === "approved" && r.start_date >= today)
    .sort((a, b) => a.start_date.localeCompare(b.start_date))[0] ?? null;

  const daysAway = nextStay
    ? Math.max(
        0,
        Math.ceil(
          (new Date(`${nextStay.start_date}T00:00:00`).getTime() - now.getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      )
    : null;

  // Recent list: up to 20 rows, most recent first
  const recentList = requests.slice(0, 20);

  const nextProp = nextStay ? (propMap.get(nextStay.property_id) ?? null) : null;
  const checkInFormatted = nextStay ? formatTime(nextStay.check_in_time) : null;
  const checkOutFormatted = nextStay ? formatTime(nextStay.check_out_time) : null;
  const guestCount = nextStay
    ? (nextStay.adults ?? 1) + (nextStay.children ?? 0)
    : 0;

  return (
    <div className="flex flex-col gap-4 pb-12">

      {/* ── CTA Banner ── */}
      <div
        className="relative overflow-hidden rounded-[18px] p-7 flex items-center justify-between gap-6"
        style={{
          background: "linear-gradient(130deg, #1B77BE 0%, #02AAEB 60%, #38c8ff 100%)",
        }}
      >
        {/* Decorative circles */}
        <span
          className="pointer-events-none absolute"
          style={{
            top: "-40px",
            right: "-40px",
            width: "200px",
            height: "200px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.07)",
          }}
        />
        <span
          className="pointer-events-none absolute"
          style={{
            bottom: "-60px",
            left: "30%",
            width: "240px",
            height: "240px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
          }}
        />

        <div className="relative z-10">
          <p
            className="text-[10px] font-bold uppercase tracking-[0.16em] mb-1.5"
            style={{ color: "rgba(255,255,255,0.65)" }}
          >
            Owner stays &amp; holds
          </p>
          <p className="text-[22px] font-bold text-white leading-tight mb-1.5">
            Reserve time in your home
          </p>
          <p className="text-[13px]" style={{ color: "rgba(255,255,255,0.75)" }}>
            Pick your dates and we&apos;ll check for conflicts.
          </p>
        </div>

        <Link
          href="/portal/reserve/new"
          className="relative z-10 shrink-0 rounded-xl px-6 py-3.5 text-sm font-bold text-[#1B77BE] bg-white whitespace-nowrap transition-opacity hover:opacity-90"
          style={{ boxShadow: "0 4px 14px rgba(0,0,0,0.18)" }}
        >
          + New reservation
        </Link>
      </div>

      {/* ── Stat modules ── */}
      <div className="grid grid-cols-2 gap-3">

        {/* Under review */}
        <div
          className="flex items-center gap-4 rounded-2xl border p-[18px]"
          style={{
            backgroundColor: "var(--color-white)",
            borderColor: "var(--color-warm-gray-200)",
          }}
        >
          <span
            className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[11px] text-xl"
            style={{ background: "rgba(251,191,36,0.12)" }}
          >
            <Clock size={20} weight="duotone" style={{ color: "#b45309" }} />
          </span>
          <div>
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.1em] mb-0.5"
              style={{ color: "#aaa" }}
            >
              Under review
            </p>
            <p
              className="text-[26px] font-bold leading-none"
              style={{ color: "var(--color-text-primary)" }}
            >
              {pendingCount}
            </p>
            <p className="text-[11px] mt-1" style={{ color: "#aaa" }}>
              Waiting for conflict check
            </p>
          </div>
        </div>

        {/* Completed stays */}
        <div
          className="flex items-center gap-4 rounded-2xl border p-[18px]"
          style={{
            backgroundColor: "var(--color-white)",
            borderColor: "var(--color-warm-gray-200)",
          }}
        >
          <span
            className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[11px]"
            style={{ background: "rgba(34,197,94,0.10)" }}
          >
            <CheckCircle size={20} weight="duotone" style={{ color: "#15803d" }} />
          </span>
          <div>
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.1em] mb-0.5"
              style={{ color: "#aaa" }}
            >
              Completed stays
            </p>
            <p
              className="text-[26px] font-bold leading-none"
              style={{ color: "var(--color-text-primary)" }}
            >
              {completedCount}
            </p>
            <p className="text-[11px] mt-1" style={{ color: "#aaa" }}>
              All time
            </p>
          </div>
        </div>
      </div>

      {/* ── Next Stay ── */}
      {nextStay && nextProp ? (
        <div
          className="rounded-2xl border overflow-hidden"
          style={{
            backgroundColor: "var(--color-white)",
            borderColor: "var(--color-warm-gray-200)",
          }}
        >
          <div
            className="flex items-center justify-between px-5 py-3.5 border-b"
            style={{ borderColor: "var(--color-warm-gray-100)" }}
          >
            <span
              className="text-[10px] font-bold uppercase tracking-[0.14em]"
              style={{ color: "#aaa" }}
            >
              Next stay
            </span>
            <span
              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
              style={{
                backgroundColor: "rgba(34,197,94,0.10)",
                color: "#15803d",
              }}
            >
              Confirmed
            </span>
          </div>

          <div className="flex items-start justify-between gap-5 px-5 py-[18px]">
            <div>
              <p
                className="text-base font-bold mb-0.5"
                style={{ color: "var(--color-text-primary)" }}
              >
                {nextProp.name}
                {nextProp.unit ? (
                  <span
                    className="text-[13px] font-semibold ml-1.5"
                    style={{ color: "var(--color-brand)" }}
                  >
                    {nextProp.unit}
                  </span>
                ) : null}
              </p>

              <div className="flex gap-5 mt-3">
                {checkInFormatted ? (
                  <div className="flex flex-col gap-0.5">
                    <span
                      className="text-[10px] font-bold uppercase tracking-[0.1em]"
                      style={{ color: "#bbb" }}
                    >
                      Check-in
                    </span>
                    <span
                      className="text-[13px] font-semibold"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {new Date(`${nextStay.start_date}T00:00:00`).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      &middot; {checkInFormatted}
                    </span>
                  </div>
                ) : null}

                {checkOutFormatted ? (
                  <div className="flex flex-col gap-0.5">
                    <span
                      className="text-[10px] font-bold uppercase tracking-[0.1em]"
                      style={{ color: "#bbb" }}
                    >
                      Check-out
                    </span>
                    <span
                      className="text-[13px] font-semibold"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {new Date(`${nextStay.end_date}T00:00:00`).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      &middot; {checkOutFormatted}
                    </span>
                  </div>
                ) : null}

                {guestCount > 0 ? (
                  <div className="flex flex-col gap-0.5">
                    <span
                      className="text-[10px] font-bold uppercase tracking-[0.1em]"
                      style={{ color: "#bbb" }}
                    >
                      Guests
                    </span>
                    <span
                      className="text-[13px] font-semibold"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {guestCount} {guestCount === 1 ? "adult" : "adults"}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Countdown bubble */}
            {daysAway !== null ? (
              <div
                className="shrink-0 rounded-xl px-[18px] py-3 text-center min-w-[80px]"
                style={{
                  background: "linear-gradient(135deg, rgba(2,170,235,0.08), rgba(27,119,190,0.05))",
                  border: "1px solid rgba(2,170,235,0.18)",
                }}
              >
                <p
                  className="text-[32px] font-extrabold leading-none"
                  style={{ color: "var(--color-brand)" }}
                >
                  {daysAway}
                </p>
                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.1em] mt-1"
                  style={{ color: "#888" }}
                >
                  {daysAway === 1 ? "day away" : "days away"}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* ── Reservations list ── */}
      {recentList.length > 0 ? (
        <div
          className="rounded-2xl border overflow-hidden"
          style={{
            backgroundColor: "var(--color-white)",
            borderColor: "var(--color-warm-gray-200)",
          }}
        >
          <div
            className="flex items-center justify-between px-5 py-3.5 border-b"
            style={{ borderColor: "var(--color-warm-gray-100)" }}
          >
            <span
              className="text-[10px] font-bold uppercase tracking-[0.14em]"
              style={{ color: "#aaa" }}
            >
              All reservations
            </span>
            <span className="text-[11px]" style={{ color: "#aaa" }}>
              Most recent first
            </span>
          </div>

          {recentList.map((r) => {
            const prop = propMap.get(r.property_id) ?? { name: "Property", unit: null };
            const status = r.status as BlockRequestStatus;
            const visual = blockStatusVisual[status] ?? blockStatusVisual.pending;
            const label = labelForBlockStatus(status);
            const stayType = r.is_owner_staying ? "Owner staying" : "Guest staying";

            return (
              <div
                key={r.id}
                className="flex items-center justify-between px-5 py-3.5 border-b last:border-b-0"
                style={{ borderColor: "var(--color-warm-gray-50)" }}
              >
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span
                      className="text-[13px] font-semibold"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {prop.name}
                    </span>
                    {prop.unit ? (
                      <span
                        className="text-[11px] font-semibold"
                        style={{ color: "var(--color-brand)" }}
                      >
                        {prop.unit}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-[11px] mt-0.5" style={{ color: "#aaa" }}>
                    {formatDateRange(r.start_date, r.end_date)} &middot; {stayType}
                  </p>
                </div>
                <span
                  className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap"
                  style={{ backgroundColor: visual.bg, color: visual.fg }}
                >
                  {label}
                </span>
              </div>
            );
          })}

          <Link
            href="/portal/reserve/new"
            className="block px-5 py-3 text-center text-[12px] font-semibold transition-colors hover:opacity-80"
            style={{ color: "var(--color-brand)" }}
          >
            + New reservation
          </Link>
        </div>
      ) : null}

    </div>
  );
}
```

- [ ] **Step 2: Verify `blockStatusVisual` exists in `src/lib/labels.ts`**

Run:
```bash
grep -n "blockStatusVisual" /Users/johanannunez/workspace/parcel/apps/web/src/lib/labels.ts
```

Expected output contains a line like `export const blockStatusVisual`. If the grep returns nothing, read the file and use whatever the correct export name is.

- [ ] **Step 3: Run TypeScript check**

```bash
cd /Users/johanannunez/workspace/parcel
pnpm --filter web exec tsc --noEmit
```

Expected: 0 errors. If errors appear, they will reference the new `page.tsx`. Common fixes:
- If `blockStatusVisual` or `labelForBlockStatus` has a different import path, update the import.
- If `is_owner_staying` is not in the Supabase select type, add `// eslint-disable-next-line @typescript-eslint/no-explicit-any` and cast as needed.

- [ ] **Step 4: Navigate to the dashboard in the browser**

With dev server running, visit `http://localhost:4000/portal/reserve`.

Verify:
1. Blue gradient CTA banner renders with "+ New reservation" button.
2. Two stat cards render side by side (pending count, completed count).
3. If there is an upcoming approved reservation, the "Next Stay" card appears with a countdown number.
4. The reservations list shows property name + dates + status pill.
5. Clicking "+ New reservation" (banner or list footer link) navigates to `/portal/reserve/new` and the form renders.
6. `/portal/reserve/new` still shows the form and the `MyReservationsList` accordion below it.

- [ ] **Step 5: Take a screenshot**

```bash
cd /Users/johanannunez/workspace/parcel
node screenshot.mjs http://localhost:4000/portal/reserve reserve-dashboard --theme light
```

Read the screenshot. Verify the banner fills the width with the gradient, the stat cards are equal width side by side, the "Next Stay" countdown bubble is visible and right-aligned if a next stay exists.

- [ ] **Step 6: Commit**

```bash
cd /Users/johanannunez/workspace/parcel
git add apps/web/src/app/\(portal\)/portal/reserve/page.tsx
git commit -m "feat(reserve): add reserve dashboard with CTA, stats, next stay, and list"
```

---

## Task 3: Empty-state polish for owners with no reservations yet

**Files:**
- Modify: `apps/web/src/app/(portal)/portal/reserve/page.tsx`

If `recentList.length === 0` (owner has properties but no reservations yet), the current code renders the banner and stat modules (0 / 0) but the list section is hidden. That is fine. No separate empty state needed — the banner CTA is the right call to action.

However, if the owner has no *upcoming* stay, the "Next Stay" card is hidden (by the `nextStay && nextProp` guard). When the list is non-empty but there is no upcoming stay, show a small teaser beneath the stat modules instead:

- [ ] **Step 1: Add the "no upcoming stay" teaser after the stat modules**

In `page.tsx`, after the closing `</div>` of the stat modules grid and before the `{nextStay && nextProp ? (` block, add:

```tsx
{/* No upcoming stay hint — show only when there are past/pending requests but nothing upcoming */}
{!nextStay && recentList.length > 0 ? (
  <div
    className="flex items-center gap-3 rounded-2xl border px-5 py-4"
    style={{
      backgroundColor: "rgba(2,170,235,0.04)",
      borderColor: "rgba(2,170,235,0.15)",
    }}
  >
    <CalendarCheck
      size={18}
      weight="duotone"
      style={{ color: "var(--color-brand)", flexShrink: 0 }}
    />
    <p className="text-[13px]" style={{ color: "var(--color-text-secondary)" }}>
      No upcoming stays.{" "}
      <Link
        href="/portal/reserve/new"
        className="font-semibold"
        style={{ color: "var(--color-brand)" }}
      >
        Reserve your next visit.
      </Link>
    </p>
  </div>
) : null}
```

- [ ] **Step 2: TypeScript check**

```bash
pnpm --filter web exec tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/johanannunez/workspace/parcel
git add apps/web/src/app/\(portal\)/portal/reserve/page.tsx
git commit -m "feat(reserve): add no-upcoming-stay teaser on dashboard"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|---|---|
| CTA banner — gradient, eyebrow, heading, sub, button | Task 2 step 1 |
| Pending count stat module | Task 2 step 1 |
| Completed count stat module | Task 2 step 1 |
| Next stay card — property name + unit in blue | Task 2 step 1 |
| Next stay card — check-in/out times | Task 2 step 1 |
| Next stay card — guests count | Task 2 step 1 |
| Next stay card — days-away countdown | Task 2 step 1 |
| Next stay hidden when no upcoming stay | Task 2 step 1 (guard) + Task 3 |
| Flat reservations list with status pills | Task 2 step 1 |
| Routing: `/portal/reserve` = dashboard, `/portal/reserve/new` = form | Task 1 + Task 2 |
| Sidebar still points to `/portal/reserve` | No change needed — already correct |

No gaps found.

**Placeholder scan:** No TBD, no TODO, all code is complete.

**Type consistency:** `BlockRequestStatus` imported from `./types` in both files. `blockStatusVisual` and `labelForBlockStatus` imported from `@/lib/labels` consistently. `normalizeUnit` from `@/lib/address`. All match existing usage patterns in the codebase.
