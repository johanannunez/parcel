# Help Center Intake Page — Design Doc
**Date:** 2026-04-21  
**Status:** Approved, ready for implementation

---

## Problem

Owner conversations surface valuable institutional knowledge (policy reasoning, edge cases, tradeoffs) that currently lives only in Johan's head or in private message threads. There is no system to capture, sanitize, and publish this knowledge to the help center.

## Solution

A two-part workflow:

1. **Alcove prompt** ("FAQ Article Drafter") — Johan pastes or screenshots a conversation, Claude strips PII and drafts a structured article. No Anthropic API cost in the Parcel app.
2. **Admin intake page** (`/admin/help/intake`) — Johan pastes the Alcove draft, the page parses it into pre-filled fields, he reviews and publishes directly to the `help_articles` table.

---

## Alcove Prompt

**Type:** Prompt  
**Title:** FAQ Article Drafter  
**Short description:** Strip & draft

The prompt instructs Claude to:
1. Strip all PII (names, phones, emails, addresses, identifying figures)
2. Identify the core question and nuances
3. Output a structured draft in a fixed format: TITLE, SUMMARY, CONTENT, TAGS, CATEGORY, READ TIME
4. Ask for confirmation before the article is considered final

Output format is designed to be machine-parseable by the intake page.

---

## Admin Intake Page

**Route:** `/admin/help/intake`  
**Access:** Admin only (existing admin middleware)

### Phase 1: Paste

A centered single-purpose screen:
- Large textarea labeled "Paste your Alcove draft here"
- "Parse and Review" button
- Link back to `/admin/help`

### Phase 2: Review

After parsing, the page renders a pre-filled article editor:

| Field | Source |
|-------|--------|
| Title | Parsed from `TITLE:` line |
| Summary | Parsed from `SUMMARY:` line |
| Content | Parsed from `CONTENT:` block, converted to HTML for Tiptap |
| Tags | Parsed from `TAGS:` line, split on commas |
| Category | Parsed from `CATEGORY:` line, matched to `help_categories` by name |
| Read time | Parsed from `READ TIME:` line |

The content editor uses the existing `HelpArticleEditor` (Tiptap) component.  
A "Start over" link resets to Phase 1.

### Bottom bar

- **Save as Draft** — writes to `help_articles` with `status: 'draft'`
- **Publish** — writes with `status: 'published'`, sets `published_at: now()`

Both actions automatically append `source:ai-intake` to the tags array.

### Privacy guarantee

The raw pasted conversation text never touches the database. Only the sanitized article output is saved.

---

## Data Flow

```
Owner conversation
      ↓
Alcove prompt (Claude strips PII, drafts article)
      ↓
Structured text output (TITLE / SUMMARY / CONTENT / TAGS / CATEGORY / READ TIME)
      ↓
/admin/help/intake (paste → parse → review → publish)
      ↓
help_articles table (status: draft or published)
      ↓
Public help center + portal search + AI chat widget
```

---

## Existing Infrastructure Used

- `help_articles` table — no schema changes needed
- `help_categories` table — used for category dropdown
- `HelpArticleEditor` component (Tiptap) — reused as-is
- `/admin/help` list page — already shows draft queue by status
- Admin middleware — intake route is automatically protected

---

## Files to Create

- `apps/web/src/app/(admin)/admin/help/intake/page.tsx`
- `apps/web/src/app/(admin)/admin/help/intake/IntakePage.tsx` (client component)
- `apps/web/src/lib/admin/help-intake-parser.ts` (parses structured Alcove output)

## Files to Modify

- `apps/web/src/app/(admin)/admin/help/page.tsx` — add "New from Alcove" button linking to `/admin/help/intake`

---

## Out of Scope

- AI processing inside the Parcel app (no Anthropic API in the intake flow)
- Screenshot upload to the intake page (handled in Alcove)
- Source conversation storage
