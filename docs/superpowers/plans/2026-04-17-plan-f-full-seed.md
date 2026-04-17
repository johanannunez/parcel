# Plan F — Full Seed Data for Development

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a single idempotent seed script that loads a realistic cross-section of TEST data into the dev database so every pipeline page renders meaningful content on first open. Ship criterion: run one command, every admin page (Contacts pipeline, Properties pipeline, Projects pipeline, Tasks inbox, right-rail on any detail) shows populated state; run it a second time and nothing duplicates.

**Depends on:** Plans A–E shipped. This plan is the final polish — it assumes every table exists and every UI renders.

**Architecture:** A single SQL script lives at `apps/web/supabase/seeds/pipeline-dev-seed.sql`. Every row it inserts uses deterministic UUIDs derived from a namespace (`gen_random_uuid()` is replaced with `md5`-derived constant UUIDs so re-runs upsert cleanly). Every text field is prefixed with `TEST · ` so a later prod import can filter them out. A CLI wrapper `pnpm --filter web db:seed-pipeline` runs the script against the linked Supabase project with guardrails (refuses to run if `NEXT_PUBLIC_SUPABASE_URL` points at a production-like project).

---

## File plan

**New files:**

- `apps/web/supabase/seeds/pipeline-dev-seed.sql`
- `apps/web/scripts/seed-pipeline.ts` — Node script that reads the SQL and applies it via the service-role client, with a safety guard
- `apps/web/e2e/seed-smoke.spec.ts` — post-seed sanity (pipeline pages render cards)

**Modified files:**

- `apps/web/package.json` — add script `"db:seed-pipeline": "tsx scripts/seed-pipeline.ts"`

---

## Seed data shape

### Contacts (8 test records, one per lifecycle stage)

| Stage | Name | Company | Source | Est MRR | Properties seeded |
|---|---|---|---|---|---|
| `lead_new`       | TEST · Avery Barlow   | Barlow Rentals LLC  | instagram | 1800 | 1 prospect |
| `qualified`      | TEST · Sarah Johnson  | Oak Industries LLC  | referral  | 3200 | 2 prospects |
| `in_discussion`  | TEST · Marcus Reyes   | Reyes Holdings      | website   | 1500 | 1 prospect |
| `contract_sent`  | TEST · Priya Shah     | —                   | referral  | 2100 | 1 prospect |
| `onboarding`     | TEST · Dana Chen      | Chen Co             | inbound   | —    | 1 onboarding |
| `active_owner`   | TEST · Lori Henderson | Henderson Holdings  | referral  | —    | 2 live |
| `active_owner`   | TEST · Mike Robertson | —                   | referral  | —    | 1 live |
| `paused`         | TEST · Cathy Marsh    | —                   | referral  | —    | 1 paused (with lifetime history) |

### Properties (7+ records across stages)

- `prospect` x 2 (tied to the leads' potential homes)
- `onboarding` x 1 (Dana Chen's property, 62% setup)
- `listing_review` x 1 (Mike Robertson's, 94% setup)
- `launch_ready` x 1
- `live` x 2 (Lori Henderson's — include cover photo URLs from Unsplash)
- `paused` x 1 (Cathy Marsh's)

### Projects (4+ records)

- `idea` x 1 ("TEST · Add Treasury auto-reconcile")
- `feature_build` x 1 ("TEST · Rebuild owner onboarding wizard")
- `cleaner_onboarding` x 1 linked to a property ("TEST · Onboard Octavio cleaner team")
- `employee_onboarding` x 1

### Tasks (spread across parents and due buckets)

- 3 overdue (1 on a contact, 1 on a property, 1 standalone)
- 2 due today (1 contact, 1 project)
- 3 due this week (mixed parents)
- 2 due later
- 1 no-date
- 1 parent with 5 subtasks, 3 done (to test the expand-inline pattern)

### Notes (sparse)

- 2 notes on the active-owner contacts
- 1 note on the onboarding property

### AI insights (one per severity on distinct parents)

- `info` on a live property
- `recommendation` (Setup Agent) on the onboarding property
- `warning` (Risk Agent) on a contact in `contract_sent`
- `success` (Listing QA) on the `launch_ready` property

### Saved views

Already seeded by Plans A, B, C, D migrations. This plan does not add new saved views.

---

## Task 1: Write the seed SQL

**Files:**
- Create: `apps/web/supabase/seeds/pipeline-dev-seed.sql`

Key pattern — idempotency via constant UUIDs:

```sql
-- apps/web/supabase/seeds/pipeline-dev-seed.sql
-- Development seed for the pipeline system. Run via `pnpm --filter web db:seed-pipeline`.
-- Every row uses a deterministic UUID (md5-based) so re-runs upsert instead of duplicating.
-- Every human-readable field is prefixed with "TEST ·".
-- NEVER run this in production.

do $$
declare
  admin_user uuid;
begin
  -- Pick any admin user to attribute seed rows to
  select id into admin_user from profiles where role = 'admin' order by created_at limit 1;
  if admin_user is null then
    raise exception 'No admin user found. Create an admin first.';
  end if;

  -- Helper: deterministic UUID from a namespace+key
  -- uuid_generate_v5 requires the extension; use md5 + ::uuid as a portable fallback.
  -- Example: ('seed.contact.sarah-johnson')::uuid derived via md5.

  -- Upsert contacts
  insert into contacts (id, profile_id, full_name, company_name, email, source, source_detail, lifecycle_stage, estimated_mrr, last_activity_at, created_at)
  values
    (('0000a000-0000-0000-0000-' || substring(md5('seed.contact.avery-barlow'), 1, 12))::uuid, null, 'TEST · Avery Barlow', 'Barlow Rentals LLC', 'avery@example.test', 'instagram', null, 'lead_new', 1800, now() - interval '3 days', now() - interval '3 days'),
    (('0000a000-0000-0000-0000-' || substring(md5('seed.contact.sarah-johnson'), 1, 12))::uuid, null, 'TEST · Sarah Johnson', 'Oak Industries LLC', 'sarah@example.test', 'referral', 'Mike R.', 'qualified', 3200, now() - interval '4 days', now() - interval '12 days'),
    (('0000a000-0000-0000-0000-' || substring(md5('seed.contact.marcus-reyes'), 1, 12))::uuid, null, 'TEST · Marcus Reyes', 'Reyes Holdings', 'marcus@example.test', 'website', null, 'in_discussion', 1500, now() - interval '8 days', now() - interval '18 days'),
    (('0000a000-0000-0000-0000-' || substring(md5('seed.contact.priya-shah'), 1, 12))::uuid, null, 'TEST · Priya Shah', null, 'priya@example.test', 'referral', 'Cathy M.', 'contract_sent', 2100, now() - interval '2 days', now() - interval '25 days'),
    (('0000a000-0000-0000-0000-' || substring(md5('seed.contact.dana-chen'), 1, 12))::uuid, null, 'TEST · Dana Chen', 'Chen Co', 'dana@example.test', 'inbound', null, 'onboarding', null, now() - interval '1 day', now() - interval '40 days'),
    (('0000a000-0000-0000-0000-' || substring(md5('seed.contact.lori-henderson'), 1, 12))::uuid, null, 'TEST · Lori Henderson', 'Henderson Holdings', 'lori@example.test', 'referral', null, 'active_owner', null, now() - interval '6 hours', now() - interval '360 days'),
    (('0000a000-0000-0000-0000-' || substring(md5('seed.contact.mike-robertson'), 1, 12))::uuid, null, 'TEST · Mike Robertson', null, 'mike@example.test', 'referral', null, 'active_owner', null, now() - interval '3 days', now() - interval '200 days'),
    (('0000a000-0000-0000-0000-' || substring(md5('seed.contact.cathy-marsh'), 1, 12))::uuid, null, 'TEST · Cathy Marsh', null, 'cathy@example.test', 'referral', null, 'paused', null, now() - interval '42 days', now() - interval '760 days')
  on conflict (id) do update set
    full_name = excluded.full_name,
    company_name = excluded.company_name,
    email = excluded.email,
    lifecycle_stage = excluded.lifecycle_stage,
    estimated_mrr = excluded.estimated_mrr,
    last_activity_at = excluded.last_activity_at,
    source = excluded.source,
    source_detail = excluded.source_detail;

  -- Upsert properties
  insert into properties (id, contact_id, nickname, address_line_1, city, state, zip, status, cover_photo_url, created_at)
  values
    (('0000b000-0000-0000-0000-' || substring(md5('seed.prop.dana-onb'), 1, 12))::uuid,
     ('0000a000-0000-0000-0000-' || substring(md5('seed.contact.dana-chen'), 1, 12))::uuid,
     'TEST · 5629 NE 129th Pl', '5629 NE 129th Pl', 'Vancouver', 'WA', '98682',
     'onboarding', 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800', now() - interval '5 days'),
    (('0000b000-0000-0000-0000-' || substring(md5('seed.prop.mike-review'), 1, 12))::uuid,
     ('0000a000-0000-0000-0000-' || substring(md5('seed.contact.mike-robertson'), 1, 12))::uuid,
     'TEST · 19 S Edison St', '19 S Edison St', 'Kennewick', 'WA', '99336',
     'listing_review', 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800', now() - interval '12 days'),
    (('0000b000-0000-0000-0000-' || substring(md5('seed.prop.ready'), 1, 12))::uuid,
     ('0000a000-0000-0000-0000-' || substring(md5('seed.contact.lori-henderson'), 1, 12))::uuid,
     'TEST · 34 Downing Drive', '34 Downing Drive', 'Newark', 'DE', '19711',
     'launch_ready', 'https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=800', now() - interval '30 days'),
    (('0000b000-0000-0000-0000-' || substring(md5('seed.prop.live-1'), 1, 12))::uuid,
     ('0000a000-0000-0000-0000-' || substring(md5('seed.contact.lori-henderson'), 1, 12))::uuid,
     'TEST · 1228 Stardust Way', '1228 Stardust Way', 'Pasco', 'WA', '99301',
     'live', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800', now() - interval '200 days'),
    (('0000b000-0000-0000-0000-' || substring(md5('seed.prop.live-2'), 1, 12))::uuid,
     ('0000a000-0000-0000-0000-' || substring(md5('seed.contact.lori-henderson'), 1, 12))::uuid,
     'TEST · 442 Cherry Lane', '442 Cherry Lane', 'Walla Walla', 'WA', '99362',
     'live', 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800', now() - interval '150 days'),
    (('0000b000-0000-0000-0000-' || substring(md5('seed.prop.paused'), 1, 12))::uuid,
     ('0000a000-0000-0000-0000-' || substring(md5('seed.contact.cathy-marsh'), 1, 12))::uuid,
     'TEST · 88 Vine St', '88 Vine St', 'Spokane', 'WA', '99207',
     'paused', 'https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?w=800', now() - interval '760 days')
  on conflict (id) do update set
    contact_id = excluded.contact_id,
    nickname = excluded.nickname,
    address_line_1 = excluded.address_line_1,
    city = excluded.city, state = excluded.state, zip = excluded.zip,
    status = excluded.status,
    cover_photo_url = excluded.cover_photo_url;

  -- Upsert projects
  insert into projects (id, name, description, project_type, status, owner_user_id, target_date, linked_property_id, emoji, created_at)
  values
    (('0000c000-0000-0000-0000-' || substring(md5('seed.proj.idea-1'), 1, 12))::uuid,
     'TEST · Add Treasury auto-reconcile',
     'Auto-reconcile Plaid transactions against Stripe invoices every 24h.',
     'idea', 'not_started', admin_user, null, null, '💡', now() - interval '5 days'),
    (('0000c000-0000-0000-0000-' || substring(md5('seed.proj.feature-1'), 1, 12))::uuid,
     'TEST · Rebuild owner onboarding wizard',
     'Replace 13-step wizard with 5 grouped steps.',
     'feature_build', 'in_progress', admin_user, current_date + 21, null, '🛠', now() - interval '14 days'),
    (('0000c000-0000-0000-0000-' || substring(md5('seed.proj.cleaner-1'), 1, 12))::uuid,
     'TEST · Onboard Octavio cleaner team',
     'Training + checklists + access setup.',
     'cleaner_onboarding', 'in_progress', admin_user, current_date + 10,
     ('0000b000-0000-0000-0000-' || substring(md5('seed.prop.live-1'), 1, 12))::uuid,
     '🧼', now() - interval '7 days'),
    (('0000c000-0000-0000-0000-' || substring(md5('seed.proj.employee-1'), 1, 12))::uuid,
     'TEST · Onboard new VA Aria',
     'First 30 days checklist.',
     'employee_onboarding', 'not_started', admin_user, current_date + 30, null, '👋', now() - interval '1 day')
  on conflict (id) do update set
    name = excluded.name,
    status = excluded.status,
    target_date = excluded.target_date,
    linked_property_id = excluded.linked_property_id;

  -- Upsert tasks across parents + due buckets
  insert into tasks (id, parent_type, parent_id, title, status, assignee_id, created_by, due_at)
  values
    -- Overdue
    (('0000d000-0000-0000-0000-' || substring(md5('seed.task.overdue-1'), 1, 12))::uuid,
     'contact', ('0000a000-0000-0000-0000-' || substring(md5('seed.contact.sarah-johnson'), 1, 12))::uuid,
     'TEST · Send updated proposal to Sarah', 'todo', admin_user, admin_user, now() - interval '4 days'),
    (('0000d000-0000-0000-0000-' || substring(md5('seed.task.overdue-2'), 1, 12))::uuid,
     'property', ('0000b000-0000-0000-0000-' || substring(md5('seed.prop.mike-review'), 1, 12))::uuid,
     'TEST · Confirm parking instructions at 19 S Edison', 'todo', admin_user, admin_user, now() - interval '2 days'),
    (('0000d000-0000-0000-0000-' || substring(md5('seed.task.overdue-3'), 1, 12))::uuid,
     null, null,
     'TEST · Call Mike R. about new referral', 'todo', admin_user, admin_user, now() - interval '1 day'),

    -- Today
    (('0000d000-0000-0000-0000-' || substring(md5('seed.task.today-1'), 1, 12))::uuid,
     'property', ('0000b000-0000-0000-0000-' || substring(md5('seed.prop.live-2'), 1, 12))::uuid,
     'TEST · Review block request for 1228 Stardust (May 4–7)', 'todo', admin_user, admin_user, now()),
    (('0000d000-0000-0000-0000-' || substring(md5('seed.task.today-2'), 1, 12))::uuid,
     'project', ('0000c000-0000-0000-0000-' || substring(md5('seed.proj.feature-1'), 1, 12))::uuid,
     'TEST · Ship wizard step 1 prototype', 'todo', admin_user, admin_user, now()),

    -- This week
    (('0000d000-0000-0000-0000-' || substring(md5('seed.task.week-1'), 1, 12))::uuid,
     'contact', ('0000a000-0000-0000-0000-' || substring(md5('seed.contact.dana-chen'), 1, 12))::uuid,
     'TEST · Upload listing photos for 5629 NE 129th', 'todo', admin_user, admin_user, now() + interval '3 days'),
    (('0000d000-0000-0000-0000-' || substring(md5('seed.task.week-2'), 1, 12))::uuid,
     'project', ('0000c000-0000-0000-0000-' || substring(md5('seed.proj.cleaner-1'), 1, 12))::uuid,
     'TEST · Send training deck to Octavio', 'todo', admin_user, admin_user, now() + interval '4 days'),
    (('0000d000-0000-0000-0000-' || substring(md5('seed.task.week-3'), 1, 12))::uuid,
     'contact', ('0000a000-0000-0000-0000-' || substring(md5('seed.contact.priya-shah'), 1, 12))::uuid,
     'TEST · Chase countersigned contract', 'todo', admin_user, admin_user, now() + interval '5 days'),

    -- Later
    (('0000d000-0000-0000-0000-' || substring(md5('seed.task.later-1'), 1, 12))::uuid,
     'project', ('0000c000-0000-0000-0000-' || substring(md5('seed.proj.idea-1'), 1, 12))::uuid,
     'TEST · Spike: Plaid transaction categorization', 'todo', admin_user, admin_user, now() + interval '18 days'),
    (('0000d000-0000-0000-0000-' || substring(md5('seed.task.later-2'), 1, 12))::uuid,
     'contact', ('0000a000-0000-0000-0000-' || substring(md5('seed.contact.cathy-marsh'), 1, 12))::uuid,
     'TEST · Check-in call with Cathy (win-back)', 'todo', admin_user, admin_user, now() + interval '45 days'),

    -- No date
    (('0000d000-0000-0000-0000-' || substring(md5('seed.task.none-1'), 1, 12))::uuid,
     null, null,
     'TEST · Review Hubflow handoff notes', 'todo', admin_user, admin_user, null),

    -- Parent with subtasks
    (('0000d000-0000-0000-0000-' || substring(md5('seed.task.parent-1'), 1, 12))::uuid,
     'project', ('0000c000-0000-0000-0000-' || substring(md5('seed.proj.cleaner-1'), 1, 12))::uuid,
     'TEST · Cleaner walkthrough video recording', 'todo', admin_user, admin_user, now() - interval '1 day')
  on conflict (id) do update set
    title = excluded.title,
    status = excluded.status,
    assignee_id = excluded.assignee_id,
    due_at = excluded.due_at;

  -- Subtasks for the parent task above
  insert into tasks (id, parent_task_id, title, status, assignee_id, created_by)
  values
    (('0000d000-0000-0000-0000-' || substring(md5('seed.task.sub-1'), 1, 12))::uuid,
     ('0000d000-0000-0000-0000-' || substring(md5('seed.task.parent-1'), 1, 12))::uuid,
     'TEST · Record bedroom sequence', 'done', admin_user, admin_user),
    (('0000d000-0000-0000-0000-' || substring(md5('seed.task.sub-2'), 1, 12))::uuid,
     ('0000d000-0000-0000-0000-' || substring(md5('seed.task.parent-1'), 1, 12))::uuid,
     'TEST · Record kitchen sequence', 'done', admin_user, admin_user),
    (('0000d000-0000-0000-0000-' || substring(md5('seed.task.sub-3'), 1, 12))::uuid,
     ('0000d000-0000-0000-0000-' || substring(md5('seed.task.parent-1'), 1, 12))::uuid,
     'TEST · Record bathroom sequence', 'done', admin_user, admin_user),
    (('0000d000-0000-0000-0000-' || substring(md5('seed.task.sub-4'), 1, 12))::uuid,
     ('0000d000-0000-0000-0000-' || substring(md5('seed.task.parent-1'), 1, 12))::uuid,
     'TEST · Record exterior walkthrough', 'todo', admin_user, admin_user),
    (('0000d000-0000-0000-0000-' || substring(md5('seed.task.sub-5'), 1, 12))::uuid,
     ('0000d000-0000-0000-0000-' || substring(md5('seed.task.parent-1'), 1, 12))::uuid,
     'TEST · Edit final cut', 'todo', admin_user, admin_user)
  on conflict (id) do update set title = excluded.title, status = excluded.status;

  -- Notes (sparse)
  insert into notes (id, parent_type, parent_id, body, author_id)
  values
    (('0000e000-0000-0000-0000-' || substring(md5('seed.note.1'), 1, 12))::uuid,
     'contact', ('0000a000-0000-0000-0000-' || substring(md5('seed.contact.lori-henderson'), 1, 12))::uuid,
     'TEST · Loves quick turnovers. Responds fastest on text.', admin_user),
    (('0000e000-0000-0000-0000-' || substring(md5('seed.note.2'), 1, 12))::uuid,
     'contact', ('0000a000-0000-0000-0000-' || substring(md5('seed.contact.sarah-johnson'), 1, 12))::uuid,
     'TEST · Mike R. referral — already has 2 homes ready to list.', admin_user),
    (('0000e000-0000-0000-0000-' || substring(md5('seed.note.3'), 1, 12))::uuid,
     'property', ('0000b000-0000-0000-0000-' || substring(md5('seed.prop.dana-onb'), 1, 12))::uuid,
     'TEST · Owner wants photos redone before launch. Tue afternoon pencilled in.', admin_user)
  on conflict (id) do update set body = excluded.body;

  -- AI insights (one per severity on distinct parents)
  insert into ai_insights (id, parent_type, parent_id, agent_key, severity, title, body, action_label)
  values
    (('0000f000-0000-0000-0000-' || substring(md5('seed.ai.info'), 1, 12))::uuid,
     'property', ('0000b000-0000-0000-0000-' || substring(md5('seed.prop.live-1'), 1, 12))::uuid,
     'performance_agent', 'info',
     'Performance Agent',
     '1228 Stardust Way is pacing 12% above last month. Consider a nightly rate bump of $15.',
     'Adjust pricing'),
    (('0000f000-0000-0000-0000-' || substring(md5('seed.ai.recommendation'), 1, 12))::uuid,
     'property', ('0000b000-0000-0000-0000-' || substring(md5('seed.prop.dana-onb'), 1, 12))::uuid,
     'setup_agent', 'recommendation',
     'Setup Agent',
     'Listing photos pending 4+ days. 7 of 11 recent onboardings stall here. Nudge owner?',
     'Draft nudge'),
    (('0000f000-0000-0000-0000-' || substring(md5('seed.ai.warning'), 1, 12))::uuid,
     'contact', ('0000a000-0000-0000-0000-' || substring(md5('seed.contact.priya-shah'), 1, 12))::uuid,
     'risk_agent', 'warning',
     'Risk Agent',
     'Contract sent 2 days ago. No response. Follow up today to avoid losing this deal.',
     'Follow up'),
    (('0000f000-0000-0000-0000-' || substring(md5('seed.ai.success'), 1, 12))::uuid,
     'property', ('0000b000-0000-0000-0000-' || substring(md5('seed.prop.ready'), 1, 12))::uuid,
     'listing_qa', 'success',
     'Listing QA',
     'All photos approved. Hospitable sync clean. Ready to launch.',
     null)
  on conflict (id) do update set
    severity = excluded.severity,
    title = excluded.title,
    body = excluded.body,
    action_label = excluded.action_label;

end $$;

-- Helpful summary select (not a side-effect; just for the seed runner to echo)
select
  (select count(*) from contacts   where full_name like 'TEST · %')   as seed_contacts,
  (select count(*) from properties where nickname  like 'TEST · %')   as seed_properties,
  (select count(*) from projects   where name      like 'TEST · %')   as seed_projects,
  (select count(*) from tasks      where title     like 'TEST · %')   as seed_tasks,
  (select count(*) from notes      where body      like 'TEST · %')   as seed_notes,
  (select count(*) from ai_insights where parent_type in ('contact','property','project')) as ai_insights;
```

Commit.

---

## Task 2: CLI wrapper

**Files:**
- Create: `apps/web/scripts/seed-pipeline.ts`

```ts
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Safety guard: refuse obvious production references.
const PROD_MARKERS = ['prod', 'production'];
if (PROD_MARKERS.some((m) => url.toLowerCase().includes(m))) {
  console.error(`Refusing to seed: ${url} looks like production.`);
  process.exit(1);
}

const sql = readFileSync(
  new URL('../supabase/seeds/pipeline-dev-seed.sql', import.meta.url),
  'utf-8',
);

const supabase = createClient(url, key, { auth: { persistSession: false } });

// Supabase REST does not expose raw SQL directly; use `rpc('exec_sql')` if a helper exists,
// otherwise fall back to the `supabase` CLI.
try {
  const { error } = await supabase.rpc('exec_sql' as never, { query: sql } as never);
  if (error) throw error;
  console.log('Seed applied successfully.');
} catch (err) {
  console.error('RPC exec_sql failed. Run via the Supabase SQL editor or `supabase db execute`.');
  console.error((err as Error).message);
  process.exit(1);
}
```

If your project doesn't have an `exec_sql` RPC (standard), instead use the MCP `mcp__claude_ai_Supabase__execute_sql` tool from a Claude session, or pipe the SQL through psql:

```bash
PGPASSWORD=... psql "$DATABASE_URL" -f apps/web/supabase/seeds/pipeline-dev-seed.sql
```

Document both paths in the script header as a comment.

- [ ] **Step 1: Add the npm script**

In `apps/web/package.json`, add:

```json
{
  "scripts": {
    "db:seed-pipeline": "tsx scripts/seed-pipeline.ts"
  }
}
```

Commit.

---

## Task 3: Run the seed and verify

- [ ] **Step 1: Apply**

```bash
cd /Users/johanannunez/workspace/parcel
pnpm --filter web db:seed-pipeline
```

Or via MCP:

```
mcp__claude_ai_Supabase__execute_sql
  project_id: pwoxwpryummqeqsxdgyc
  query: <contents of pipeline-dev-seed.sql>
```

Expected output (or run the summary select manually):

```
seed_contacts   | 8
seed_properties | 6
seed_projects   | 4
seed_tasks      | 17
seed_notes      | 3
ai_insights     | 4
```

- [ ] **Step 2: Idempotency check**

Run the seed a second time. Counts must not change.

- [ ] **Step 3: Visual verification**

Start dev, open each pipeline page:

```bash
pnpm --filter web dev
```

- `http://localhost:4000/admin/contacts?view=lead-pipeline&mode=status` → Kanban with Sarah Johnson, Avery Barlow, Marcus Reyes, Priya Shah.
- `http://localhost:4000/admin/properties?mode=status` → onboarding, listing_review, launch_ready, live, paused all populated.
- `http://localhost:4000/admin/projects?mode=status` → 4 projects across statuses.
- `http://localhost:4000/admin/tasks` → every due-bucket populated, at least one parent pill of each color visible.
- Click into Sarah Johnson → OverviewLead renders with $3,200 opportunity, Referral · Mike R., 12 days in stage.
- Click into Cathy Marsh → OverviewDormant renders with paused messaging.

- [ ] **Step 4: Commit**

```bash
git add apps/web/supabase/seeds/pipeline-dev-seed.sql \
       apps/web/scripts/seed-pipeline.ts \
       apps/web/package.json
git commit -m "feat(dev): idempotent seed script for pipeline + tasks + AI insights"
```

---

## Task 4: Post-seed smoke spec

**Files:**
- Create: `apps/web/e2e/seed-smoke.spec.ts`

```ts
import { test, expect } from '@playwright/test';

test.describe('Seed smoke', () => {
  test('Contacts lead pipeline has TEST · seeded leads', async ({ page }) => {
    await page.goto('/admin/contacts?view=lead-pipeline');
    for (const name of ['Sarah Johnson', 'Avery Barlow', 'Marcus Reyes', 'Priya Shah']) {
      await expect(page.getByText(`TEST · ${name}`)).toBeVisible();
    }
  });

  test('Properties status view shows all stage columns populated', async ({ page }) => {
    await page.goto('/admin/properties?mode=status');
    for (const label of ['ONBOARDING', 'LISTING REVIEW', 'LIVE', 'PAUSED']) {
      await expect(page.getByText(label)).toBeVisible();
    }
  });

  test('Tasks inbox has every due bucket populated', async ({ page }) => {
    await page.goto('/admin/tasks');
    for (const label of ['OVERDUE', 'TODAY', 'THIS WEEK', 'LATER']) {
      await expect(page.getByText(label, { exact: false })).toBeVisible();
    }
  });

  test('AI insights render on at least one card', async ({ page }) => {
    await page.goto('/admin/properties?mode=status');
    await expect(page.getByText(/Setup Agent|Listing QA|Performance Agent/)).toBeVisible();
  });
});
```

Commit.

---

## Task 5: Final checklist

- [ ] Every admin page renders with real content from the seed on first open.
- [ ] Re-running the seed does not duplicate rows.
- [ ] `pnpm --filter web typecheck && pnpm --filter web build` pass.
- [ ] All Playwright specs from Plans A–F pass.
- [ ] Screenshots for every pipeline (Status / Gallery / Compact modes) captured and saved as baselines:

```bash
node screenshot.mjs "http://localhost:4000/admin/contacts" "f-contacts-compact" --update-baseline
node screenshot.mjs "http://localhost:4000/admin/contacts?mode=status" "f-contacts-status" --update-baseline
node screenshot.mjs "http://localhost:4000/admin/properties?mode=status" "f-properties-status" --update-baseline
node screenshot.mjs "http://localhost:4000/admin/projects?mode=status" "f-projects-status" --update-baseline
node screenshot.mjs "http://localhost:4000/admin/tasks" "f-tasks" --update-baseline
```

- [ ] Update the spec file to note Plan F shipped.

---

## Ship criterion recap

- One command (`pnpm --filter web db:seed-pipeline`) loads 8 contacts / 6 properties / 4 projects / 17 tasks / 3 notes / 4 AI insights.
- Rerunning the command is safe.
- Every pipeline page renders a rich, realistic state out of the box.
- All TEST rows are clearly marked and removable with a single DELETE filter.
