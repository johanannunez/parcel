# Timeline Improvement Plan

Built for The Parcel Company owner portal and admin panel. References actual tables, columns, pages, and server actions in the `parcel` monorepo.

---

## 1. Automatic Event Capture

**Why it matters:** Right now every timeline entry is created manually through the admin "Add entry" form. That means Johan has to remember to log events, which he will not do consistently at scale. Automatic capture turns the timeline into a living record of the owner relationship, builds trust ("they really keep track of everything"), and gives admin a complete audit trail without extra work.

### Events to capture automatically

Each event below maps to an existing table or server action. The "trigger point" column tells you exactly where in the code to insert the timeline write.

#### Account events (category: `account`)

| Event | Title template | Trigger point | Metadata to store |
|---|---|---|---|
| Owner signed up | "Welcome to Parcel" | `apps/web/src/app/(marketing)/signup/actions.ts` after successful signup, or via a Supabase database trigger on `profiles` INSERT | `{ email }` |
| Onboarding completed | "Onboarding complete" | `apps/web/src/app/(portal)/portal/setup/review/actions.ts` when the final step submits | `{ property_id, steps_completed }` |
| Profile updated | "Profile updated" | `apps/web/src/app/(portal)/portal/account/actions.ts` on save | `{ fields_changed: ["phone", "full_name"] }` |
| Password reset | "Password was reset" | `apps/web/src/app/(marketing)/reset-password/actions.ts` on success | `{}` |

#### Property events (category: `property`)

| Event | Title template | Trigger point | Metadata to store |
|---|---|---|---|
| Property added | "New property: {address_line1}" | `apps/web/src/app/(portal)/portal/properties/actions.ts` or `portal/onboarding/property/actions.ts` after INSERT into `properties` | `{ property_id, property_type, city, state }` |
| Property details updated | "Property updated: {address_line1}" | Admin properties actions at `apps/web/src/app/(admin)/admin/properties/actions.ts` on UPDATE | `{ property_id, fields_changed }` |
| Property deactivated | "Property deactivated: {address_line1}" | When `properties.active` flips to `false` | `{ property_id, reason }` |
| Property reactivated | "Property reactivated" | When `properties.active` flips to `true` | `{ property_id }` |

#### Financial events (category: `financial`)

| Event | Title template | Trigger point | Metadata to store |
|---|---|---|---|
| Payout issued | "Payout of ${net_payout} for {period}" | After INSERT into `payouts` table (admin action or future automation) | `{ payout_id, property_id, net_payout, period_start, period_end }` |
| Payout marked paid | "Payout of ${net_payout} marked as paid" | When `payouts.paid_at` is set | `{ payout_id, property_id, net_payout }` |
| Reserve contribution | "Reserve fund contribution" | `apps/web/src/app/(portal)/portal/reserve/actions.ts` | `{ amount, property_id }` |

#### Calendar events (category: `calendar`)

| Event | Title template | Trigger point | Metadata to store |
|---|---|---|---|
| New booking | "New booking: {guest_name}, {check_in} to {check_out}" | After INSERT into `bookings` table | `{ booking_id, property_id, source, guest_name, check_in, check_out, total_amount }` |
| Booking cancelled | "Booking cancelled: {guest_name}" | When `bookings.status` changes to `cancelled` | `{ booking_id, property_id, guest_name }` |
| Block request submitted | "Block request for {dates}" | After INSERT into `block_requests` | `{ block_request_id, property_id, start_date, end_date, reason }` |
| Block request approved | "Block request approved" | Admin action on `block_requests` | `{ block_request_id, property_id }` |
| Block request denied | "Block request denied" | Admin action on `block_requests` | `{ block_request_id, property_id, denial_reason }` |

#### Document events (category: `document`)

| Event | Title template | Trigger point | Metadata to store |
|---|---|---|---|
| Document uploaded | "New document: {filename}" | Future Supabase Storage upload hook or portal documents action | `{ document_name, document_type, property_id }` |
| Agreement signed | "Management agreement signed" | BoldSign webhook or manual admin action | `{ agreement_type, property_id }` |

#### Communication events (category: `communication`)

| Event | Title template | Trigger point | Metadata to store |
|---|---|---|---|
| Message sent | "New message from {sender_name}" | `apps/web/src/app/(portal)/portal/messages/actions.ts` or `apps/web/src/app/(admin)/admin/messages/actions.ts` after INSERT into `messages` | `{ conversation_id, sender_id, preview }` |
| Inquiry received | "New inquiry from {full_name}" | `apps/web/src/app/api/inquiries/route.ts` after INSERT into `inquiries` | `{ inquiry_id, email, property_address }` |

### Implementation options

**Option A: Inline in server actions (Recommended)**
Create a shared helper function `logTimelineEvent(params)` in `apps/web/src/lib/timeline.ts`. Call it from each server action after the primary database write succeeds. Uses the existing service client to bypass RLS.

- Pros: Simple, no new infrastructure, runs in the same request so you know the context (who did it, what changed).
- Cons: You have to add the call to every action manually. If you forget one, it is not logged.
- Complexity: Medium (half day to wire up all existing actions, then ongoing discipline for new ones).

**Option B: Supabase database triggers**
Write Postgres trigger functions that INSERT into `owner_timeline` whenever rows are inserted or updated in `bookings`, `payouts`, `block_requests`, `messages`, etc.

- Pros: Never miss an event. Works even if someone writes directly to the database.
- Cons: Trigger functions run inside the transaction, adding latency. Harder to debug. The trigger does not have access to the HTTP request context (who is the admin, what page are they on). Harder to write good human-readable titles.
- Complexity: High (full day+).

**Option C: Hybrid approach**
Use inline calls (Option A) for events where context matters (who did it, what form they filled out). Use database triggers only for external/automated events like booking syncs from Hospitable where there is no server action to hook into.

- Pros: Best of both worlds.
- Cons: Two patterns to maintain.
- Complexity: High (full day+).

**(Recommended): Option A.** At your current scale (one admin, handful of owners), inline calls are the right move. You control every server action already. A single `logTimelineEvent` helper keeps it consistent. Move to Option C later only when you add Hospitable booking sync or other external data pipelines.

---

## 2. Real-Time Updates

**Why it matters:** Property owners checking their portal want to see new entries appear without refreshing. When Johan posts a milestone from admin ("First payout sent!"), the owner should see it land in their timeline within seconds. This is the "alive" feeling that separates premium from static.

### How it works with Supabase Realtime

Supabase Realtime can broadcast Postgres changes over WebSocket channels. You subscribe to `INSERT` events on the `owner_timeline` table, filtered by `owner_id`.

### Options

**Option A: Supabase Realtime subscription on the portal TimelineView (Recommended)**
Add a `useEffect` in `TimelineView.tsx` that opens a Supabase Realtime channel:
```
supabase.channel('timeline').on('postgres_changes', {
  event: 'INSERT',
  schema: 'public',
  table: 'owner_timeline',
  filter: `owner_id=eq.${userId}`
}, handleNewEntry).subscribe()
```
When a new entry arrives, prepend it to the local state with an animation. Use `motion`'s `AnimatePresence` to slide the new entry in from the top with a brief glow highlight (a subtle blue border pulse that fades after 2 seconds).

- Pros: Uses what you already have. No new dependencies. Supabase Realtime is included in the free tier.
- Cons: Requires passing the Supabase client to the client component (you already do this for messages). The `TimelineView` needs to become aware of new entries arriving outside the initial server render.
- Complexity: Medium (half day).

**Option B: Polling with router.refresh()**
Set a 30-second interval that calls Next.js `router.refresh()` to re-fetch the server component data.

- Pros: Dead simple. No Realtime setup.
- Cons: Not instant. 30-second delay feels sluggish. Wastes bandwidth re-fetching everything.
- Complexity: Low (1-2 hours).

**Option C: Full Realtime for both portal and admin**
Same as Option A but also add it to `AdminTimelineView.tsx`. When any owner gets a new entry or an admin creates one, all open admin timeline pages update instantly.

- Pros: Admin sees the feed update live too. Premium multi-user feel.
- Cons: More subscriptions to manage. Admin channel needs broader access (no owner_id filter, just listen to all inserts).
- Complexity: Medium (half day, builds on Option A).

**(Recommended): Option A first, then expand to Option C.** Get the owner-facing Realtime working and feeling great. Then add admin Realtime. The animation should be: new entry fades in with `opacity: 0, y: -12` to `opacity: 1, y: 0` over 300ms with spring physics, plus a 2-second blue border highlight that fades out.

### Dependencies
- Requires the Supabase client to be accessible in the client component. The pattern already exists in `apps/web/src/lib/supabase/client.ts`.
- Supabase Realtime must have the `owner_timeline` table's publication enabled. Run: `ALTER PUBLICATION supabase_realtime ADD TABLE public.owner_timeline;`

---

## 3. Notification Integration

**Why it matters:** The `notifications` table already exists with `owner_id`, `type`, `title`, `body`, `link`, `read`, and `created_at`. The portal has a `/portal/notifications` page. Connecting timeline entries to notifications means owners get proactive alerts about important events, not just a passive feed they have to go check.

### Which timeline entries should generate notifications?

Not all of them. Internal admin notes and routine logging should stay silent. The rule: **notify when the owner should take action or celebrate.**

| Timeline category | Generate notification? | Send email? | Reasoning |
|---|---|---|---|
| `account` (welcome, onboarding) | Yes | Yes for welcome only | Owner needs to know their account status |
| `property` (added, updated) | Yes | No | They just did it themselves, or admin updated something they should see |
| `financial` (payout issued, paid) | Yes | Yes | Money. Always notify about money. |
| `calendar` (new booking) | Yes | Yes | Owners love seeing bookings come in |
| `calendar` (block request status) | Yes | No | They submitted it, they want the answer |
| `document` (uploaded, signed) | Yes | Yes for agreements | Legal documents are important |
| `communication` (new message) | No | No | The messages page already has its own notification system |
| Admin-only entries (`visibility: admin_only`) | Never | Never | Owner cannot see these |

### Options

**Option A: Dual-write in the `logTimelineEvent` helper (Recommended)**
When `logTimelineEvent` is called, check a config map that says whether that event type should also create a notification. If yes, INSERT into `notifications` in the same function call. The `link` field points to `/portal/timeline` (or `/portal/financials` for payout events, etc.).

- Pros: Single place to manage. Notification and timeline entry are always in sync. No extra infrastructure.
- Cons: Couples the two systems. If you ever want to send a notification without a timeline entry, you need a separate path.
- Complexity: Low (1-2 hours on top of the `logTimelineEvent` helper).

**Option B: Supabase database trigger on `owner_timeline` INSERT**
A Postgres trigger on `owner_timeline` checks the event_type and visibility, then INSERTs into `notifications` if appropriate.

- Pros: Impossible to forget. Every timeline entry is evaluated.
- Cons: Trigger does not know whether to send email. You would need a separate Edge Function for email. More moving parts.
- Complexity: Medium (half day).

**Option C: Event queue with Supabase Edge Functions**
Timeline INSERT triggers a Supabase database webhook that calls an Edge Function. The Edge Function decides: create notification? Send email via Resend? Both?

- Pros: Clean separation. Email sending does not block the main request. Can add rate limiting, batching (daily digest), etc.
- Cons: Significant new infrastructure. Overkill for current scale.
- Complexity: High (full day+).

**(Recommended): Option A.** At your scale, the dual-write approach is clean and reliable. Expand to Option C only when you need email digests or have enough owners that the inline approach becomes a bottleneck.

### Email specifics
For the events marked "Send email: Yes" above, use Resend (already in the stack) to send a simple transactional email:
- Subject: the timeline entry title
- Body: the timeline entry body + a CTA button linking to the portal
- Template: plain, branded with Parcel blue, no heavy HTML

---

## 4. Advanced Admin Features

**Why it matters:** As the number of owners grows, the admin timeline becomes the central nervous system of the business. Johan needs to find things fast, act on them efficiently, and maintain a clean audit trail. The current implementation handles single-owner scale well, but these features prepare it for 10+ owners.

### 4a. Date range filter

Add two date picker inputs (start date, end date) to the admin filter bar. Filter entries by `created_at` within the range. Use native `<input type="date">` for simplicity, styled to match the existing inputs.

- Complexity: Low (1-2 hours).
- Dependencies: None.

### 4b. Owner filter dropdown

Add a `<select>` dropdown populated from the existing `profiles` list (already passed as `profiles` prop to `AdminTimelineView`). When an owner is selected, filter entries to that `owner_id` only. Include an "All owners" option.

- Complexity: Low (1-2 hours).
- Dependencies: None.

### 4c. Timeline entry templates

Pre-built entries for common milestones that Johan uses repeatedly. Stored as a constant array in the code (not in the database, to keep it simple). Examples:

- "Onboarding complete" (category: account, visibility: owner, is_pinned: true)
- "First booking received" (category: calendar, visibility: owner, is_pinned: true)
- "First payout sent" (category: financial, visibility: owner, is_pinned: true)
- "Property went live on Airbnb" (category: property, visibility: owner, is_pinned: true)
- "Annual review completed" (category: account, visibility: owner)
- "Management agreement signed" (category: document, visibility: owner, is_pinned: true)

When Johan clicks a template in the Add Entry form, it pre-fills the category, title, event_type, visibility, and is_pinned fields. He just picks the owner and property, optionally edits the title, and submits.

**Option A: Template buttons above the form (Recommended)**
Show a row of template chips (styled like the category filter pills) above the Add Entry form. Clicking one pre-fills the form fields. Johan can still edit everything before submitting.

- Complexity: Low (1-2 hours).
- Dependencies: The Add Entry form already exists.

**Option B: Template dropdown inside the form**
Add a "Use template" dropdown as the first field in the form.

- Complexity: Low (1-2 hours).
- Dependencies: Same as above.

**(Recommended): Option A.** Template chips are more visual and faster to scan than a dropdown. Johan sees all options at a glance.

### 4d. Export to CSV

Add an "Export" button next to the "Add entry" button. Exports the currently filtered entries as a CSV file. Columns: date, owner name, owner email, category, title, body, property, visibility, pinned, deleted.

- Complexity: Low (1-2 hours). Generate CSV client-side from the filtered array. Use `Blob` + `URL.createObjectURL` for the download.
- Dependencies: None.

### 4e. Bulk operations

Add checkboxes to each timeline row. When one or more are checked, show a bulk actions bar at the bottom of the screen (fixed position, slides up). Actions: bulk pin/unpin, bulk change visibility, bulk soft delete.

- Complexity: Medium (half day).
- Dependencies: None, but should come after the core features are stable.

### 4f. Scheduled entries (post at future date)

Add an optional "Publish at" datetime field to the Add Entry form. If set, the entry is stored with a `publish_at` column and filtered out of both portal and admin feeds until that datetime passes. A Supabase cron job (via `pg_cron`) or a periodic Edge Function checks for entries past their publish time and "activates" them.

**Option A: `publish_at` column with query filter (Recommended)**
Add `publish_at timestamptz` to `owner_timeline`. Default to `NULL` (publish immediately). The portal query adds `AND (publish_at IS NULL OR publish_at <= now())`. Admin sees all entries but marks scheduled ones with a "Scheduled" badge.

- Pros: No cron job needed. The filtering happens at query time.
- Cons: Notification and Realtime subscription would need to account for future entries.
- Complexity: Medium (half day).

**Option B: Separate `draft_entries` table**
Scheduled entries live in a separate table. A cron job moves them to `owner_timeline` when the time comes.

- Pros: Clean separation.
- Cons: More tables, more complexity, data duplication.
- Complexity: High (full day+).

**(Recommended): Option A.** A single column is cleaner than a separate table, and query-time filtering is reliable.

### 4g. Rich text body

Replace the plain text `<textarea>` with a minimal rich text editor. Support bold, italic, links, and bullet lists. Store as HTML or Markdown in the `body` column. Render with a sanitized HTML renderer on the portal side.

- Complexity: Medium (half day). Use a lightweight editor like Tiptap with a minimal toolbar.
- Dependencies: New dependency (`@tiptap/react` or similar). Consider whether this is worth the bundle size increase.
- Recommendation: **Defer this.** Plain text bodies are fine for now. Add rich text only when you have a concrete need for formatted content.

---

## 5. Owner Experience Enhancements

**Why it matters:** The timeline is where owners feel the relationship with Parcel. A great timeline builds confidence: "They are tracking everything. My property is in good hands." These enhancements make the timeline feel personal, interactive, and worth checking.

### 5a. Entry detail drawer

Clicking a timeline entry card opens a slide-over drawer from the right side. The drawer shows:
- Full title and body (no truncation)
- All metadata rendered as labeled fields
- Property name linked to the property detail page
- Timestamp in full format
- Related entries (see 5b)

**Option A: Sheet/drawer component with AnimatePresence (Recommended)**
Build a `<TimelineDetailDrawer>` that slides in from the right. Use the same motion spring physics as the timeline cards. Close on click-outside or Escape key.

- Pros: Keeps the user on the timeline page. No navigation. Feels premium and immediate.
- Complexity: Medium (half day).

**Option B: Dedicated detail page (`/portal/timeline/[id]`)**
Each entry gets its own page.

- Pros: Shareable URL. Better for SEO (though this is a portal, not public).
- Cons: Feels slow. Navigating away from the feed breaks flow.
- Complexity: Medium (half day).

**(Recommended): Option A.** A drawer is the premium pattern here. Linear, Notion, and Stripe all use drawers for feed item details.

### 5b. Related entries linking

When viewing an entry in the detail drawer, show a "Related" section at the bottom. Related means: entries with the same `property_id`, or entries with the same `event_type` for the same owner, within a 30-day window.

- Complexity: Low (1-2 hours, it is a filtered query from the existing data).
- Dependencies: Requires the detail drawer (5a).

### 5c. Property-scoped timeline

On the property detail page (which already exists in the portal), add a "Timeline" tab or section that shows only entries where `property_id` matches. This gives owners a per-property history.

**Option A: Timeline section on the property detail page (Recommended)**
Add a collapsible "Recent Activity" section at the bottom of the property detail page. Show the 10 most recent entries for that property. Include a "View all" link to `/portal/timeline?property={id}`.

- Pros: Owners see activity in context. No extra navigation.
- Complexity: Low (1-2 hours). Query is a simple filter on the existing `owner_timeline` data.

**Option B: Add a `?property=` query param filter to the timeline page**
The timeline page reads the query param and pre-filters. The property detail page links to it.

- Pros: Reuses the existing page.
- Cons: Less contextual. Owner has to leave the property page.
- Complexity: Low (1-2 hours).

**(Recommended): Both.** Add the "Recent Activity" section on the property page (Option A) AND support the `?property=` filter on the timeline page (Option B). The property page section is the entry point; the filtered timeline page is the full view.

### 5d. Milestone celebrations

When a pinned milestone entry appears for the first time (via Realtime or on first page load after it was created), play a subtle celebration animation. Not confetti, that is overdone. Instead:

- The pinned card gets a brief golden shimmer effect (a CSS gradient animation that sweeps across the gold left border once, over 1.5 seconds).
- The PushPin icon does a small bounce animation.
- A "New milestone" badge appears in the card for 5 seconds, then fades out.

Track which milestones the owner has "seen" using `localStorage` keyed by entry ID. Only celebrate once.

- Complexity: Low (1-2 hours for the animation, mostly CSS + motion config).
- Dependencies: None. Can work independently of Realtime.

### 5e. Timeline as the portal landing experience

Consider making the timeline the first thing owners see after login instead of the dashboard. The dashboard currently shows stats that may not be populated for new owners (zero bookings, zero payouts). The timeline always has content from day one (the welcome entry, onboarding steps). This makes the portal feel alive even when the property has not had its first booking yet.

- This is a routing change, not a code change: update the redirect in the auth callback and portal layout.
- Complexity: Low (1-2 hours).
- Recommendation: **Try it.** If it does not feel right, revert. The timeline is more engaging than empty stat cards.

---

## 6. Analytics and Insights

**Why it matters:** As admin, Johan needs to know: Are owners actually checking their portal? Which owners are engaged? Which ones are going dark? The timeline is both a source of engagement data and a surface to display insights.

### 6a. Activity heatmap on admin

Show a GitHub-style contribution heatmap on the admin timeline page. Each cell represents a day, color intensity shows how many timeline entries were created that day. Gives Johan an at-a-glance view of activity patterns.

**Option A: Simple CSS grid heatmap (Recommended)**
A lightweight component that queries `owner_timeline` grouped by date for the last 90 days. Renders as a grid of small colored squares. No external library needed.

- Pros: Visual, compact, no dependencies.
- Complexity: Medium (half day). The query is straightforward; the rendering is the work.

**Option B: Use a charting library (Recharts, etc.)**
More polished, more interactive (tooltips on hover), but adds a dependency.

- Complexity: Medium (half day).

**(Recommended): Option A.** Keep it lightweight. A charting library is overkill for a single heatmap.

### 6b. Admin dashboard widget

Add a "Recent Activity" card to the admin overview page (`/admin`). Show the 5 most recent timeline entries across all owners with owner avatars. Clicking an entry navigates to the admin timeline with that entry highlighted.

- Complexity: Low (1-2 hours). It is a simplified version of the admin timeline feed.
- Dependencies: None.

### 6c. Owner engagement tracking

Track when owners visit their timeline page. Add a lightweight event log: when the portal timeline page loads, INSERT a row into `activity_log` with `entity_type: 'page_view'`, `action: 'timeline_viewed'`, `actor_id: owner_id`. Then on the admin side, show a "Last seen" column in the owners list, or a "Last checked timeline" indicator on each owner's admin profile.

**Option A: Page view logging in the server component (Recommended)**
In `apps/web/src/app/(portal)/portal/timeline/page.tsx`, after fetching data, INSERT into `activity_log`. Use a `Promise` that you do not `await` (fire and forget) so it does not slow the page load.

- Pros: Accurate, server-side, no client JS.
- Complexity: Low (1-2 hours).

**Option B: PostHog analytics**
Use PostHog (already noted in the stack for future use) to track page views and create a dashboard.

- Pros: Richer analytics, funnels, retention charts.
- Cons: Requires PostHog setup, which is not done yet.
- Complexity: Medium (half day for initial PostHog setup).

**(Recommended): Option A now, Option B later.** Get the basics with `activity_log`. When PostHog is set up, switch to that for the full picture.

---

## 7. Mobile Experience

**Why it matters:** Property owners check their portal on their phones. The timeline is the most natural "pull to check" page, like a social feed. If it does not feel great on mobile, owners will stop checking.

### 7a. Optimized mobile layout

The current timeline uses `gap-4`, `px-4`, and cards with `rounded-2xl`. On mobile screens, tighten the spacing:
- Reduce card padding from `p-4` to `p-3` on screens below 640px.
- Shrink the icon dots from `h-8 w-8` to `h-6 w-6` on mobile.
- Make the filter pills horizontally scrollable instead of wrapping (a single-row overflow scroll container).
- The sticky day headers already work well on mobile due to `sticky top-0`.

- Complexity: Low (1-2 hours). Tailwind responsive classes handle most of this.
- Dependencies: None.

### 7b. Push notifications for new timeline entries

When a new owner-visible timeline entry is created, send a push notification to the owner's device. Requires a service worker (PWA) for web push.

**Option A: Web Push via service worker (Recommended for later)**
Register a service worker in the portal layout. Use the Web Push API with a VAPID key pair stored in environment variables. When `logTimelineEvent` creates a notification, also call a push notification endpoint.

- Pros: Works on mobile browsers (Chrome, Edge, Firefox; Safari on iOS 16.4+). No native app needed.
- Cons: Requires service worker setup, VAPID key generation, a push notification endpoint (Supabase Edge Function or Next.js API route), and user permission prompts.
- Complexity: High (full day+).

**Option B: Email-only notifications**
Skip push. Rely on email notifications (from Section 3) to alert owners.

- Pros: Zero infrastructure. Universally works.
- Cons: Not instant. Emails can go to spam. Not a "mobile experience."
- Complexity: Already covered in Section 3.

**(Recommended): Option B for now, Option A in a later phase.** Push notifications are high effort and only matter once you have enough active owners to justify the infrastructure. Email notifications give you 80% of the value.

### 7c. Swipe gestures (future, low priority)

On mobile, swipe left on a timeline entry to reveal quick actions (for admin: pin, hide, delete). Uses touch event handlers or a swipe gesture library.

- Complexity: Medium (half day).
- Recommendation: **Defer.** This is a nice-to-have that does not unlock new capability. Admin actions on mobile can use a long-press menu instead if needed.

---

## Prioritized Roadmap

### Phase A: Foundation (build first, half day to one day)

These features make the timeline genuinely useful instead of a manual log.

1. **`logTimelineEvent` helper function** (Section 1, Option A). The core building block everything else depends on.
2. **Wire up automatic events for the 5 highest-value triggers:**
   - Owner signed up (account)
   - Property added (property)
   - Payout issued (financial)
   - Block request submitted and resolved (calendar)
   - New message sent (communication, admin-only visibility so it does not duplicate the messages page)
3. **Dual-write to notifications** (Section 3, Option A). When the timeline entry is created, also create a notification for the qualifying event types.
4. **Admin dashboard widget** (Section 6b). Recent Activity card on the admin overview page.

### Phase B: Premium Polish (build second, half day)

These features make the timeline feel alive and worth coming back to.

5. **Supabase Realtime on portal timeline** (Section 2, Option A). New entries slide in live.
6. **Milestone celebration animation** (Section 5d). Golden shimmer on new pinned entries.
7. **Entry detail drawer** (Section 5a, Option A). Click to expand any entry.
8. **Mobile layout optimization** (Section 7a). Tighter spacing, scrollable pills.

### Phase C: Admin Power Tools (build third, half day)

These features help Johan manage the timeline at scale.

9. **Owner filter dropdown** (Section 4b).
10. **Date range filter** (Section 4a).
11. **Entry templates** (Section 4c, Option A). Pre-built milestone chips.
12. **CSV export** (Section 4d).

### Phase D: Deeper Integration (build later, one day+)

These features connect the timeline to the rest of the portal ecosystem.

13. **Property-scoped timeline** (Section 5c). Recent Activity on property detail + `?property=` filter.
14. **Related entries** (Section 5b). Shown in the detail drawer.
15. **Remaining automatic event wiring** (all events from the Section 1 table not covered in Phase A).
16. **Activity heatmap** (Section 6a).
17. **Owner engagement tracking** (Section 6c).

### Phase E: Scale Features (build when needed)

18. **Scheduled entries** (Section 4f).
19. **Bulk operations** (Section 4e).
20. **Admin Realtime** (Section 2, Option C).
21. **Web Push notifications** (Section 7b, Option A).
22. **Rich text body** (Section 4g).

---

## Schema Changes Summary

All database changes needed for this plan:

1. **`publish_at timestamptz`** on `owner_timeline` (Phase D/E, for scheduled entries)
2. **`ALTER PUBLICATION supabase_realtime ADD TABLE public.owner_timeline`** (Phase B, for Realtime)

No other schema changes required. Everything else builds on the existing `owner_timeline` columns and the existing `notifications` table.

---

## Key Files to Touch

| File | Changes |
|---|---|
| `apps/web/src/lib/timeline.ts` (new) | `logTimelineEvent` helper, notification dual-write, event type config map |
| Every server action file listed in Section 1 | Add `logTimelineEvent` calls after primary DB writes |
| `apps/web/src/app/(portal)/portal/timeline/TimelineView.tsx` | Supabase Realtime subscription, detail drawer, celebration animation, mobile responsive tweaks |
| `apps/web/src/app/(admin)/admin/timeline/AdminTimelineView.tsx` | Owner filter, date range, templates, CSV export, bulk ops |
| `apps/web/src/app/(admin)/admin/timeline/page.tsx` | Pass additional data for new filters |
| `apps/web/src/app/(admin)/admin/(overview)/page.tsx` or equivalent | Recent Activity widget |
| Property detail page in portal | Property-scoped timeline section |
