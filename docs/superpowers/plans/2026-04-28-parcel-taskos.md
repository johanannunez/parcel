# Parcel TaskOS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Todoist-quality native task management system in Parcel with direct Fantastical calendar integration via CalDAV, iPhone/Mac quick capture via Apple Shortcuts, internal project tracking, and a redesigned owner portal task experience.

**Architecture:** Parcel is the single source of truth. A CalDAV server lives in Next.js middleware (Edge runtime) so Fantastical can connect directly with no intermediary. A `/api/tasks/quick-add` endpoint powers an Apple Shortcut for Siri/lock screen/menu bar capture. The admin UI is rebuilt to match Todoist's UX: Today/Upcoming/Inbox views, priority levels (P1-P4), a task detail drawer, and global quick capture (Cmd+T).

**Tech Stack:** Next.js 16 App Router, Supabase (PostgreSQL), TypeScript strict, Tailwind v4, motion/react, Playwright (already installed), chrono-node (to install), date-fns (already installed).

---

## Milestone 1: Integration Foundation
Delivers: Fantastical connects to Parcel. Apple Shortcut creates tasks. No UI changes.

---

### Task 1: DB Migrations

**Files:**
- Create: `apps/web/supabase/migrations/20260428000001_task_priority_caldav.sql`
- Create: `apps/web/supabase/migrations/20260428000002_projects_table.sql`
- Create: `apps/web/supabase/migrations/20260428000003_api_tokens.sql`

- [ ] **Step 1: Write migration 1 -- task columns**

```sql
-- apps/web/supabase/migrations/20260428000001_task_priority_caldav.sql
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS priority integer NOT NULL DEFAULT 4,
  ADD COLUMN IF NOT EXISTS caldav_uid text UNIQUE,
  ADD COLUMN IF NOT EXISTS caldav_etag text;

COMMENT ON COLUMN tasks.priority IS '1=Urgent 2=High 3=Medium 4=None';
COMMENT ON COLUMN tasks.caldav_uid IS 'Stable CalDAV UID, format: task-{id}@parcelco.com';

CREATE INDEX IF NOT EXISTS tasks_caldav_uid_idx
  ON tasks (caldav_uid)
  WHERE caldav_uid IS NOT NULL;
```

- [ ] **Step 2: Write migration 2 -- projects table**

```sql
-- apps/web/supabase/migrations/20260428000002_projects_table.sql
CREATE TABLE IF NOT EXISTS projects (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  description text,
  color       text NOT NULL DEFAULT '#c17b4e',
  status      text NOT NULL DEFAULT 'active',
  created_by  uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at  timestamptz DEFAULT now() NOT NULL,
  updated_at  timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT projects_status_check CHECK (status IN ('active','archived','completed'))
);

CREATE INDEX IF NOT EXISTS projects_status_idx ON projects (status);
```

- [ ] **Step 3: Write migration 3 -- api_tokens table**

```sql
-- apps/web/supabase/migrations/20260428000003_api_tokens.sql
CREATE TABLE IF NOT EXISTS api_tokens (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name         text NOT NULL,
  token_hash   text NOT NULL UNIQUE,
  last_used_at timestamptz,
  created_at   timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS api_tokens_profile_idx ON api_tokens (profile_id);
CREATE INDEX IF NOT EXISTS api_tokens_hash_idx ON api_tokens (token_hash);
```

- [ ] **Step 4: Apply migrations via Supabase MCP**

Apply each migration to project `pwoxwpryummqeqsxdgyc` using the `apply_migration` MCP tool. Apply in order: migration 1, then 2, then 3.

- [ ] **Step 5: Verify columns exist**

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'tasks'
  AND column_name IN ('priority','caldav_uid','caldav_etag');
-- Expected: 3 rows returned
```

- [ ] **Step 6: Commit**

```bash
git add apps/web/supabase/migrations/
git commit -m "db: add priority/caldav columns to tasks, projects table, api_tokens table"
```

---

### Task 2: TypeScript Types + caldav_uid Generation

**Files:**
- Modify: `apps/web/src/lib/admin/task-types.ts`
- Modify: `apps/web/src/lib/admin/task-actions.ts`
- Modify: `apps/web/src/lib/admin/tasks-list.ts`

- [ ] **Step 1: Add priority to Task type in task-types.ts**

```typescript
export type Task = {
  id: string;
  parentTaskId: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: 1 | 2 | 3 | 4;       // ADD -- 1=Urgent, 2=High, 3=Medium, 4=None
  assigneeId: string | null;
  assigneeName: string | null;
  assigneeAvatarUrl: string | null;
  createdById: string | null;
  createdByName: string | null;
  dueAt: string | null;
  completedAt: string | null;
  createdAt: string;
  parent: TaskParent | null;
  subtaskCount: number;
  subtaskDoneCount: number;
};
```

- [ ] **Step 2: Add priority to CreateTaskInput in task-actions.ts**

Add one field to the existing `CreateTaskInput` type:

```typescript
export type CreateTaskInput = {
  // ...all existing fields...
  priority?: 1 | 2 | 3 | 4;       // ADD
};
```

- [ ] **Step 3: Generate caldav_uid and include priority in createTask insert**

In the `createTask` function body, add before the `row` object:

```typescript
  const caldav_uid = `task-${crypto.randomUUID()}@parcelco.com`;
```

Add to the `row` object:

```typescript
    priority: input.priority ?? 4,   // ADD
    caldav_uid,                       // ADD
```

Cast `row` as `as any` at insert time since caldav_uid/priority are not yet in the generated Supabase types (established pattern in this codebase for ungenerated columns).

- [ ] **Step 4: Add priority to the task select and object construction in tasks-list.ts**

In `fetchAdminTasksList`, update the `.select()` string to include `priority`. In the task object construction loop, add:

```typescript
priority: ((raw as any).priority ?? 4) as 1 | 2 | 3 | 4,
```

- [ ] **Step 5: Typecheck**

```bash
cd /Users/johanannunez/workspace/parcel/apps/web
pnpm exec tsc --noEmit
# Expected: 0 errors
```

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/lib/admin/task-types.ts \
        apps/web/src/lib/admin/task-actions.ts \
        apps/web/src/lib/admin/tasks-list.ts
git commit -m "feat: add priority field and caldav_uid generation to task system"
```

---

### Task 3: Auth Token Utility (Edge-Compatible)

**Files:**
- Create: `apps/web/src/lib/api-tokens.ts`
- Create: `apps/web/src/app/api/admin/tokens/route.ts`

- [ ] **Step 1: Write api-tokens.ts**

Create `apps/web/src/lib/api-tokens.ts`:

```typescript
// Edge-compatible. Uses Web Crypto API only -- no Node.js deps.

export async function hashToken(token: string): Promise<string> {
  const data = new TextEncoder().encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyApiToken(
  providedToken: string,
  supabaseClient: { from: Function },
): Promise<{ profileId: string; tokenId: string } | null> {
  const hash = await hashToken(providedToken);
  const { data } = await (supabaseClient as any)
    .from('api_tokens')
    .select('id, profile_id')
    .eq('token_hash', hash)
    .single();
  if (!data) return null;

  // Fire-and-forget last_used_at update
  void (supabaseClient as any)
    .from('api_tokens')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', data.id);

  return { profileId: data.profile_id, tokenId: data.id };
}
```

- [ ] **Step 2: Write token management API route**

Create `apps/web/src/app/api/admin/tokens/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateToken, hashToken } from '@/lib/api-tokens';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name } = await request.json() as { name: string };
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 });

  const token = generateToken();
  const hash = await hashToken(token);

  const { data: profile } = await supabase
    .from('profiles').select('id').eq('user_id', user.id).single();
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

  const { data, error } = await (supabase as any)
    .from('api_tokens')
    .insert({ profile_id: profile.id, name: name.trim(), token_hash: hash })
    .select('id, name, created_at')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Return plaintext token ONCE. Never stored, never retrievable again.
  return NextResponse.json({ ...data, token });
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles').select('id').eq('user_id', user.id).single();
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

  const { data } = await (supabase as any)
    .from('api_tokens')
    .select('id, name, last_used_at, created_at')
    .eq('profile_id', profile.id)
    .order('created_at', { ascending: false });

  return NextResponse.json(data ?? []);
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await request.json() as { id: string };
  await (supabase as any).from('api_tokens').delete().eq('id', id);
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Test token creation**

```bash
# Start dev server: pnpm dev (port 4000)
# Log in via browser, copy session cookie, then:
curl -X POST http://localhost:4000/api/admin/tokens \
  -H "Content-Type: application/json" \
  -H "Cookie: <your-session-cookie>" \
  -d '{"name":"Apple Shortcut"}'
# Expected: {"id":"...","name":"Apple Shortcut","created_at":"...","token":"<64-char-hex>"}
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/lib/api-tokens.ts \
        apps/web/src/app/api/admin/tokens/
git commit -m "feat: api token generation and verification utility (Edge-compatible SHA-256)"
```

---

### Task 4: CalDAV VTODO Utilities

**Files:**
- Create: `apps/web/src/lib/caldav-utils.ts`
- Create: `apps/web/scripts/test-caldav-utils.ts`

- [ ] **Step 1: Write caldav-utils.ts**

Create `apps/web/src/lib/caldav-utils.ts`:

```typescript
import { format } from 'date-fns';

// CalDAV PRIORITY uses 1-9 scale. 1=highest priority.
const PRIORITY_MAP: Record<number, number> = { 1: 1, 2: 3, 3: 5, 4: 9 };

export interface CalDAVTask {
  id: string;
  caldavUid: string;
  title: string;
  dueAt: string | null;
  status: 'todo' | 'in_progress' | 'blocked' | 'done';
  priority: 1 | 2 | 3 | 4;
  updatedAt: string;
}

export function taskToVTodo(task: CalDAVTask, baseUrl: string): string {
  const uid = task.caldavUid;
  const dtStamp = formatIcalDate(new Date());
  const lastMod = formatIcalDate(new Date(task.updatedAt));
  const icalStatus = task.status === 'done' ? 'COMPLETED' : 'NEEDS-ACTION';
  const priority = PRIORITY_MAP[task.priority] ?? 9;
  const taskUrl = `${baseUrl}/admin/tasks`;

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Parcel//TaskOS//EN',
    'BEGIN:VTODO',
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `LAST-MODIFIED:${lastMod}`,
    `SUMMARY:${escapeIcal(task.title)}`,
    `STATUS:${icalStatus}`,
    `PRIORITY:${priority}`,
    `DESCRIPTION:${taskUrl}`,
  ];

  if (task.dueAt) {
    lines.push(`DUE:${formatIcalDate(new Date(task.dueAt))}`);
  }

  if (task.status === 'done') {
    lines.push(`COMPLETED:${lastMod}`);
  }

  lines.push('END:VTODO', 'END:VCALENDAR');
  return lines.join('\r\n');
}

export function generateETag(updatedAt: string): string {
  return `"${new Date(updatedAt).getTime()}"`;
}

export function parseVTodoStatus(body: string): 'COMPLETED' | 'NEEDS-ACTION' | null {
  const match = body.match(/^STATUS:(.+)$/m);
  if (!match) return null;
  const val = match[1].trim();
  if (val === 'COMPLETED' || val === 'NEEDS-ACTION') return val;
  return null;
}

export function parseVTodoUid(body: string): string | null {
  const match = body.match(/^UID:(.+)$/m);
  return match?.[1]?.trim() ?? null;
}

function formatIcalDate(date: Date): string {
  return format(date, "yyyyMMdd'T'HHmmss'Z'");
}

function escapeIcal(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}
```

- [ ] **Step 2: Write smoke-test script**

Create `apps/web/scripts/test-caldav-utils.ts`:

```typescript
import { taskToVTodo, parseVTodoStatus, parseVTodoUid } from '../src/lib/caldav-utils';

const task = {
  id: 'test-1',
  caldavUid: 'task-test-1@parcelco.com',
  title: 'Test Task; with comma, and backslash\\',
  dueAt: '2026-04-30T15:00:00.000Z',
  status: 'todo' as const,
  priority: 1 as const,
  updatedAt: '2026-04-28T12:00:00.000Z',
};

const vtodo = taskToVTodo(task, 'https://www.theparcelco.com');
console.log(vtodo);

console.assert(vtodo.includes('BEGIN:VTODO'), 'has VTODO block');
console.assert(vtodo.includes('UID:task-test-1@parcelco.com'), 'UID present');
console.assert(vtodo.includes('STATUS:NEEDS-ACTION'), 'correct status');
console.assert(vtodo.includes('PRIORITY:1'), 'priority 1 = urgent = caldav 1');
console.assert(vtodo.includes('DUE:20260430T'), 'has due date');
console.assert(!vtodo.includes('COMPLETED:'), 'no completed stamp for todo');

const statusResult = parseVTodoStatus(vtodo);
console.assert(statusResult === 'NEEDS-ACTION', 'parse status round-trip');

const uidResult = parseVTodoUid(vtodo);
console.assert(uidResult === 'task-test-1@parcelco.com', 'parse uid round-trip');

console.log('All assertions passed.');
```

- [ ] **Step 3: Run smoke test**

```bash
cd /Users/johanannunez/workspace/parcel/apps/web
pnpm exec tsx scripts/test-caldav-utils.ts
# Expected: VTODO printed to console, then "All assertions passed."
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/lib/caldav-utils.ts \
        apps/web/scripts/test-caldav-utils.ts
git commit -m "feat: caldav VTODO formatter and parser utilities with smoke tests"
```

---

### Task 5: CalDAV Middleware

**Files:**
- Create: `apps/web/src/middleware.ts`

Next.js route handlers only support standard HTTP methods (GET, POST, PUT, etc.). CalDAV requires `PROPFIND` and `REPORT`. Next.js `middleware.ts` runs in the Edge runtime BEFORE routing and handles any HTTP method, making it the correct location for CalDAV. The Edge runtime supports `@supabase/supabase-js` and the Web Crypto API needed for token verification.

- [ ] **Step 1: Write middleware.ts**

Create `apps/web/src/middleware.ts`:

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyApiToken } from '@/lib/api-tokens';
import {
  taskToVTodo,
  generateETag,
  parseVTodoStatus,
  parseVTodoUid,
} from '@/lib/caldav-utils';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Well-known discovery redirect for CalDAV auto-configuration
  if (pathname === '/.well-known/caldav') {
    return NextResponse.redirect(new URL('/caldav/', request.url), 301);
  }

  if (!pathname.startsWith('/caldav')) {
    return NextResponse.next();
  }

  const method = request.method.toUpperCase();

  if (method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        Allow: 'OPTIONS, GET, PUT, PROPFIND, REPORT',
        DAV: '1, calendar-access',
        'Content-Length': '0',
      },
    });
  }

  // Authenticate via HTTP Basic auth
  const authHeader = request.headers.get('Authorization') ?? '';
  const profileId = await authenticate(authHeader);
  if (!profileId) {
    return new NextResponse('Unauthorized', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Parcel CalDAV"' },
    });
  }

  const supabase = getServiceClient();

  if (method === 'PROPFIND') return handlePropfind(pathname);
  if (method === 'REPORT') return handleReport(supabase, profileId);
  if (method === 'GET' && pathname.match(/\/caldav\/tasks\/.+\.ics$/)) {
    return handleGet(supabase, profileId, pathname);
  }
  if (method === 'PUT' && pathname.match(/\/caldav\/tasks\/.+\.ics$/)) {
    return handlePut(supabase, profileId, pathname, request);
  }

  return new NextResponse('Method Not Allowed', { status: 405 });
}

async function authenticate(authHeader: string): Promise<string | null> {
  if (!authHeader.startsWith('Basic ')) return null;
  const decoded = atob(authHeader.slice(6));
  const colonIdx = decoded.indexOf(':');
  if (colonIdx === -1) return null;
  const token = decoded.slice(colonIdx + 1);
  if (!token) return null;
  const supabase = getServiceClient();
  const result = await verifyApiToken(token, supabase as any);
  return result?.profileId ?? null;
}

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

function handlePropfind(pathname: string): NextResponse {
  if (pathname === '/caldav/' || pathname === '/caldav') {
    return xmlResponse(`<?xml version="1.0" encoding="UTF-8"?>
<multistatus xmlns="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
  <response>
    <href>/caldav/</href>
    <propstat>
      <prop>
        <resourcetype><principal/></resourcetype>
        <C:calendar-home-set><href>/caldav/</href></C:calendar-home-set>
      </prop>
      <status>HTTP/1.1 200 OK</status>
    </propstat>
  </response>
</multistatus>`, 207);
  }

  return xmlResponse(`<?xml version="1.0" encoding="UTF-8"?>
<multistatus xmlns="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
  <response>
    <href>/caldav/tasks/</href>
    <propstat>
      <prop>
        <displayname>Parcel Tasks</displayname>
        <resourcetype><collection/><C:calendar/></resourcetype>
        <C:supported-calendar-component-set>
          <C:comp name="VTODO"/>
        </C:supported-calendar-component-set>
      </prop>
      <status>HTTP/1.1 200 OK</status>
    </propstat>
  </response>
</multistatus>`, 207);
}

async function handleReport(
  supabase: ReturnType<typeof createClient>,
  profileId: string,
): Promise<NextResponse> {
  const { data: tasks } = await (supabase as any)
    .from('tasks')
    .select('id, caldav_uid, title, due_at, status, priority, updated_at')
    .eq('created_by', profileId)
    .not('due_at', 'is', null)
    .neq('status', 'done')
    .not('caldav_uid', 'is', null);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.theparcelco.com';
  const responses = (tasks ?? []).map((t: any) => {
    const vtodo = taskToVTodo({
      id: t.id,
      caldavUid: t.caldav_uid,
      title: t.title,
      dueAt: t.due_at,
      status: t.status,
      priority: t.priority ?? 4,
      updatedAt: t.updated_at,
    }, baseUrl);
    const etag = generateETag(t.updated_at);
    return `  <response>
    <href>/caldav/tasks/${t.caldav_uid}.ics</href>
    <propstat>
      <prop>
        <getetag>${etag}</getetag>
        <C:calendar-data>${vtodo}</C:calendar-data>
      </prop>
      <status>HTTP/1.1 200 OK</status>
    </propstat>
  </response>`;
  });

  return xmlResponse(`<?xml version="1.0" encoding="UTF-8"?>
<multistatus xmlns="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
${responses.join('\n')}
</multistatus>`, 207);
}

async function handleGet(
  supabase: ReturnType<typeof createClient>,
  profileId: string,
  pathname: string,
): Promise<NextResponse> {
  const uid = extractUid(pathname);
  const { data: task } = await (supabase as any)
    .from('tasks')
    .select('id, caldav_uid, title, due_at, status, priority, updated_at')
    .eq('caldav_uid', uid)
    .eq('created_by', profileId)
    .single();

  if (!task) return new NextResponse('Not Found', { status: 404 });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.theparcelco.com';
  const vtodo = taskToVTodo({
    id: task.id, caldavUid: task.caldav_uid, title: task.title,
    dueAt: task.due_at, status: task.status, priority: task.priority ?? 4,
    updatedAt: task.updated_at,
  }, baseUrl);

  return new NextResponse(vtodo, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      ETag: generateETag(task.updated_at),
    },
  });
}

async function handlePut(
  supabase: ReturnType<typeof createClient>,
  profileId: string,
  pathname: string,
  request: NextRequest,
): Promise<NextResponse> {
  const uid = extractUid(pathname);
  const body = await request.text();
  const newStatus = parseVTodoStatus(body);

  if (newStatus === 'COMPLETED') {
    await (supabase as any)
      .from('tasks')
      .update({ status: 'done', completed_at: new Date().toISOString() })
      .eq('caldav_uid', uid)
      .eq('created_by', profileId);
  }

  return new NextResponse(null, { status: 204 });
}

function extractUid(pathname: string): string {
  return pathname.split('/').pop()?.replace(/\.ics$/, '') ?? '';
}

function xmlResponse(xml: string, status: number): NextResponse {
  return new NextResponse(xml, {
    status,
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}

export const config = {
  matcher: ['/caldav/:path*', '/.well-known/caldav'],
};
```

- [ ] **Step 2: Verify SUPABASE_SERVICE_ROLE_KEY is in Doppler**

```bash
doppler secrets get SUPABASE_SERVICE_ROLE_KEY
# Expected: value printed (not empty)
# If missing: add it -- Supabase project settings > API > service_role key
```

- [ ] **Step 3: Test PROPFIND**

```bash
# Start dev server: pnpm dev
# Create an API token first (Task 3 Step 3)
TOKEN="<your-token>"
AUTH=$(echo -n "jo@johanannunez.com:$TOKEN" | base64)

curl -sv -X PROPFIND http://localhost:4000/caldav/tasks/ \
  -H "Authorization: Basic $AUTH" \
  -H "Depth: 1" \
  -H "Content-Type: application/xml" \
  -d '<?xml version="1.0"?><propfind xmlns="DAV:"><prop><resourcetype/><displayname/></prop></propfind>'
# Expected: HTTP 207, XML body with displayname "Parcel Tasks"
```

- [ ] **Step 4: Test REPORT**

```bash
curl -sv -X REPORT http://localhost:4000/caldav/tasks/ \
  -H "Authorization: Basic $AUTH" \
  -H "Content-Type: application/xml" \
  -d '<?xml version="1.0"?><C:calendar-query xmlns="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav"><prop><C:calendar-data/></prop></C:calendar-query>'
# Expected: HTTP 207, XML with VTODO blocks for tasks that have due_at set
```

- [ ] **Step 5: Test completion PUT**

```bash
# Get a real caldav_uid from the DB for a task with due_at set
# SELECT caldav_uid FROM tasks WHERE due_at IS NOT NULL AND status = 'todo' LIMIT 1;
UID="task-<uuid>@parcelco.com"

curl -sv -X PUT "http://localhost:4000/caldav/tasks/${UID}.ics" \
  -H "Authorization: Basic $AUTH" \
  -H "Content-Type: text/calendar" \
  -d "BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VTODO
UID:${UID}
STATUS:COMPLETED
END:VTODO
END:VCALENDAR"
# Expected: HTTP 204, task status in DB = done
```

- [ ] **Step 6: Connect Fantastical (local test)**

Fantastical > Settings > Accounts > + > Other CalDAV Account > Advanced:
```
User Name:      jo@johanannunez.com
Password:       <api token>
Server Address: localhost
Server Path:    /caldav/tasks/
Port:           4000
Use SSL:        unchecked
```
Confirm tasks with due dates appear in Fantastical calendar view.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/middleware.ts
git commit -m "feat: caldav server in Next.js middleware -- direct Fantastical integration via PROPFIND/REPORT"
```

---

### Task 6: Quick-Add API Endpoint

**Files:**
- Create: `apps/web/src/app/api/tasks/quick-add/route.ts`

- [ ] **Step 1: Install chrono-node**

```bash
cd /Users/johanannunez/workspace/parcel/apps/web
pnpm add chrono-node
# Expected: chrono-node added to package.json dependencies
```

- [ ] **Step 2: Write the quick-add route**

Create `apps/web/src/app/api/tasks/quick-add/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as chrono from 'chrono-node';
import { verifyApiToken } from '@/lib/api-tokens';

export async function POST(request: Request) {
  const authHeader = request.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const token = authHeader.slice(7);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const result = await verifyApiToken(token, supabase as any);
  if (!result) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const body = await request.json() as { title?: string; dueDate?: string; notes?: string };
  const title = body.title?.trim();
  if (!title) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 });
  }

  // Accept ISO date string or natural language ("next monday", "tomorrow", etc.)
  let dueAt: string | null = null;
  if (body.dueDate?.trim()) {
    const parsed = chrono.parseDate(body.dueDate, new Date(), { forwardDate: true });
    if (parsed) {
      dueAt = parsed.toISOString();
    } else {
      const d = new Date(body.dueDate);
      if (!isNaN(d.getTime())) dueAt = d.toISOString();
    }
  }

  const caldavUid = `task-${crypto.randomUUID()}@parcelco.com`;

  const { data, error } = await (supabase as any)
    .from('tasks')
    .insert({
      title,
      created_by: result.profileId,
      due_at: dueAt,
      priority: 4,
      caldav_uid: caldavUid,
      status: 'todo',
    })
    .select('id, title')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.theparcelco.com';
  return NextResponse.json({
    id: data.id,
    title: data.title,
    url: `${appUrl}/admin/tasks`,
  });
}
```

- [ ] **Step 3: Test with curl**

```bash
TOKEN="<your-api-token>"
curl -X POST http://localhost:4000/api/tasks/quick-add \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test from shortcut","dueDate":"next monday"}'
# Expected: {"id":"...","title":"Test from shortcut","url":"http://localhost:4000/admin/tasks"}
# And task appears in Parcel Inbox with due date set to next Monday
```

- [ ] **Step 4: Test NLP date edge cases**

```bash
# "tomorrow" should parse correctly
curl -X POST http://localhost:4000/api/tasks/quick-add \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Tomorrow task","dueDate":"tomorrow"}'

# Empty dueDate should create Inbox task (no due date)
curl -X POST http://localhost:4000/api/tasks/quick-add \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Inbox task"}'
# Expected: task created with due_at = null
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/api/tasks/quick-add/ \
        apps/web/package.json apps/web/pnpm-lock.yaml
git commit -m "feat: quick-add API endpoint with chrono-node NLP date parsing for Apple Shortcuts"
```

---

### Task 7: Apple Shortcut Configuration Guide

**Files:**
- Create: `docs/apple-shortcut-setup.md`

- [ ] **Step 1: Write setup guide**

Create `docs/apple-shortcut-setup.md`:

```markdown
# Parcel Quick-Add: Apple Shortcut Setup

Add tasks to Parcel from anywhere on iPhone, iPad, or Mac -- Siri, lock screen, share sheet, menu bar.

## Step 1: Generate an API Token

In Parcel admin, open Settings > API Tokens > Generate Token.
Name it "Apple Shortcut". Copy the token -- it is shown only once.

## Step 2: Build the Shortcut

Open the Shortcuts app. Create a new shortcut named **Add to Parcel**.

Add these actions in order:

**Action 1: Ask for Input**
Prompt: `What's the task?`
Type: Text
Store result in: `TaskTitle`

**Action 2: Ask for Input**
Prompt: `Due date? (e.g. "tomorrow", "next Friday", or leave blank)`
Type: Text
Allow empty: Yes
Store result in: `DueDate`

**Action 3: Get Contents of URL**
URL: `https://www.theparcelco.com/api/tasks/quick-add`
Method: POST
Headers:
  - Key: `Authorization` / Value: `Bearer YOUR_TOKEN_HERE`
  - Key: `Content-Type` / Value: `application/json`
Request Body: JSON
  - `title`: variable `TaskTitle`
  - `dueDate`: variable `DueDate`

**Action 4: Show Notification**
Title: `Parcel`
Body: `Task added`

## Step 3: Add to Your Devices

| Device | How |
|--------|-----|
| iPhone lock screen | Settings > Lock Screen > Customize > Add Widget > Shortcuts |
| iPhone home screen | Long-press shortcut > Add to Home Screen |
| Mac menu bar | Shortcuts app > right-click shortcut > Add to Menu Bar |
| Siri | Say "Add to Parcel" (shortcut must be named exactly "Add to Parcel") |
| Share sheet | Shortcut settings > Show in Share Sheet |

## Step 4: Test

Run the shortcut. Type a task and an optional due date like "next friday".
The task appears in Parcel admin > Tasks > Inbox within 2 seconds.
If a due date was provided, it also appears in Fantastical on that date.
```

- [ ] **Step 2: Commit**

```bash
git add docs/apple-shortcut-setup.md
git commit -m "docs: Apple Shortcut setup guide for Parcel quick-add integration"
```

---

## Milestone 2: Admin TaskOS UI
Delivers: Today/Upcoming/Inbox views, priority display, task detail drawer, global quick capture.

---

### Task 8: Priority System (TaskRow + TaskForm)

**Files:**
- Modify: `apps/web/src/app/(admin)/admin/tasks/TaskRow.tsx`
- Modify: `apps/web/src/app/(admin)/admin/tasks/TaskRow.module.css`
- Modify: `apps/web/src/components/admin/chrome/create-forms/TaskForm.tsx`

- [ ] **Step 1: Add priority CSS to TaskRow.module.css**

Append to `apps/web/src/app/(admin)/admin/tasks/TaskRow.module.css`:

```css
.p1 { border-left: 3px solid #ef4444; }
.p2 { border-left: 3px solid #f59e0b; }
.p3 { border-left: 3px solid #60a5fa; }
```

- [ ] **Step 2: Apply priority class in TaskRow.tsx**

In the row `div`, add the priority class:

```typescript
const priorityClass =
  task.priority === 1 ? styles.p1 :
  task.priority === 2 ? styles.p2 :
  task.priority === 3 ? styles.p3 : '';

<div className={`${styles.row} ${task.status === 'done' ? styles.rowDone : ''} ${priorityClass}`}>
```

- [ ] **Step 3: Add priority state and selector to TaskForm**

In `TaskForm.tsx`, add state:

```typescript
const [priority, setPriority] = useState<1 | 2 | 3 | 4>(4);
```

Add priority pill UI (above the due date field):

```tsx
<div className={styles.fieldRow}>
  <label className={styles.label}>Priority</label>
  <div className={styles.priorityRow}>
    {([
      [1, 'Urgent', '#ef4444'],
      [2, 'High',   '#f59e0b'],
      [3, 'Medium', '#60a5fa'],
      [4, 'None',   ''],
    ] as const).map(([val, label, color]) => (
      <button
        key={val}
        type="button"
        onClick={() => setPriority(val)}
        className={styles.priorityPill}
        style={
          priority === val && color
            ? { borderColor: color, color, background: `${color}14` }
            : undefined
        }
        aria-pressed={priority === val}
      >
        {label}
      </button>
    ))}
  </div>
</div>
```

Add `priority` to the `createTask` call in the submit handler:

```typescript
await createTask({ ...existingFields, priority });
```

Add CSS (in the TaskForm stylesheet):

```css
.priorityRow { display: flex; gap: 6px; flex-wrap: wrap; }
.priorityPill {
  padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 500;
  border: 1px solid var(--border); background: transparent; cursor: pointer;
  color: var(--text-secondary);
  transition: border-color 0.15s, color 0.15s, background 0.15s;
}
.priorityPill:hover { border-color: var(--border-strong); }
.priorityPill[aria-pressed="true"]:not([style]) {
  background: var(--surface-elevated); border-color: var(--border-strong);
}
```

- [ ] **Step 4: Visual test**

```bash
# Open http://localhost:4000/admin/tasks
# Open the task creation form
# Expected: priority pills (Urgent / High / Medium / None) appear above due date
# Create a P1 task -- red left border appears on the row
# Create a P4 task -- no border
```

- [ ] **Step 5: Typecheck**

```bash
pnpm exec tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/(admin)/admin/tasks/TaskRow.tsx \
        apps/web/src/app/(admin)/admin/tasks/TaskRow.module.css \
        apps/web/src/components/admin/chrome/create-forms/TaskForm.tsx
git commit -m "feat: priority P1-P4 -- colored left border on task rows, pill selector in form"
```

---

### Task 9: New View Filters (Inbox, Today, Upcoming)

**Files:**
- Modify: `apps/web/src/lib/admin/tasks-list.ts`

- [ ] **Step 1: Add Inbox, Today, Upcoming cases to the view switch**

In `fetchAdminTasksList` in `tasks-list.ts`, inside the `switch (activeView.key)` block add:

```typescript
    case 'inbox':
      query = query
        .is('due_at', null)
        .is('parent_task_id', null)
        .neq('status', 'done');
      break;

    case 'today': {
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);
      query = query
        .lte('due_at', endOfToday.toISOString())
        .neq('status', 'done');
      break;
    }

    case 'upcoming': {
      const nowStr = new Date().toISOString();
      const in14 = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
      query = query
        .not('due_at', 'is', null)
        .gte('due_at', nowStr)
        .lte('due_at', in14)
        .neq('status', 'done');
      break;
    }
```

- [ ] **Step 2: Add priority ordering for Today view**

After the switch block, conditionally reapply ordering:

```typescript
  if (activeView.key === 'today') {
    query = (query as any)
      .order('priority', { ascending: true })
      .order('due_at', { ascending: true, nullsFirst: false });
  }
```

- [ ] **Step 3: Change default view to Today**

Find the activeView resolution:

```typescript
  const activeView =
    views.find((v) => v.key === (opts.viewKey ?? 'today')) ??  // was 'my-tasks'
    views.find((v) => v.key === 'today') ??
    views[0];
```

- [ ] **Step 4: Seed new saved_views rows via Supabase MCP**

```sql
INSERT INTO saved_views (key, name, sort_order, entity_type, is_shared)
VALUES
  ('inbox',    'Inbox',    0, 'task', true),
  ('today',    'Today',    1, 'task', true),
  ('upcoming', 'Upcoming', 2, 'task', true)
ON CONFLICT (key) DO NOTHING;

UPDATE saved_views SET sort_order = 3 WHERE key = 'my-tasks'   AND entity_type = 'task';
UPDATE saved_views SET sort_order = 4 WHERE key = 'overdue'    AND entity_type = 'task';
UPDATE saved_views SET sort_order = 5 WHERE key = 'this-week'  AND entity_type = 'task';
UPDATE saved_views SET sort_order = 6 WHERE key = 'unassigned' AND entity_type = 'task';
```

- [ ] **Step 5: Update default tab href in TasksListView.tsx**

Find the line with `'my-tasks'` href check and update:

```typescript
const href = v.key === 'today' ? '/admin/tasks' : `/admin/tasks?view=${v.key}`;
```

- [ ] **Step 6: Test views**

```bash
# http://localhost:4000/admin/tasks -- Today is default
# Create a task with no due date, no parent -> switch to Inbox view, it appears
# Create a task due today -> Today view shows it
# Create a task due 5 days from now -> Upcoming view shows it
# Overdue task -> Today view includes it
```

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/lib/admin/tasks-list.ts \
        apps/web/src/app/(admin)/admin/tasks/TasksListView.tsx
git commit -m "feat: Inbox, Today, Upcoming view filters -- Today is new default landing view"
```

---

### Task 10: Upcoming Calendar Grid View

**Files:**
- Create: `apps/web/src/app/(admin)/admin/tasks/TasksUpcomingView.tsx`
- Create: `apps/web/src/app/(admin)/admin/tasks/TasksUpcomingView.module.css`
- Modify: `apps/web/src/app/(admin)/admin/tasks/TasksListView.tsx`
- Modify: `apps/web/src/app/(admin)/admin/tasks/page.tsx`

- [ ] **Step 1: Write TasksUpcomingView.tsx**

Create `apps/web/src/app/(admin)/admin/tasks/TasksUpcomingView.tsx`:

```typescript
'use client';

import { useMemo } from 'react';
import { format, addDays, startOfDay, isToday, isTomorrow } from 'date-fns';
import type { Task } from '@/lib/admin/task-types';
import styles from './TasksUpcomingView.module.css';

const PRIORITY_COLORS: Record<number, string> = {
  1: '#ef4444',
  2: '#f59e0b',
  3: '#60a5fa',
};

function dayLabel(date: Date): string {
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return format(date, 'EEE MMM d');
}

export function TasksUpcomingView({ tasks, onOpenTask }: {
  tasks: Task[];
  onOpenTask?: (task: Task) => void;
}) {
  const today = startOfDay(new Date());
  const days = useMemo(
    () => Array.from({ length: 14 }, (_, i) => addDays(today, i)),
    [today.getTime()],
  );

  const tasksByDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of tasks) {
      if (!t.dueAt) continue;
      const key = format(startOfDay(new Date(t.dueAt)), 'yyyy-MM-dd');
      const arr = map.get(key) ?? [];
      arr.push(t);
      map.set(key, arr);
    }
    return map;
  }, [tasks]);

  return (
    <div className={styles.grid}>
      {days.map((day) => {
        const key = format(day, 'yyyy-MM-dd');
        const dayTasks = tasksByDay.get(key) ?? [];
        return (
          <div key={key} className={`${styles.row} ${isToday(day) ? styles.rowToday : ''}`}>
            <div className={styles.dayLabel}>
              <span className={styles.dayName}>{dayLabel(day)}</span>
            </div>
            <div className={styles.chips}>
              {dayTasks.length === 0 && <span className={styles.empty}>--</span>}
              {dayTasks.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={styles.chip}
                  style={t.priority < 4 ? { borderLeftColor: PRIORITY_COLORS[t.priority], borderLeftWidth: '3px', borderLeftStyle: 'solid' } : undefined}
                  onClick={() => onOpenTask?.(t)}
                  title={t.title}
                >
                  {t.priority < 4 && (
                    <span
                      className={styles.dot}
                      style={{ background: PRIORITY_COLORS[t.priority] }}
                    />
                  )}
                  <span className={styles.chipTitle}>
                    {t.title.length > 28 ? t.title.slice(0, 28) + '…' : t.title}
                  </span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Write TasksUpcomingView.module.css**

Create `apps/web/src/app/(admin)/admin/tasks/TasksUpcomingView.module.css`:

```css
.grid { display: flex; flex-direction: column; }

.row {
  display: grid;
  grid-template-columns: 130px 1fr;
  gap: 12px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--border);
  align-items: flex-start;
  min-height: 44px;
}

.rowToday {
  border-left: 3px solid #c17b4e;
  background: rgba(193, 123, 78, 0.04);
}

.dayLabel { padding-top: 5px; }
.dayName { font-size: 13px; font-weight: 500; color: var(--text-secondary); }

.chips { display: flex; flex-wrap: wrap; gap: 6px; padding-top: 2px; }

.chip {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 8px; border-radius: 6px;
  background: var(--surface-elevated);
  border: 1px solid var(--border);
  font-size: 12px; color: var(--text-primary); cursor: pointer;
  max-width: 220px; text-align: left;
  transition: background 0.1s;
}
.chip:hover { background: var(--surface-floating); }

.dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.chipTitle { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.empty { color: var(--text-tertiary); font-size: 12px; padding-top: 5px; }
```

- [ ] **Step 3: Wire UpcomingView into page.tsx and TasksListView.tsx**

In `page.tsx`, detect the upcoming view and pass flat task list:

```typescript
const sp = await searchParams;
const viewKey = sp?.view;
const isUpcoming = viewKey === 'upcoming';

// Pass upcomingTasks to TasksListView
const upcomingTasks = isUpcoming ? groups.flatMap((g) => g.tasks) : [];
```

Update `TasksListView` props type to accept `upcomingTasks` and `activeViewKey`. In the render, show `TasksUpcomingView` when `activeViewKey === 'upcoming'` instead of the normal groups list.

In `TasksListView.tsx`:

```typescript
import { TasksUpcomingView } from './TasksUpcomingView';

// In JSX, replace <div className={styles.list}>...</div> with:
{activeView?.key === 'upcoming' ? (
  <TasksUpcomingView tasks={upcomingTasks} onOpenTask={setDrawerTask} />
) : (
  <div className={styles.list}>
    {/* existing groups */}
  </div>
)}
```

- [ ] **Step 4: Visual test**

```bash
# http://localhost:4000/admin/tasks?view=upcoming
# Expected: 14-row grid, today highlighted with copper left border
# Create a task due 3 days from now -- chip appears on correct row
# Click a chip -- task detail drawer opens (Task 11)
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/(admin)/admin/tasks/TasksUpcomingView.tsx \
        apps/web/src/app/(admin)/admin/tasks/TasksUpcomingView.module.css \
        apps/web/src/app/(admin)/admin/tasks/TasksListView.tsx \
        apps/web/src/app/(admin)/admin/tasks/page.tsx
git commit -m "feat: Upcoming view -- 14-day calendar grid with priority-colored task chips"
```

---

### Task 11: Task Detail Drawer

**Files:**
- Create: `apps/web/src/app/(admin)/admin/tasks/TaskDetailDrawer.tsx`
- Create: `apps/web/src/app/(admin)/admin/tasks/TaskDetailDrawer.module.css`
- Modify: `apps/web/src/app/(admin)/admin/tasks/TaskRow.tsx`
- Modify: `apps/web/src/app/(admin)/admin/tasks/TasksListView.tsx`
- Modify: `apps/web/src/lib/admin/task-actions.ts`

- [ ] **Step 1: Extend updateTask to accept priority**

In `task-actions.ts`, add `priority` to the patch type and the update object:

```typescript
  patch: Partial<{
    // ...existing fields...
    priority: 1 | 2 | 3 | 4;   // ADD
  }>,
  // ...
  if (patch.priority !== undefined) (update as any).priority = patch.priority;
```

- [ ] **Step 2: Write TaskDetailDrawer.tsx**

Create `apps/web/src/app/(admin)/admin/tasks/TaskDetailDrawer.tsx`:

```typescript
'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { Task } from '@/lib/admin/task-types';
import { updateTask, completeTask, uncompleteTask } from '@/lib/admin/task-actions';
import { DatePickerInput } from '@/components/admin/DatePickerInput';
import styles from './TaskDetailDrawer.module.css';

const STATUS_LABELS: Record<string, string> = {
  todo: 'To Do', in_progress: 'In Progress', blocked: 'Blocked', done: 'Done',
};

const PRIORITY_OPTIONS = [
  { value: 1 as const, label: 'Urgent', color: '#ef4444' },
  { value: 2 as const, label: 'High',   color: '#f59e0b' },
  { value: 3 as const, label: 'Medium', color: '#60a5fa' },
  { value: 4 as const, label: 'None',   color: '' },
];

export function TaskDetailDrawer({ task, onClose }: { task: Task | null; onClose: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');

  useEffect(() => {
    if (task) { setTitleDraft(task.title); setEditingTitle(false); }
  }, [task?.id]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  const saveTitle = useCallback(() => {
    if (!task || !titleDraft.trim() || titleDraft === task.title) {
      setEditingTitle(false);
      return;
    }
    startTransition(async () => {
      await updateTask(task.id, { title: titleDraft.trim() });
      setEditingTitle(false);
    });
  }, [task, titleDraft]);

  const toggleDone = useCallback(() => {
    if (!task) return;
    startTransition(async () => {
      if (task.status === 'done') await uncompleteTask(task.id);
      else await completeTask(task.id);
    });
  }, [task]);

  return (
    <AnimatePresence>
      {task && (
        <>
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className={styles.drawer}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            <div className={styles.header}>
              <button
                type="button"
                className={`${styles.completeBtn} ${task.status === 'done' ? styles.completeBtnDone : ''}`}
                onClick={toggleDone}
                disabled={isPending}
                aria-label={task.status === 'done' ? 'Mark incomplete' : 'Complete'}
              />
              {editingTitle ? (
                <input
                  className={styles.titleInput}
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onBlur={saveTitle}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveTitle(); }}
                  autoFocus
                />
              ) : (
                <h2
                  className={`${styles.title} ${task.status === 'done' ? styles.titleDone : ''}`}
                  onClick={() => setEditingTitle(true)}
                >
                  {task.title}
                </h2>
              )}
              <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">x</button>
            </div>

            <div className={styles.meta}>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Status</span>
                <span className={`${styles.statusBadge} ${styles[`status_${task.status}`]}`}>
                  {STATUS_LABELS[task.status]}
                </span>
              </div>

              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Priority</span>
                <div className={styles.priorityPills}>
                  {PRIORITY_OPTIONS.map(({ value, label, color }) => (
                    <button
                      key={value}
                      type="button"
                      className={`${styles.priorityPill} ${task.priority === value ? styles.priorityPillActive : ''}`}
                      style={task.priority === value && color ? { borderColor: color, color } : undefined}
                      onClick={() => startTransition(() => (updateTask as any)(task.id, { priority: value }))}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Due</span>
                <DatePickerInput
                  value={task.dueAt ?? ''}
                  onChange={(val) => startTransition(() => updateTask(task.id, { dueAt: val || null }))}
                />
              </div>

              {task.parent && (
                <div className={styles.metaRow}>
                  <span className={styles.metaLabel}>Context</span>
                  <span className={styles.parentPill}>{task.parent.label}</span>
                </div>
              )}
            </div>

            <div className={styles.body}>
              <p className={styles.sectionLabel}>Description</p>
              {/* task.description is already sanitized at write time via sanitizeHtml() in task-actions.ts */}
              {task.description ? (
                <div
                  className={styles.description}
                  // eslint-disable-next-line react/no-danger -- content is server-sanitized via DOMPurify in task-actions.ts
                  dangerouslySetInnerHTML={{ __html: task.description }}
                />
              ) : (
                <p className={styles.emptyText}>No description.</p>
              )}

              {task.subtaskCount > 0 && (
                <>
                  <p className={styles.sectionLabel} style={{ marginTop: 20 }}>Subtasks</p>
                  <p className={styles.subtaskCount}>
                    {task.subtaskDoneCount} of {task.subtaskCount} done
                  </p>
                </>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 3: Write TaskDetailDrawer.module.css**

Create `apps/web/src/app/(admin)/admin/tasks/TaskDetailDrawer.module.css`:

```css
.backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,0.28);
  z-index: 40; backdrop-filter: blur(2px);
}

.drawer {
  position: fixed; top: 0; right: 0; bottom: 0; width: 420px; max-width: 100vw;
  background: var(--surface-base); border-left: 1px solid var(--border);
  z-index: 50; display: flex; flex-direction: column; overflow: hidden;
  box-shadow: -8px 0 32px rgba(0,0,0,0.12);
}

.header {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 20px; border-bottom: 1px solid var(--border);
}

.completeBtn {
  width: 20px; height: 20px; border-radius: 50%; flex-shrink: 0;
  border: 2px solid var(--border-strong); background: transparent;
  cursor: pointer; margin-top: 2px;
  transition: background 0.15s, border-color 0.15s;
}
.completeBtnDone { background: #c17b4e; border-color: #c17b4e; }

.title {
  flex: 1; font-size: 16px; font-weight: 600; line-height: 1.4;
  cursor: text; color: var(--text-primary); margin: 0;
}
.titleDone { text-decoration: line-through; color: var(--text-tertiary); }
.titleInput {
  flex: 1; font-size: 16px; font-weight: 600; line-height: 1.4;
  border: none; outline: none; background: transparent; color: var(--text-primary);
}

.closeBtn {
  font-size: 14px; color: var(--text-tertiary); background: none;
  border: none; cursor: pointer; padding: 2px 6px; flex-shrink: 0;
}

.meta { display: flex; flex-direction: column; border-bottom: 1px solid var(--border); }

.metaRow {
  display: grid; grid-template-columns: 88px 1fr; align-items: center; gap: 12px;
  padding: 10px 20px; border-bottom: 1px solid var(--border);
}
.metaRow:last-child { border-bottom: none; }
.metaLabel { font-size: 12px; color: var(--text-tertiary); font-weight: 500; }

.statusBadge {
  display: inline-block; padding: 2px 8px; border-radius: 6px;
  font-size: 12px; font-weight: 500;
}
.status_todo { background: var(--surface-elevated); color: var(--text-secondary); }
.status_in_progress { background: #eff6ff; color: #2563eb; }
.status_blocked { background: #fef2f2; color: #dc2626; }
.status_done { background: #f0fdf4; color: #16a34a; }

.priorityPills { display: flex; gap: 4px; flex-wrap: wrap; }
.priorityPill {
  padding: 2px 8px; border-radius: 999px; font-size: 11px;
  border: 1px solid var(--border); background: transparent;
  cursor: pointer; color: var(--text-secondary);
  transition: border-color 0.15s, color 0.15s;
}
.priorityPillActive { font-weight: 600; }

.parentPill {
  font-size: 12px; background: var(--surface-elevated);
  padding: 2px 8px; border-radius: 6px; color: var(--text-secondary);
}

.body { flex: 1; overflow-y: auto; padding: 20px; }
.sectionLabel {
  font-size: 11px; font-weight: 600; text-transform: uppercase;
  letter-spacing: 0.06em; color: var(--text-tertiary); margin: 0 0 8px;
}
.description { font-size: 14px; color: var(--text-primary); line-height: 1.6; }
.emptyText { font-size: 14px; color: var(--text-tertiary); font-style: italic; }
.subtaskCount { font-size: 13px; color: var(--text-secondary); }
```

- [ ] **Step 4: Wire drawer to TaskRow click**

In `TaskRow.tsx`, add `onOpen` prop:

```typescript
export function TaskRow({ task, subtasks = [], onOpen }: {
  task: Task; subtasks?: Task[]; onOpen?: () => void;
}) {
```

Make the row div clickable (stop propagation on the checkbox):

```typescript
<div className={...} onClick={onOpen} style={{ cursor: onOpen ? 'pointer' : undefined }}>
  <button
    ...
    onClick={(e) => { e.stopPropagation(); toggleComplete(e); }}
  />
```

In `TasksListView.tsx`, add drawer state and pass `onOpen`:

```typescript
import { useState } from 'react';
import { TaskDetailDrawer } from './TaskDetailDrawer';

// Inside TasksListView:
const [drawerTask, setDrawerTask] = useState<Task | null>(null);

// Pass to TaskRow:
<TaskRow key={t.id} task={t} subtasks={...} onOpen={() => setDrawerTask(t)} />

// Render drawer at bottom:
<TaskDetailDrawer task={drawerTask} onClose={() => setDrawerTask(null)} />
```

- [ ] **Step 5: Visual test**

```bash
# http://localhost:4000/admin/tasks
# Click any task row -- drawer slides in from right
# Edit title (click it) -- saves on blur
# Change priority -- border updates in background
# Press Escape -- drawer closes
```

- [ ] **Step 6: Typecheck**

```bash
pnpm exec tsc --noEmit
```

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/app/(admin)/admin/tasks/TaskDetailDrawer.tsx \
        apps/web/src/app/(admin)/admin/tasks/TaskDetailDrawer.module.css \
        apps/web/src/app/(admin)/admin/tasks/TaskRow.tsx \
        apps/web/src/app/(admin)/admin/tasks/TasksListView.tsx \
        apps/web/src/lib/admin/task-actions.ts
git commit -m "feat: task detail drawer -- spring-animated slide-over with inline title/priority/due editing"
```

---

### Task 12: Global Quick Capture (Cmd+T)

**Files:**
- Create: `apps/web/src/components/admin/chrome/QuickCapture.tsx`
- Create: `apps/web/src/components/admin/chrome/QuickCapture.module.css`
- Modify: `apps/web/src/app/(admin)/layout.tsx`

- [ ] **Step 1: Write QuickCapture.tsx**

Create `apps/web/src/components/admin/chrome/QuickCapture.tsx`:

```typescript
'use client';

import { useState, useEffect, useRef, useTransition } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { createTask } from '@/lib/admin/task-actions';
import styles from './QuickCapture.module.css';

export function QuickCapture() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 't') {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, []);

  useEffect(() => {
    if (open) {
      setValue('');
      // Delay focus to allow animation to start
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open]);

  const submit = () => {
    const title = value.trim();
    if (!title) { setOpen(false); return; }
    startTransition(async () => {
      await createTask({ title });
      setOpen(false);
    });
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
          <motion.div
            className={styles.panel}
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
          >
            <input
              ref={inputRef}
              className={styles.input}
              placeholder="Add a task..."
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); submit(); }
                if (e.key === 'Escape') setOpen(false);
              }}
              disabled={isPending}
            />
            <div className={styles.hint}>
              <kbd>Return</kbd> save to Inbox &nbsp;&middot;&nbsp; <kbd>Esc</kbd> cancel
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Write QuickCapture.module.css**

Create `apps/web/src/components/admin/chrome/QuickCapture.module.css`:

```css
.backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,0.25);
  z-index: 60; backdrop-filter: blur(3px);
}

.panel {
  position: fixed; top: 20vh; left: 50%; transform: translateX(-50%);
  width: 560px; max-width: calc(100vw - 32px);
  background: var(--surface-floating);
  border: 1px solid var(--border-strong);
  border-radius: 14px;
  box-shadow: 0 24px 64px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.08);
  z-index: 61; overflow: hidden;
}

.input {
  width: 100%; padding: 18px 20px; font-size: 16px;
  border: none; outline: none; background: transparent;
  color: var(--text-primary);
}
.input::placeholder { color: var(--text-tertiary); }

.hint {
  padding: 8px 20px; font-size: 11px; color: var(--text-tertiary);
  border-top: 1px solid var(--border); display: flex; align-items: center; gap: 4px;
}

kbd {
  display: inline-block; padding: 1px 5px;
  background: var(--surface-elevated); border: 1px solid var(--border);
  border-radius: 4px; font-size: 10px; font-family: monospace;
}
```

- [ ] **Step 3: Mount in admin layout**

Find `apps/web/src/app/(admin)/layout.tsx`. Import and add `QuickCapture`:

```typescript
import { QuickCapture } from '@/components/admin/chrome/QuickCapture';

// Inside the layout return, alongside children:
<>
  {children}
  <QuickCapture />
</>
```

- [ ] **Step 4: Test**

```bash
# http://localhost:4000/admin/tasks
# Press Cmd+T -- panel appears centered
# Type "keyboard capture test" -- press Enter
# Expected: panel closes, task in Inbox view
# Press Cmd+T again -- panel opens
# Press Escape -- closes
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/admin/chrome/QuickCapture.tsx \
        apps/web/src/components/admin/chrome/QuickCapture.module.css \
        apps/web/src/app/(admin)/layout.tsx
git commit -m "feat: Cmd+T global quick capture overlay -- creates task in Inbox"
```

---

## Milestone 3: Projects + Portal

---

### Task 13: Internal Projects

**Files:**
- Create: `apps/web/src/lib/admin/project-actions.ts`
- Create: `apps/web/src/app/(admin)/admin/projects/page.tsx`
- Create: `apps/web/src/app/(admin)/admin/projects/ProjectsClient.tsx`
- Create: `apps/web/src/app/(admin)/admin/projects/page.module.css`
- Create: `apps/web/src/app/(admin)/admin/projects/[id]/page.tsx`

- [ ] **Step 1: Write project-actions.ts**

Create `apps/web/src/lib/admin/project-actions.ts`:

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { requireAdminUser } from './auth';

export type CreateProjectInput = {
  name: string;
  description?: string;
  color?: string;
};

export type Project = {
  id: string;
  name: string;
  description: string | null;
  color: string;
  status: string;
  created_at: string;
};

export async function createProject(input: CreateProjectInput): Promise<{ id: string }> {
  const { supabase, user } = await requireAdminUser();
  const { data: profile } = await supabase
    .from('profiles').select('id').eq('user_id', user.id).single();
  if (!profile) throw new Error('Profile not found');

  const { data, error } = await (supabase as any)
    .from('projects')
    .insert({
      name: input.name.trim(),
      description: input.description?.trim() ?? null,
      color: input.color ?? '#c17b4e',
      created_by: profile.id,
    })
    .select('id')
    .single();
  if (error) throw error;

  revalidatePath('/admin/projects');
  return { id: data.id };
}

export async function archiveProject(id: string): Promise<void> {
  const { supabase } = await requireAdminUser();
  await (supabase as any).from('projects').update({ status: 'archived' }).eq('id', id);
  revalidatePath('/admin/projects');
}

export async function fetchProjects(status: 'active' | 'archived' = 'active'): Promise<Project[]> {
  const { supabase } = await requireAdminUser();
  const { data } = await (supabase as any)
    .from('projects')
    .select('id, name, description, color, status, created_at')
    .eq('status', status)
    .order('created_at', { ascending: false });
  return data ?? [];
}

export async function fetchProject(id: string): Promise<Project | null> {
  const { supabase } = await requireAdminUser();
  const { data } = await (supabase as any)
    .from('projects')
    .select('id, name, description, color, status, created_at')
    .eq('id', id)
    .single();
  return data ?? null;
}

export async function fetchProjectTaskCounts(
  projectIds: string[],
): Promise<Record<string, { open: number; total: number }>> {
  if (projectIds.length === 0) return {};
  const { supabase } = await requireAdminUser();
  const { data } = await (supabase as any)
    .from('tasks')
    .select('parent_id, status')
    .eq('parent_type', 'project')
    .in('parent_id', projectIds);

  const counts: Record<string, { open: number; total: number }> = {};
  for (const row of data ?? []) {
    if (!counts[row.parent_id]) counts[row.parent_id] = { open: 0, total: 0 };
    counts[row.parent_id].total++;
    if (row.status !== 'done') counts[row.parent_id].open++;
  }
  return counts;
}
```

- [ ] **Step 2: Write projects list page (server component)**

Create `apps/web/src/app/(admin)/admin/projects/page.tsx`:

```typescript
import { fetchProjects, fetchProjectTaskCounts } from '@/lib/admin/project-actions';
import { PageTitle } from '@/components/admin/chrome/PageTitle';
import { ProjectsClient } from './ProjectsClient';

export default async function ProjectsPage() {
  const projects = await fetchProjects('active');
  const counts = await fetchProjectTaskCounts(projects.map((p) => p.id));
  return (
    <>
      <PageTitle title="Projects" subtitle="Internal work and company initiatives" />
      <ProjectsClient projects={projects} counts={counts} />
    </>
  );
}
```

- [ ] **Step 3: Write ProjectsClient.tsx**

Create `apps/web/src/app/(admin)/admin/projects/ProjectsClient.tsx`:

```typescript
'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { createProject, archiveProject, type Project } from '@/lib/admin/project-actions';
import styles from './page.module.css';

export function ProjectsClient({
  projects,
  counts,
}: {
  projects: Project[];
  counts: Record<string, { open: number; total: number }>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#c17b4e');
  const [isPending, startTransition] = useTransition();
  const [confirmArchive, setConfirmArchive] = useState<string | null>(null);

  const submit = () => {
    if (!name.trim()) return;
    startTransition(async () => {
      await createProject({ name, color });
      setName(''); setShowForm(false);
    });
  };

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <button type="button" className={styles.newBtn} onClick={() => setShowForm(true)}>
          + New Project
        </button>
      </div>

      {showForm && (
        <div className={styles.createForm}>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className={styles.colorPicker}
            aria-label="Project color"
          />
          <input
            placeholder="Project name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit();
              if (e.key === 'Escape') setShowForm(false);
            }}
            autoFocus
            className={styles.nameInput}
          />
          <button type="button" onClick={submit} disabled={!name.trim() || isPending} className={styles.saveBtn}>
            Save
          </button>
          <button type="button" onClick={() => setShowForm(false)} className={styles.cancelBtn}>Cancel</button>
        </div>
      )}

      {projects.length === 0 && !showForm && (
        <p className={styles.empty}>No active projects. Create one to get started.</p>
      )}

      <div className={styles.grid}>
        {projects.map((p) => {
          const c = counts[p.id] ?? { open: 0, total: 0 };
          return (
            <div key={p.id} className={styles.card}>
              <div className={styles.cardColor} style={{ background: p.color }} />
              <div className={styles.cardBody}>
                <Link href={`/admin/projects/${p.id}`} className={styles.cardName}>{p.name}</Link>
                {p.description && <p className={styles.cardDesc}>{p.description}</p>}
                <div className={styles.cardMeta}>
                  <span>{c.open} open</span>
                  <span>&middot;</span>
                  <span>{c.total} total tasks</span>
                </div>
              </div>
              {confirmArchive === p.id ? (
                <div className={styles.confirmRow}>
                  <button
                    type="button"
                    onClick={() => startTransition(() => archiveProject(p.id))}
                    className={styles.archiveConfirmBtn}
                  >
                    Archive
                  </button>
                  <button type="button" onClick={() => setConfirmArchive(null)} className={styles.cancelBtn}>
                    Cancel
                  </button>
                </div>
              ) : (
                <button type="button" className={styles.archiveBtn} onClick={() => setConfirmArchive(p.id)}>
                  Archive
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Write page.module.css for projects list**

Create `apps/web/src/app/(admin)/admin/projects/page.module.css`:

```css
.page { padding: 0 24px 40px; }
.toolbar { display: flex; justify-content: flex-end; padding: 16px 0; }
.newBtn {
  padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 500;
  background: #c17b4e; color: #fff; border: none; cursor: pointer;
}
.createForm {
  display: flex; gap: 8px; align-items: center;
  padding: 12px 0; border-bottom: 1px solid var(--border); margin-bottom: 16px;
}
.colorPicker { width: 34px; height: 34px; border: none; cursor: pointer; border-radius: 6px; padding: 2px; }
.nameInput {
  flex: 1; padding: 8px 12px; border-radius: 8px;
  border: 1px solid var(--border-strong); background: var(--surface-elevated);
  font-size: 14px; color: var(--text-primary); outline: none;
}
.saveBtn {
  padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 500;
  background: #c17b4e; color: #fff; border: none; cursor: pointer;
}
.saveBtn:disabled { opacity: 0.5; cursor: not-allowed; }
.cancelBtn {
  padding: 8px 12px; border-radius: 8px; font-size: 13px;
  background: transparent; border: 1px solid var(--border); cursor: pointer;
  color: var(--text-secondary);
}
.empty { color: var(--text-tertiary); font-size: 14px; padding: 24px 0; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
.card {
  border: 1px solid var(--border); border-radius: 12px;
  background: var(--surface-elevated); display: flex; flex-direction: column;
  overflow: hidden;
}
.cardColor { height: 6px; flex-shrink: 0; }
.cardBody { padding: 16px; flex: 1; }
.cardName { font-size: 15px; font-weight: 600; color: var(--text-primary); text-decoration: none; }
.cardName:hover { text-decoration: underline; }
.cardDesc { font-size: 13px; color: var(--text-secondary); margin: 4px 0 0; }
.cardMeta { font-size: 12px; color: var(--text-tertiary); margin-top: 8px; display: flex; gap: 6px; }
.archiveBtn {
  padding: 8px 16px; font-size: 12px; color: var(--text-tertiary);
  background: none; border: none; cursor: pointer; border-top: 1px solid var(--border);
  text-align: left;
}
.archiveBtn:hover { color: var(--text-primary); }
.confirmRow { display: flex; gap: 8px; padding: 8px 12px; border-top: 1px solid var(--border); }
.archiveConfirmBtn {
  padding: 4px 12px; border-radius: 6px; font-size: 12px;
  background: #fef2f2; color: #dc2626; border: 1px solid #fca5a5; cursor: pointer;
}
```

- [ ] **Step 5: Write project detail page**

Create `apps/web/src/app/(admin)/admin/projects/[id]/page.tsx`:

```typescript
import { notFound } from 'next/navigation';
import { fetchProject } from '@/lib/admin/project-actions';
import { PageTitle } from '@/components/admin/chrome/PageTitle';
import { TasksTab } from '@/components/admin/tasks/TasksTab';

type Props = { params: Promise<{ id: string }> };

export default async function ProjectDetailPage({ params }: Props) {
  const { id } = await params;
  const project = await fetchProject(id);
  if (!project) notFound();

  return (
    <>
      <PageTitle
        title={project.name}
        subtitle={project.description ?? 'Internal project'}
      />
      <div style={{ padding: '0 24px' }}>
        <TasksTab parentType="project" parentId={id} />
      </div>
    </>
  );
}
```

- [ ] **Step 6: Add Projects to admin sidebar navigation**

Find the sidebar nav file (likely `apps/web/src/components/admin/chrome/Sidebar.tsx` or similar). Add:

```typescript
import { SquaresFour } from '@phosphor-icons/react';

// Add to nav items:
{ href: '/admin/projects', label: 'Projects', icon: SquaresFour }
```

- [ ] **Step 7: Test**

```bash
# http://localhost:4000/admin/projects
# Click "+ New Project", enter name, pick color, Save
# Expected: card appears with color swatch, name, "0 open / 0 total tasks"
# Click project name -> /admin/projects/[id]
# Create a task from the TasksTab -> appears in project, count updates
# Archive project -> confirm flow -> card removed
```

- [ ] **Step 8: Typecheck**

```bash
pnpm exec tsc --noEmit
```

- [ ] **Step 9: Commit**

```bash
git add apps/web/src/lib/admin/project-actions.ts \
        apps/web/src/app/(admin)/admin/projects/
git commit -m "feat: internal projects -- card grid, color picker, detail page with task list, archive flow"
```

---

### Task 14: Owner Portal Redesign

**Files:**
- Create: `apps/web/src/app/(portal)/portal/tasks/PhaseProgressRing.tsx`
- Modify: `apps/web/src/app/(portal)/portal/tasks/PortalTasksShell.tsx`

- [ ] **Step 1: Write PhaseProgressRing.tsx**

Create `apps/web/src/app/(portal)/portal/tasks/PhaseProgressRing.tsx`:

```typescript
type Props = { done: number; total: number; color: string; size?: number };

export function PhaseProgressRing({ done, total, color, size = 48 }: Props) {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = total === 0 ? 0 : done / total;
  const dashOffset = circumference * (1 - progress);

  return (
    <svg
      width={size}
      height={size}
      aria-label={`${done} of ${total} done`}
      style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}
    >
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke="var(--border)" strokeWidth={5}
      />
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke={color} strokeWidth={5}
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.4s ease' }}
      />
    </svg>
  );
}
```

- [ ] **Step 2: Add phase card and regular task row sub-components to PortalTasksShell.tsx**

At the top of `PortalTasksShell.tsx` (after imports), add two sub-components before the main shell export:

```typescript
import { useState } from 'react';
import { PhaseProgressRing } from './PhaseProgressRing';

// Sub-component: single phase card (Documents / Finances / Listings)
function PhaseCard({
  label,
  tasks,
  color,
  onToggle,
}: {
  label: string;
  tasks: Array<{ id: string; title: string; status: string }>;
  color: string;
  onToggle: (id: string, newStatus: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const done = tasks.filter((t) => t.status === 'done').length;
  const total = tasks.length;

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', background: 'var(--surface-elevated)' }}>
      <button
        type="button"
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <PhaseProgressRing done={done} total={total} color={color} size={44} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</div>
          <div style={{ fontSize: 12, fontWeight: 500, color, marginTop: 2 }}>{done}/{total} done</div>
        </div>
        <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <ul style={{ listStyle: 'none', margin: 0, padding: '0 16px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {tasks.map((t) => {
            const isDone = t.status === 'done';
            return (
              <li key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  type="button"
                  aria-label={isDone ? 'Mark incomplete' : 'Mark complete'}
                  onClick={() => onToggle(t.id, isDone ? 'todo' : 'done')}
                  style={{
                    width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                    border: `2px solid ${isDone ? color : 'var(--border-strong)'}`,
                    background: isDone ? color : 'transparent',
                    cursor: 'pointer',
                    transition: 'background 0.15s, border-color 0.15s',
                  }}
                />
                <span style={{
                  fontSize: 14, color: 'var(--text-primary)',
                  textDecoration: isDone ? 'line-through' : 'none',
                  opacity: isDone ? 0.6 : 1,
                }}>
                  {t.title}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// Sub-component: regular (non-onboarding) task row
function RegularTaskRow({
  task,
  onToggle,
}: {
  task: { id: string; title: string; status: string; dueDate?: string | null };
  onToggle: (id: string, newStatus: string) => void;
}) {
  const isDone = task.status === 'done';
  const isOverdue = task.dueDate && !isDone && new Date(task.dueDate) < new Date();
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 0', borderBottom: '1px solid var(--border)',
    }}>
      <button
        type="button"
        aria-label={isDone ? 'Mark incomplete' : 'Mark complete'}
        onClick={() => onToggle(task.id, isDone ? 'todo' : 'done')}
        style={{
          width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
          border: `2px solid ${isDone ? '#10b981' : 'var(--border-strong)'}`,
          background: isDone ? '#10b981' : 'transparent', cursor: 'pointer',
        }}
      />
      <span style={{
        flex: 1, fontSize: 14, color: 'var(--text-primary)',
        textDecoration: isDone ? 'line-through' : 'none', opacity: isDone ? 0.6 : 1,
      }}>
        {task.title}
      </span>
      {task.dueDate && (
        <span style={{ fontSize: 11, color: isOverdue ? '#dc2626' : 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
          {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </span>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Replace the main task list render in PortalTasksShell**

Find where `PortalTasksShell` renders the task list (the filtered tasks section). Replace it with:

```tsx
{/* Split tasks into onboarding and regular */}
{(() => {
  const onboardingTasks = tasks.filter((t: any) =>
    Array.isArray(t.tags) && (t.tags as string[]).some((tag) => tag.startsWith('onboarding'))
  );
  const regularTasks = tasks.filter((t: any) =>
    !Array.isArray(t.tags) || !(t.tags as string[]).some((tag) => tag.startsWith('onboarding'))
  );

  const docTasks = onboardingTasks.filter((t: any) =>
    (t.tags as string[]).includes('onboarding:documents')
  );
  const finTasks = onboardingTasks.filter((t: any) =>
    (t.tags as string[]).includes('onboarding:finances')
  );
  const listTasks = onboardingTasks.filter((t: any) =>
    (t.tags as string[]).includes('onboarding:listings')
  );

  return (
    <>
      {onboardingTasks.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', margin: '0 0 12px' }}>
            Onboarding
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Documents', tasks: docTasks,  color: '#6366f1' },
              { label: 'Finances',  tasks: finTasks,  color: '#10b981' },
              { label: 'Listings',  tasks: listTasks, color: '#8b5cf6' },
            ].map(({ label, tasks: pt, color }) => (
              pt.length > 0 && (
                <PhaseCard key={label} label={label} tasks={pt} color={color} onToggle={onToggle} />
              )
            ))}
          </div>
        </section>
      )}

      {regularTasks.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', margin: '0 0 4px' }}>
            Your Tasks
          </h2>
          <div>
            {[...regularTasks]
              .sort((a: any, b: any) => {
                if (!a.dueDate && !b.dueDate) return 0;
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
              })
              .map((t: any) => (
                <RegularTaskRow key={t.id} task={t} onToggle={onToggle} />
              ))}
          </div>
        </section>
      )}

      {onboardingTasks.length === 0 && regularTasks.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-tertiary)', fontSize: 14 }}>
          No tasks assigned right now.
        </div>
      )}
    </>
  );
})()}
```

Note: `onToggle` is the existing handler in `PortalTasksShell` that calls `updateTaskStatus`. Use whatever variable name the existing code uses.

- [ ] **Step 4: Test portal**

```bash
# Log in as owner account
# http://localhost:4000/portal/tasks
# Expected:
#   "Onboarding" section: 3 phase cards (only non-empty ones)
#   Each card: progress ring, done/total count, expand/collapse
#   Checking off a task updates ring fraction
#   "Your Tasks" section shows assigned non-onboarding tasks sorted by due date
```

- [ ] **Step 5: Typecheck**

```bash
pnpm exec tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/(portal)/portal/tasks/PhaseProgressRing.tsx \
        apps/web/src/app/(portal)/portal/tasks/PortalTasksShell.tsx
git commit -m "feat: owner portal redesign -- phase progress rings, Your Tasks section"
```

---

## Final Verification

Run all steps after completing all tasks:

```bash
# Type check
cd /Users/johanannunez/workspace/parcel/apps/web
pnpm exec tsc --noEmit

# Production build
pnpm build

# CalDAV PROPFIND (dev server running)
TOKEN="<your-token>"
AUTH=$(echo -n "jo@johanannunez.com:$TOKEN" | base64)
curl -sv -X PROPFIND http://localhost:4000/caldav/tasks/ \
  -H "Authorization: Basic $AUTH" -H "Depth: 1"
# Expected: 207 XML with Parcel Tasks collection

# Quick-add API
curl -X POST http://localhost:4000/api/tasks/quick-add \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Verify integration","dueDate":"tomorrow"}'
# Expected: {"id":"...","title":"...","url":"..."}

# Fantastical connection (after deploying to production):
# Fantastical > Settings > Accounts > + > Other CalDAV Account > Advanced
# User Name:      jo@johanannunez.com
# Password:       <api token from Parcel>
# Server Address: www.theparcelco.com
# Server Path:    /caldav/tasks/
# Port:           Auto
# Use SSL:        checked
# Confirm tasks with due dates appear in Fantastical calendar view
```
