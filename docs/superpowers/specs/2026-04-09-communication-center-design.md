# Communication Center Design Spec

## Context

The Parcel owner portal needs a communication system so Johan can message owners directly, broadcast announcements, log outbound emails, and trigger automated notifications. Today, all owner communication happens outside the portal (email, phone). BoldSign templates and welcome copy already say "send us a message in the portal," but no messaging feature exists yet. This spec makes those CTAs real and turns the portal into the single source of truth for all owner communications.

## Overview

A unified inbox system with four pillars:

1. **Direct messages** between Johan (admin) and individual owners, with real-time delivery via Supabase Realtime.
2. **Email sending** from the admin compose view, delivered to the owner's real email via Resend AND logged in their portal inbox as a read-only record.
3. **System-wide announcements** broadcast to all owners at once (portal and/or email).
4. **Event-triggered notifications** (block request approved, payout processed, etc.) shown via an in-app notification bell.

Read tracking is admin-only: first opened, open count, last opened, device type. Owners never see tracking indicators.

---

## Data Model

### New Enum

```sql
create type public.conversation_type as enum ('direct', 'announcement', 'email_log');
```

### Table: `conversations`

One row per thread. Direct conversations are 1:1 (Johan to one owner). Announcements have `owner_id = NULL` and fan out to all owners.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| id | uuid | gen_random_uuid() | PK |
| owner_id | uuid (nullable) | | FK to profiles. NULL for announcements. |
| subject | text (nullable) | | Used for announcements and email threads. |
| type | conversation_type | 'direct' | direct, announcement, or email_log |
| last_message_at | timestamptz | now() | Denormalized for fast inbox sorting. |
| created_at | timestamptz | now() | |
| updated_at | timestamptz | now() | |

### Table: `messages`

Individual messages within a conversation.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| id | uuid | gen_random_uuid() | PK |
| conversation_id | uuid | | FK to conversations |
| sender_id | uuid | | FK to profiles (Johan or the owner) |
| body | text | | Rich HTML content from Tiptap editor |
| is_system | boolean | false | True for auto-generated entries (email logs, system messages) |
| delivery_method | text | 'portal' | 'portal' or 'email'. How this message was delivered. |
| metadata | jsonb | '{}' | Flexible: email subject, Resend message ID, original headers, etc. |
| created_at | timestamptz | now() | |

### Table: `message_reads`

Engagement tracking. Admin-only visibility. One row per reader per message.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| id | uuid | gen_random_uuid() | PK |
| message_id | uuid | | FK to messages |
| reader_id | uuid | | FK to profiles |
| first_read_at | timestamptz | now() | When the owner first opened this message |
| read_count | int | 1 | Incremented on each open |
| last_read_at | timestamptz | now() | Most recent open |
| device_info | text (nullable) | | User agent string for device categorization |

Unique constraint on (message_id, reader_id).

### Table: `notifications`

Event-triggered alerts, separate from the messaging inbox.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| id | uuid | gen_random_uuid() | PK |
| owner_id | uuid | | FK to profiles |
| type | text | | Category key: block_approved, block_denied, payout_processed, new_booking, setup_reminder, etc. |
| title | text | | Short headline shown in the bell dropdown |
| body | text | | Detail text |
| link | text (nullable) | | Portal URL to navigate to when clicked |
| read | boolean | false | |
| created_at | timestamptz | now() | |

### RLS Policies

- Owners can read their own conversations (where `owner_id = auth.uid()` or type = 'announcement').
- Owners can read messages within conversations they have access to.
- Owners can insert messages only in direct conversations where they are the owner (reply capability).
- Owners can read and update their own notifications (marking as read).
- Owners cannot read `message_reads` at all. Admin only via service role.
- Admin (service role) has full access to all tables.

### Supabase Realtime

Two channels:

1. **`messages:{owner_id}`** — Owner subscribes on portal load. Receives new messages in real time.
2. **`notifications:{owner_id}`** — Owner subscribes on portal load. Receives new notification alerts in real time.

Admin subscribes to a broader channel to see incoming owner replies across all conversations.

### Supabase Storage

New bucket: `message-attachments` (public read, authenticated write). Stores images embedded in rich text messages. Path convention: `{conversation_id}/{message_id}/{filename}`.

---

## Owner Portal Experience

### Sidebar Changes

- **New nav item: "Messages"** — Under Portfolio section, after Payouts. `ChatCircle` Phosphor icon (18px, duotone). Unread badge count (blue dot with number).
- **Notification bell** — In the sidebar header area near the "Parcel Owner" logo. Bell icon with unread count dot. Clicking opens a dropdown overlay, not a new page.

### Messages Page (`/portal/messages`)

Two-panel layout inside the main content area:

**Left panel (~320px): Conversation list**
- Search bar at top (filters by owner name, subject, message content).
- Each row: type icon (chat bubble / megaphone / envelope), sender name or "The Parcel Company," last message preview (truncated), relative timestamp, unread indicator (blue dot).
- Sorted by last_message_at descending.
- Announcements appear with a subtle highlight or pin icon.
- Email log entries show an envelope icon to distinguish from chat.

**Right panel (remaining space): Conversation thread**
- Messages displayed chronologically.
- Direct messages: chat bubble style. Admin messages on the right (brand blue background, white text). Owner messages on the left (light warm-gray background).
- Email log entries: styled with an envelope icon header, slightly muted background, "Sent via email" label. Read-only.
- Announcements: banner-style header with megaphone icon, "Announcement" label.
- Compose input at the bottom for direct conversations. Text input with send button. Owners compose in plain text for v1 (rich text is admin-only for now).
- No compose input for email logs or announcements (read-only for owners).

**Empty states:**
- No conversations: "No messages yet. Your conversations with The Parcel Company will appear here."
- No conversation selected: "Select a conversation to view messages."

### Notification Bell Dropdown

- Anchored to the bell icon in the sidebar.
- Shows last 10 notifications, newest first.
- Each row: contextual icon (check for approvals, dollar sign for payouts, calendar for bookings), title, body preview (one line), relative timestamp, unread dot.
- "Mark all as read" link at top right.
- "View all notifications" link at bottom, goes to `/portal/notifications`.
- Clicking a notification: marks it read, navigates to its `link` URL.
- Dropdown closes on outside click or navigation.

### Notifications Page (`/portal/notifications`)

Full-page list of all notifications with the same row format as the dropdown. Paginated or infinite scroll. Filter by type (all, unread). "Mark all as read" button.

### Read Tracking (How It Works)

When an owner opens a message they haven't read before:
1. The portal client sends an upsert to `message_reads` with the message ID, owner ID, timestamp, and user agent.
2. If a row already exists for this message+reader, increment `read_count` and update `last_read_at`.
3. This happens silently. No visual indicator to the owner.

For announcements: each owner gets their own `message_reads` row when they open it.

---

## Admin Experience

### Admin Sidebar Update

- **New nav item: "Messages"** — Under Main section (after Inquiries). `ChatCircle` icon. Unread badge count showing unread owner replies.
- The Owner Hub "Messages" placeholder tab becomes a link to the admin Messages page filtered to that specific owner.

### Admin Messages Page (`/admin/messages`)

Three-panel layout:

**Left panel (~220px): Folders/Filters**
- All messages (default)
- Unread
- Sent
- Announcements
- Email logs
- Unread count displayed next to each category.
- Divider, then:
- "New message" button (opens an owner picker dropdown, then starts a new conversation with that owner or navigates to the existing one)
- "New announcement" button (opens broadcast composer)

**Middle panel (~320px): Conversation list**
- Filtered by selected folder/category.
- Each row: owner initials avatar, owner name, last message preview, relative timestamp, unread dot, delivery method icon (portal/email).
- Search bar at top (filters by owner name, subject, content).
- Sorted by last_message_at descending.

**Right panel (remaining space): Conversation thread + compose**

Upper area: message thread (same chronological display as portal, but with added metadata).

Each message Johan sent shows:
- Delivery method label: "Portal" or "Email"
- Read tracking expandable: click to see first_read_at, read_count, last_read_at, device_info.

For announcements: read tracking shows "Read by X of Y owners" with expandable per-owner detail.

Lower area: rich text compose.

### Rich Text Compose (Tiptap)

**Toolbar row 1 (text formatting):**
Font family dropdown (system fonts: default, serif, mono) | Font size dropdown (12, 14, 16, 18, 20, 24, 28, 32) | Bold | Italic | Underline | Strikethrough | Text color picker | Highlight color picker

**Toolbar row 2 (structure and media):**
Heading level (H1, H2, H3) | Bullet list | Numbered list | Blockquote | Text align (left, center, right) | Insert link | Insert image | Horizontal rule | Undo | Redo

**Editor area:** Live WYSIWYG editing powered by Tiptap. Content stored as HTML in the `messages.body` column.

**Below the editor:**
- Delivery toggle: segmented control with "Portal" and "Email" options. Defaults to Portal.
- When "Email" is selected: subject field appears (pre-filled from conversation subject if replying in an existing thread).
- Send button.

**Image uploads:** Drag, paste, or click the image toolbar button. Image uploads to `message-attachments` Supabase Storage bucket. Inserted as `<img>` with the public URL.

### Broadcast Composer

Triggered by "New announcement" button. Opens as a modal or dedicated view:

- Subject line (required).
- Rich text body (same Tiptap editor).
- Delivery method: "Portal only" or "Portal + Email to all owners."
- Owner count preview: "This will be sent to X owners."
- Preview button: shows the rendered message as an owner would see it.
- Confirm and send button with a confirmation dialog.

When sent:
- Creates one `conversations` row with type = 'announcement' and owner_id = NULL.
- Creates one `messages` row with the content.
- If email delivery selected: sends via Resend to every owner's email with the branded template.

### Email Template (for Resend delivery)

Built with React Email components. Structure:

1. Parcel logo header (simple, clean).
2. Rich HTML body from the Tiptap editor.
3. Footer: "View in your Parcel portal" button linking to the conversation, plus unsubscribe/manage preferences link.

Consistent with the existing Parcel brand: `#02AAEB` blue, clean white background, Poppins-style typography.

---

## Build Slices

### Slice 1: Core Messaging

**Database:**
- Create conversation_type enum
- Create conversations, messages, message_reads tables
- RLS policies for all three tables
- Supabase Realtime enabled on messages table

**Admin side:**
- Three-panel Messages page at `/admin/messages`
- Conversation list with owner filtering
- Message thread view
- Rich text compose with Tiptap (portal delivery only)
- Read tracking display per message
- Sidebar nav item with unread badge

**Owner portal side:**
- Two-panel Messages page at `/portal/messages`
- Conversation list and thread view
- Plain text reply input
- Read tracking recording (silent upserts to message_reads)
- Sidebar nav item with unread badge
- Real-time subscriptions for new messages

**Owner Hub integration:**
- Replace Messages placeholder tab with link to admin Messages filtered by that owner

### Slice 2: Email Integration

**Compose:**
- Delivery toggle (Portal | Email) in admin compose
- Subject field for email delivery
- Branded email template with React Email
- Resend send on email delivery, store Resend message ID in metadata

**Email logging:**
- Email log conversation type
- Outbound emails from other parts of the system (block request notifications, inquiry auto-replies) create email_log entries in the owner's conversation history

**Broadcast:**
- Broadcast composer (modal or dedicated view)
- Announcement conversation type
- Portal + Email delivery option for broadcasts
- Per-owner read tracking for announcements ("Read by X of Y")

### Slice 3: Notifications

**Database:**
- Create notifications table
- RLS policies
- Supabase Realtime enabled on notifications table

**Portal side:**
- Notification bell in sidebar with unread count
- Bell dropdown with last 10 notifications
- Full notifications page at `/portal/notifications`
- Mark as read (individual and bulk)
- Real-time subscription for new notifications

**Event hooks:**
- Block request approved/denied generates notification
- Payout processed generates notification
- New booking on owner's property generates notification
- Setup step reminder generates notification
- New message received generates notification (linking to Messages page)

**Admin side:**
- Notification management view (optional, lower priority): see what notifications have been sent, delivery stats

---

## Technical Notes

- **Tiptap packages:** `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-image`, `@tiptap/extension-link`, `@tiptap/extension-text-align`, `@tiptap/extension-underline`, `@tiptap/extension-color`, `@tiptap/extension-text-style`, `@tiptap/extension-font-family`, `@tiptap/extension-highlight`, `@tiptap/extension-placeholder`. All free, MIT licensed.
- **React Email:** `@react-email/components` for building the branded email template. Pairs with existing Resend integration.
- **Supabase Realtime:** Uses `postgres_changes` channel to listen for INSERT on messages and notifications tables, filtered by owner_id.
- **Supabase Storage:** New `message-attachments` bucket. Public read access for displaying images. Authenticated write via the admin client.
- **No schema changes to existing tables.** All new tables. The only modification to existing code is adding notification generation hooks into existing server actions (block request approval, etc.) in Slice 3.

## Verification

1. **Slice 1:** Admin sends a portal message to an owner. Owner sees it appear in real time on their Messages page. Owner replies. Admin sees the reply in real time. Admin views read tracking showing the owner opened the message.
2. **Slice 2:** Admin sends a message with "Email" delivery. Owner receives the email in their real inbox AND sees it logged in their portal Messages. Admin composes a broadcast. All owners see it in their inbox. Admin sees "Read by X of Y" tracking.
3. **Slice 3:** Admin approves a block request. Owner sees a notification appear in the bell dropdown in real time. Clicking it navigates to the calendar page. Bell count decrements.
