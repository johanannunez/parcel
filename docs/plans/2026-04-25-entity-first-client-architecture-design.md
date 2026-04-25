# Entity-First Client Architecture Design

**Date:** 2026-04-25
**Status:** Approved

---

## Problem

The current client detail page is contact-centric: every URL points to a contact ID, every data fetch is scoped to one person, and the architecture has no concept of multiple owners sharing the same properties, billing, and account. The relationship strip in the header (Last Contact, Follow-up, Next Meeting) is visually clunky: bordered cells with icon badges that read like a dashboard widget crammed into a header. Both problems share the same root: the entity was not the primary unit from the beginning.

---

## Solution Overview

The entity becomes the primary unit for every client, from the moment they are created as a lead. The admin always navigates to `/admin/clients/[entity-id]`. All tabs are entity-scoped. Multiple owners (husband and wife, owner and accountant, etc.) are contacts within the same entity. The header is redesigned to show the entity name first, with a person switcher for individual contact info. The clunky strip is replaced with a single lightweight inline status line.

---

## 1. Data Model

### Entity auto-creation

Every contact creation triggers an entity creation. There are no contacts without an entity. This applies to leads, prospects, and fully onboarded clients equally. The experience is identical at every lifecycle stage.

**Entity name defaults:**
- Individual contact: full name (e.g., "Eliana Nunez")
- Contact with a company name set: company name (e.g., "Elite Industries LLC")
- When a second contact is added to the entity and shares the last name: surface a rename prompt with a pre-filled suggestion ("Nunez Family") and an editable text input. Admin can accept, modify the suggestion, or dismiss. Never automatic.

### Entity type field

Entities have a `type` field with the following options: Individual, LLC, S Corp, C Corp, Trust, Partnership. Shown as a small badge next to the entity name throughout the UI.

### Backfill migration

All existing contacts without an `entity_id` get an entity auto-generated: entity name defaults to the contact's company name if set, otherwise their full name. Entity type defaults to Individual. The contact is linked to the new entity. Applied via a single Supabase migration.

### Contacts table

No structural changes. Each contact already has an `entity_id` foreign key. The backfill populates it for all nulls.

---

## 2. Routing

| Before | After |
|--------|-------|
| `/admin/clients/[contact-id]` | `/admin/clients/[entity-id]` |

Old contact-ID URLs redirect to the entity page via a server-side redirect: look up the contact, find its `entity_id`, redirect to `/admin/clients/[entity-id]`. If no entity exists (should not happen after backfill), fall back to a 404.

The clients list links to entity pages. If two contacts share an entity, clicking either one in the list lands on the same entity page. A secondary name badge on the list row indicates when there is more than one member in the entity (e.g., "+1").

---

## 3. Header Redesign

The header has a CSS grid layout: left identity block (40%) and right metadata zone (60%).

### Left: Identity block

- **Avatar**: 80px, border-radius 18px, gradient fallback with initials. Active person's avatar.
- **Entity name**: large, bold, primary color. This is the account-level title, always present.
- **Entity type badge**: small inline badge beside the entity name (e.g., "LLC", "Individual").
- **Person chips**: shown only when the entity has more than one contact. Compact chips (small avatar + first name) stacked horizontally below the entity name. The active chip is highlighted. Clicking a chip swaps the personal info below without any navigation or tab reload.
- **Personal name**: the active contact's full name, slightly smaller than the entity name.
- **Email and phone**: stacked below the personal name, always-visible copy buttons on each.

### Right: Metadata zone

Two rows:

**Top row (pills):**
- Properties count pill (gray)
- Lifetime revenue pill (gray)
- Stage badge (existing StagePopover, unchanged)
- Vertical separator between pills

**Bottom row (inline status line):**
Replaces the bordered-cell strip entirely. A single horizontal text line with thin vertical separators between items. No boxes, no icon badges, no uppercase labels.

Format: `Last contact 2 days ago · Follow-up May 14 · Next meeting May 8`

- Last contact: muted text, relative time
- Follow-up: amber text when upcoming, red text when overdue. Clicking the text opens the existing date picker popover. An inline "Done" link appears next to overdue text.
- Next meeting: green text when scheduled, muted when none. Shows meeting title truncated + relative date.
- When no follow-up is set and a meeting exists: the follow-up slot reads "Meeting is next" in muted text with a small "Add reminder" link.
- The entire bottom row has a subtle red tint background when a follow-up is overdue.

---

## 4. Sidebar

**Hard rule: no scroll, ever.** Every field is visible on screen without scrolling. If something does not fit, it does not go in the sidebar.

### Multi-person switcher

Shown only when the entity has more than one contact. Compact name chips at the very top of the sidebar. Active chip is highlighted. Switching chips swaps all person-level fields. Entity-level fields below are unaffected.

### Fields (top to bottom)

**Entity section:**
- Entity name (large, bold) with always-visible copy button
- Entity type badge inline

**Person-level fields (update when person chip is switched):**
- Email with always-visible copy button
- Phone with always-visible copy button
- Mailing address (multi-line) with always-visible copy button
- Preferred contact method (Email, Phone, SMS, WhatsApp)
- Portal access toggle
- Social links row (see below)

**Entity-level fields (always fixed, do not change on person switch):**
- Pipeline: source and assigned admin, side by side
- Contract: start and end dates, side by side
- Management fee

### Copy button behavior

Always visible, never hidden. On click: the field row flashes a soft green background, the copy icon swaps to a checkmark for 1.5 seconds, then returns to normal.

### Save confirmation

When a field is edited and saved: the field row flashes a soft green background with a small "Saved" label that appears and fades out over about 1 second. Distinct from the copy flash: save includes the text label, copy does not.

### Inline editing (all fields except social links)

Clicking any value in the sidebar makes it an editable input in place (Option A). The copy button hides while the field is in edit mode, replaced by Save and Cancel controls inline. Pressing Enter or clicking Save commits the change and triggers the green save flash. Pressing Escape or clicking Cancel restores the previous value.

### Social links

A horizontal row of five icons: LinkedIn, Instagram, X, Facebook, Website (globe).

- When a link is set: the icon renders in its brand color (LinkedIn blue, Instagram pink, X black, Facebook blue, Website in brand blue). Clicking opens the URL in a new tab.
- When a link is not set: the icon is gray and muted.

Clicking any icon (colored or gray) opens a "Social Links" modal. The modal has five labeled input fields, pre-filled for any URLs already set. One Save button applies all changes. The icon row updates after saving to reflect which links are now set.

---

## 5. Tab Behavior

All tabs are **entity-scoped** by default. The same data is shown regardless of which person chip is active.

| Tab | Scope |
|-----|-------|
| Overview | Entity |
| Properties | Entity |
| Tasks | Entity |
| Meetings | Entity |
| Intelligence | Entity |
| Communication | Person (with All view) |
| Documents | Entity |
| Billing | Entity |
| Settings | Entity (with People sub-section) |

### Communication tab

A unified timeline showing three message types: **Email**, **SMS**, and **System announcements**. Each message is labeled by type and sender.

- Default view: filtered to the active person (whoever's chip is selected in the header).
- "All" filter at the top: shows all messages across all entity members in a single chronological timeline.
- Clients see their own full communication history when they log into the portal (all three types: emails they received, texts, and system announcements).
- System announcements are portal-only: they appear in the Communication tab but are not delivered externally.
- Email is delivered to the owner's personal email address and logged in Parcel.
- SMS delivery via Quo is deferred to the next sprint (see Out of Scope).

### Settings tab

Has a People sub-section listing all contacts in the entity. Admin can add a new person to the entity, remove an existing person, or edit any person's details. Adding a person here triggers the rename prompt if the new person shares the entity's last name.

---

## 6. Out of Scope (Next Sprint)

- **Quo SMS integration**: wiring system messages and outbound texts through Quo for delivery to owners' personal phone numbers. The Communication tab UI is designed to support SMS now; the actual delivery mechanism is built in the next sprint after the entity architecture is stable.

---

## 7. Verification Checklist

1. `pnpm exec tsc --noEmit` passes with zero errors
2. All existing contact-ID URLs redirect correctly to entity pages
3. Backfill migration: every contact in production has an `entity_id`
4. Solo entity (one contact): no person chips visible, sidebar shows no People switcher
5. Multi-person entity (two or more contacts): chips render, switching swaps personal fields, entity fields stay fixed
6. Follow-up overdue state: inline status line turns red, bottom row has red tint
7. Copy flash: green background + checkmark on every copy button
8. Save flash: green background + "Saved" label on every inline edit save
9. Social links modal: opens from any icon (colored or gray), saves all five at once, icon row updates
10. Communication tab All view: shows messages across all entity members
11. Portal: clients can see full communication history (email, SMS, system announcements)
