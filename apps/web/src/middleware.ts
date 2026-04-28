import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyApiToken } from '@/lib/api-tokens';
import {
  taskToVTodo,
  generateETag,
  parseVTodoStatus,
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

  // Single Supabase service client per request
  const supabase = getServiceClient();

  // Authenticate via HTTP Basic auth (email:token, take everything after first colon as token)
  const authHeader = request.headers.get('Authorization') ?? '';
  const profileId = await authenticate(authHeader, supabase);
  if (!profileId) {
    return new NextResponse('Unauthorized', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Parcel CalDAV"' },
    });
  }

  if (method === 'PROPFIND') return handlePropfind(pathname);
  // Scope REPORT to the tasks collection only
  if (method === 'REPORT' && (pathname === '/caldav/tasks/' || pathname === '/caldav/tasks')) {
    return handleReport(supabase, profileId);
  }
  if (method === 'GET' && pathname.match(/\/caldav\/tasks\/.+\.ics$/)) {
    return handleGet(supabase, profileId, pathname);
  }
  if (method === 'PUT' && pathname.match(/\/caldav\/tasks\/.+\.ics$/)) {
    return handlePut(supabase, profileId, pathname, request);
  }

  return new NextResponse('Method Not Allowed', { status: 405 });
}

async function authenticate(
  authHeader: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
): Promise<string | null> {
  if (!authHeader.startsWith('Basic ')) return null;
  const decoded = atob(authHeader.slice(6));
  const colonIdx = decoded.indexOf(':');
  if (colonIdx === -1) return null;
  const token = decoded.slice(colonIdx + 1);
  if (!token) return null;
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
        <displayname>Parcel</displayname>
        <resourcetype><principal/></resourcetype>
        <C:calendar-home-set><href>/caldav/</href></C:calendar-home-set>
      </prop>
      <status>HTTP/1.1 200 OK</status>
    </propstat>
  </response>
</multistatus>`, 207);
  }

  if (pathname === '/caldav/tasks/' || pathname === '/caldav/tasks') {
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

  return new NextResponse('Not Found', { status: 404 });
}

async function handleReport(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // Wrap VTODO in CDATA to prevent XML injection from task title characters like < > &
    return `  <response>
    <href>/caldav/tasks/${t.caldav_uid}.ics</href>
    <propstat>
      <prop>
        <getetag>${etag}</getetag>
        <C:calendar-data><![CDATA[${vtodo}]]></C:calendar-data>
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  profileId: string,
  pathname: string,
  request: NextRequest,
): Promise<NextResponse> {
  const uid = extractUid(pathname);
  const body = await request.text();
  const newStatus = parseVTodoStatus(body);

  if (newStatus === 'COMPLETED') {
    const { count } = await (supabase as any)
      .from('tasks')
      .update({ status: 'done', completed_at: new Date().toISOString() }, { count: 'exact' })
      .eq('caldav_uid', uid)
      .eq('created_by', profileId);

    if ((count ?? 0) === 0) {
      return new NextResponse('Not Found', { status: 404 });
    }
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
