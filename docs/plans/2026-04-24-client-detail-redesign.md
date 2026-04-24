# Client Detail Page Redesign

**Date:** 2026-04-24
**Scope:** Client detail page at `/admin/clients/[id]`

---

## Problem

The current client detail page has four compounding issues:

1. The Edit drawer hides all contact info behind a modal and uses a single full-name field with no validation.
2. The top header has significant empty space with no actionable data.
3. There is no persistent bird's-eye view of the owner — key facts require tab-switching to find.
4. The stage picker disappears when clicked (z-index/portal bug with CustomSelect inside the drawer).

---

## Solution

Three structural changes: a richer header, a persistent right sidebar with inline editing, and a fixed edit drawer with proper validation.

---

## 1. Header Redesign

**Left zone:**
- Avatar, First + Last name, Company
- Email and phone on a second line (copy buttons on each)
- Next follow-up date chip directly below the name row — amber-tinted when overdue, click to set/edit inline via a date popover

**Right zone:**
- Four stat chips: Properties (count managed by Parcel), Lifetime Revenue, In Stage (days in current stage), Last Activity (relative)
- Two action buttons: Message (jumps to Messaging tab), Meeting (jumps to Meetings tab)

---

## 2. Right Sidebar — Always Visible, Click-to-Edit

Width: ~300px fixed. No scroll. All sections visible at all times.

### Interaction pattern
- Every value is readable by default.
- Click a value: it becomes an editable input in place. Blur or Enter saves via server action. Escape cancels.
- Stage uses a popover pill picker (not a dropdown) — clicking opens a floating panel of stage pills, click a pill to select, panel closes.
- Assignee uses an avatar picker popover.
- Social icons: dimmed if no URL, click to paste a URL. Click a filled icon to open in new tab.
- Address: single line showing the verified formatted address. Click to open Google Places autocomplete input.

### Sections

**Contact** (6 rows)
| Field | Notes |
|---|---|
| First name + Last name | Side by side, split fields |
| Email | Validated on blur (format check) |
| Phone | Country code + formatted mask |
| Company | Free text |
| Address | Google Places autocomplete, stores formatted_address + components in jsonb |
| Social media | Icon row: LinkedIn, Instagram, Facebook |

**Pipeline** (2 rows)
| Field | Notes |
|---|---|
| Stage | Popover pill picker |
| Source + Assigned admin | Side by side |

**Contract** (2 rows)
| Field | Notes |
|---|---|
| Start date + End date | Side by side, DatePickerInput |
| Management fee % | Numeric, validated 0–100 |

**Owner** (3 rows)
| Field | Notes |
|---|---|
| Preferred contact method | 3-button icon row: Email, Phone, Text |
| Total properties owned vs. managed | e.g. "5 owned · 2 with Parcel" |
| Portal access + Newsletter toggle | Side by side |

---

## 3. Edit Drawer — Replaced by Sidebar

The `ClientEditDrawer` is removed. All editing happens inline in the sidebar. The Edit button in the header is also removed.

---

## 4. Field Validation

| Field | Rule |
|---|---|
| Email | Must contain @ and valid domain format. Validated on blur, error shown inline below the field. |
| Phone | Formatted with country code via `react-phone-number-input`. Stored as E.164 string. |
| Management fee % | Must be 0–100. Numeric only. |
| Address | Must be selected from Google Places result, not free-typed. |

---

## 5. Database Changes

New columns on the `contacts` table:

| Column | Type | Notes |
|---|---|---|
| `first_name` | text | Nullable. Backfill from full_name on migration. |
| `last_name` | text | Nullable. |
| `address_formatted` | text | Full formatted address from Google Places |
| `address_components` | jsonb | Street, city, state, zip, country components |
| `social` | jsonb | `{ linkedin, instagram, facebook }` URLs |
| `preferred_contact_method` | text | One of: email, phone, text |
| `contract_start_at` | date | Nullable |
| `contract_end_at` | date | Nullable |
| `next_follow_up_at` | date | Nullable |
| `total_properties_owned` | integer | Nullable, manually entered |
| `newsletter_subscribed` | boolean | Default false |

`full_name` stays for backwards compatibility but is derived from first_name + last_name on save.

`estimated_mrr` is removed from the edit surface (stays in DB for now, not shown in UI). Revenue lives in the Billing tab.

---

## 6. Layout Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│ HEADER: Avatar | Name | Company | Email | Phone | Follow-up         │
│                                        | Stats | Message | Meeting  │
├────────────────────────────────────────┬────────────────────────────┤
│ TABS: Overview | Properties | Meetings │ SIDEBAR                    │
│       Intelligence | Messaging         │  ┌ Contact ─────────────┐  │
│       Documents | Billing | Settings   │  │ First  Last          │  │
│                                        │  │ Email                │  │
│ TAB CONTENT AREA                       │  │ Phone                │  │
│                                        │  │ Company              │  │
│                                        │  │ Address              │  │
│                                        │  │ Social icons         │  │
│                                        │  ├ Pipeline ────────────┤  │
│                                        │  │ Stage                │  │
│                                        │  │ Source  Assignee     │  │
│                                        │  ├ Contract ────────────┤  │
│                                        │  │ Start   End          │  │
│                                        │  │ Fee %               │  │
│                                        │  ├ Owner ───────────────┤  │
│                                        │  │ Contact method       │  │
│                                        │  │ Properties owned     │  │
│                                        │  │ Portal  Newsletter   │  │
│                                        │  └──────────────────────┘  │
└────────────────────────────────────────┴────────────────────────────┘
```

---

## 7. Out of Scope

- Owner notes (not on sidebar)
- LinkedIn in sidebar (moves to Settings tab)
- Estimated MRR field (hidden from UI, stays in DB)
- Map view for address
- Social media feed integration
