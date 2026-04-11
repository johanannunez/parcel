# PWA Design Spec

## Context

The Parcel owner portal at `theparcelco.com/portal` needs to work as an installable app on phones and tablets. Owners should be able to add it to their home screen, get push notifications for new messages and announcements, and have the app launch instantly without a white screen. The manifest, app icons, and apple touch icons are already in place. What's missing is the service worker, push notification infrastructure, and install prompt UX.

## Goals

1. **Installable:** Owners can "Add to Home Screen" on any device. The app opens in standalone mode (no browser chrome).
2. **Instant launch:** The portal shell (sidebar, navigation, layout) loads from cache. No white screen on open.
3. **Push notifications:** New messages and announcements from admin trigger a lock screen notification. Tapping it opens the Messages page.
4. **Offline resilience:** If the owner opens the app without internet, they see a branded "You're offline" page instead of a browser error.

## Non-Goals

- Full offline data access (reading messages, properties, dashboards offline). Property management data is inherently live; caching it creates stale data confusion.
- Background sync or IndexedDB storage.
- Native app wrappers (Capacitor, React Native).

---

## Service Worker

### File

Hand-written `public/sw.js`. No library (next-pwa, serwist). The caching logic is straightforward enough to write directly, and avoids third-party configuration overhead.

### Caching Strategy

**Static assets (JS, CSS, images, fonts):** Cache-First. These are fingerprinted by Next.js build hashes, so cached versions are always correct. New builds produce new filenames, which are cached on first request.

**Portal shell pages (HTML):** Stale-While-Revalidate. Serve the cached HTML immediately for instant load, then fetch the fresh version in the background and update the cache for next time.

**API routes and Supabase calls:** Network-Only. Data must always be fresh. No caching of API responses.

**Offline fallback:** If any navigation request fails (no network), serve the pre-cached `/offline` page.

### Pre-cached Resources

On service worker install, pre-cache:
- `/offline` (the branded offline page)
- `/brand/logo-mark.png`
- `/brand/logo-mark-white.png`
- `/brand/app-icon-light-192.png`

### Registration

A client component (`ServiceWorkerRegistration`) in the portal layout registers the service worker on mount. Only registers in production (`process.env.NODE_ENV === 'production'`) to avoid caching issues during development.

### Lifecycle

- **Install:** Pre-cache the offline page and static assets. `skipWaiting()` to activate immediately.
- **Activate:** Clean up old caches from previous versions. `clients.claim()` to take control of all tabs.
- **Fetch:** Route requests through the caching strategy based on request type.

---

## Push Notifications

### Database

New table: `push_subscriptions`

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| id | uuid | gen_random_uuid() | PK |
| user_id | uuid | | FK to profiles |
| endpoint | text | | Push service URL (unique per device) |
| keys | jsonb | | `{ p256dh: string, auth: string }` |
| device_info | text (nullable) | | Browser + OS for display in account settings |
| created_at | timestamptz | now() | |

Unique constraint on `(user_id, endpoint)` to prevent duplicate subscriptions from the same device.

RLS:
- Owners can insert their own subscriptions (`user_id = auth.uid()`)
- Owners can delete their own subscriptions (unsubscribe)
- Admin has full access via service role

### VAPID Keys

Web Push requires VAPID (Voluntary Application Server Identification) keys. One-time generation:

```bash
npx web-push generate-vapid-keys
```

Store as environment variables:
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (sent to the browser for subscription)
- `VAPID_PRIVATE_KEY` (server-only, signs push payloads)
- `VAPID_EMAIL` = `mailto:hello@theparcelco.com` (required by the spec)

Added to `.env.example` and Vercel env vars via Doppler.

### Client-Side Subscription Flow

1. Portal loads. A `usePushSubscription` hook checks:
   - Is the browser capable? (`'serviceWorker' in navigator && 'PushManager' in window`)
   - Is permission already granted? (`Notification.permission === 'granted'`)
   - If granted, is there an active subscription? (check via `registration.pushManager.getSubscription()`)

2. If permission is granted and a subscription exists, verify it's saved in the database. If not, save it.

3. If permission is not granted, do not prompt immediately. The permission request is triggered from a dedicated UI element (see "Notification Permission Card" below).

### Notification Permission Card

An inline card shown on the `/portal/messages` page for owners who have not yet granted notification permission. Appears below the alerts strip:

> "Never miss a message. Turn on notifications to get alerted when The Parcel Company sends you something."
> [Enable notifications] button

Clicking triggers `Notification.requestPermission()`. If granted, subscribes to push and saves the subscription. The card disappears once permission is granted (or denied, in which case it shows a brief "You can enable notifications in your browser settings" note).

Not shown on other pages. Messages is the natural context where notifications make sense.

### Server-Side Push Send

When `sendMessage` or `sendBroadcast` is called from admin actions:

1. After inserting the message into the database, query `push_subscriptions` for the target owner(s).
2. For each subscription, call `webpush.sendNotification()` with:
   - Title: "The Parcel Company" (or "Announcement" for broadcasts)
   - Body: first 100 characters of the message, stripped of HTML
   - Icon: `/brand/app-icon-light-192.png`
   - Badge: `/brand/favicon-32.png`
   - Data: `{ url: '/portal/messages' }` (for click handling)
3. If a subscription returns a 410 Gone (expired), delete it from the database.
4. Push sends are fire-and-forget (don't block the response to the admin).

### Service Worker Push Handler

In `sw.js`:
- `push` event: Parse the payload, show a notification via `self.registration.showNotification()`.
- `notificationclick` event: Close the notification, focus or open the portal Messages page using `clients.openWindow()`.

### Package

`web-push` npm package (MIT, mature, well-maintained). Handles VAPID signing, payload encryption, and push protocol. Server-side only.

---

## Offline Page

Route: `/offline` (static page, not in the portal layout)

Content:
- Parcel logo (centered)
- "You're offline" heading
- "Check your connection and try again." subtext
- "Retry" button that calls `window.location.reload()`

Styled with inline styles (no external CSS dependency, since the CSS might not be cached). Uses the brand blue and warm gray colors hardcoded.

Pre-cached by the service worker on install so it's always available.

---

## Install Banner

### Component

`InstallBanner` client component rendered inside the portal layout, above the main content area.

### Display Logic

1. On each portal page load, increment a visit counter in localStorage.
2. After the 2nd visit (counter >= 2), check:
   - Has the user dismissed the banner before? (localStorage flag)
   - Is the app already installed? (`window.matchMedia('(display-mode: standalone)').matches`)
   - Is the `beforeinstallprompt` event available? (Chrome/Edge/Android)
3. If all checks pass, show the banner.

### Banner Design

A slim bar at the top of the portal content area (inside the layout, not fixed/sticky over content):

- Left: Parcel logo mark (24px) + "Install Parcel for a faster experience"
- Right: "Install" button (brand blue, small) + dismiss X button
- Background: subtle brand blue tint (`rgba(2, 170, 235, 0.04)`) with left blue border accent
- Dismissing sets `parcel-install-dismissed` in localStorage

### Platform Handling

**Chrome/Edge/Android:** Capture the `beforeinstallprompt` event in a ref. The "Install" button calls `event.prompt()` to trigger the native install dialog.

**iOS Safari:** `beforeinstallprompt` is not supported. The banner instead shows: "Tap the share button, then 'Add to Home Screen'" with a small share icon illustration. This is the standard iOS PWA install pattern.

**Desktop browsers:** Same as Chrome/Android. Works on Chrome, Edge, and desktop Safari 17+.

**Already installed:** If `display-mode: standalone` matches, never show the banner.

---

## Manifest Updates

The existing `manifest.json` is mostly correct. Updates needed:

- Add `"id": "/portal/dashboard"` (stable app identity)
- Add maskable icon entries for Android adaptive icons
- Add `"categories": ["business", "finance"]`
- Add `"screenshots"` array (optional, improves the install prompt on Android)
- Set `"scope": "/"` so the PWA can handle `/offline` and `/auth/callback` in addition to `/portal` routes. The `start_url` of `/portal/dashboard` ensures the app opens to the right place.

---

## Build Slices

### Slice 1: Service Worker + Offline Page

- `public/sw.js` with caching strategy
- `ServiceWorkerRegistration` client component in portal layout
- `/offline` page
- `manifest.json` updates
- Supabase types update for `push_subscriptions` table

### Slice 2: Push Notifications

- `push_subscriptions` table + RLS policies (Supabase migration)
- `web-push` npm package
- VAPID key generation + env var setup
- `usePushSubscription` client hook
- Server-side push send in `sendMessage` and `sendBroadcast` actions
- Push + notification click handlers in `sw.js`
- Notification permission card on Messages page

### Slice 3: Install Banner

- `InstallBanner` client component
- Visit counter + dismissal logic in localStorage
- `beforeinstallprompt` event capture
- iOS fallback instructions
- Portal layout integration

---

## Technical Notes

- **web-push** package: server-side only, never imported in client components
- **VAPID keys** are generated once and never change. Changing them invalidates all existing subscriptions.
- **Safari on iOS 16.4+** supports Web Push for PWAs added to the home screen. Older iOS versions do not support push at all.
- **Service worker scope:** registered at `/` but only caches portal-related resources. Marketing pages are unaffected.
- **No build tool integration:** The service worker is a plain JS file in `public/`, not bundled by Next.js/Turbopack. This avoids framework-specific complications.

## Verification

1. **Slice 1:** Open the portal on a phone. Add to Home Screen. Open the app: it launches in standalone mode with no browser chrome. The shell loads instantly. Turn on airplane mode: the offline page appears with the Parcel logo and retry button.
2. **Slice 2:** Enable notifications from the Messages page card. Send a message from admin. The notification appears on the phone's lock screen within seconds. Tap it: the portal Messages page opens.
3. **Slice 3:** Visit the portal twice on a phone without installing. The install banner appears. Tap "Install": the native install dialog appears. Dismiss the banner: it never shows again.
