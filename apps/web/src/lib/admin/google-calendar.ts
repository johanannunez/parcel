import "server-only";
import { createClient } from "@/lib/supabase/server";

export type CalendarConnection = {
  id: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  calendarEmail: string;
};

export type CreateEventPayload = {
  title: string;
  startIso: string;
  endIso: string;
  description?: string;
  attendeeEmails?: string[];
  addConferencing?: boolean;
};

export type CreatedEvent = {
  eventId: string;
  meetLink: string | null;
};

export async function getAdminCalendarConnection(
  adminProfileId: string,
): Promise<CalendarConnection | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("connections")
    .select("id, metadata")
    .eq("owner_id", adminProfileId)
    .eq("provider", "google_calendar")
    .eq("status", "connected")
    .maybeSingle();

  if (!data) return null;

  const meta = (data.metadata ?? {}) as Record<string, unknown>;
  const accessToken = meta["access_token"] as string | undefined;
  const refreshToken = meta["refresh_token"] as string | undefined;
  const expiresAt = meta["expires_at"] as number | undefined;
  const calendarEmail = meta["calendar_email"] as string | undefined;

  if (!accessToken || !refreshToken) return null;

  return {
    id: data.id,
    accessToken,
    refreshToken,
    expiresAt: expiresAt ?? 0,
    calendarEmail: calendarEmail ?? "",
  };
}

async function refreshGoogleToken(
  connectionId: string,
  refreshToken: string,
): Promise<string> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required.");
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    throw new Error(`Token refresh failed: ${await res.text()}`);
  }

  const json = (await res.json()) as { access_token: string; expires_in: number };
  const newAccessToken = json.access_token;
  const newExpiresAt = Date.now() + json.expires_in * 1000;

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("connections")
    .select("metadata")
    .eq("id", connectionId)
    .maybeSingle();

  const meta = ((existing?.metadata ?? {}) as Record<string, unknown>);
  await supabase
    .from("connections")
    .update({
      metadata: { ...meta, access_token: newAccessToken, expires_at: newExpiresAt },
    })
    .eq("id", connectionId);

  return newAccessToken;
}

export async function getValidAccessToken(adminProfileId: string): Promise<string | null> {
  const conn = await getAdminCalendarConnection(adminProfileId);
  if (!conn) return null;

  const fiveMinutes = 5 * 60 * 1000;
  if (conn.expiresAt - Date.now() < fiveMinutes) {
    return refreshGoogleToken(conn.id, conn.refreshToken);
  }

  return conn.accessToken;
}

export async function createCalendarEvent(
  accessToken: string,
  payload: CreateEventPayload,
): Promise<CreatedEvent> {
  const body: Record<string, unknown> = {
    summary: payload.title,
    start: { dateTime: payload.startIso, timeZone: "UTC" },
    end: { dateTime: payload.endIso, timeZone: "UTC" },
    description: payload.description ?? "",
    attendees: (payload.attendeeEmails ?? []).map((email) => ({ email })),
  };

  if (payload.addConferencing) {
    body.conferenceData = {
      createRequest: {
        requestId: crypto.randomUUID(),
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    };
  }

  const url = payload.addConferencing
    ? "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1"
    : "https://www.googleapis.com/calendar/v3/calendars/primary/events";

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Google Calendar API error: ${await res.text()}`);
  }

  const event = (await res.json()) as {
    id: string;
    conferenceData?: { entryPoints?: Array<{ uri: string; entryPointType: string }> };
  };

  const meetLink =
    event.conferenceData?.entryPoints?.find((e) => e.entryPointType === "video")
      ?.uri ?? null;

  return { eventId: event.id, meetLink };
}

export async function deleteCalendarEvent(
  accessToken: string,
  eventId: string,
): Promise<void> {
  await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
}

export type DriveRecording = {
  fileId: string;
  fileName: string;
  webViewLink: string;
  durationMs: number | null;
};

export async function searchDriveRecording(
  accessToken: string,
  scheduledAt: string,
  _title: string,
): Promise<DriveRecording | null> {
  const scheduled = new Date(scheduledAt);
  const windowStart = new Date(scheduled.getTime() - 30 * 60 * 1000).toISOString();
  const windowEnd = new Date(scheduled.getTime() + 4 * 60 * 60 * 1000).toISOString();

  const q = [
    `(mimeType='video/mp4' or mimeType='video/webm')`,
    `createdTime >= '${windowStart}'`,
    `createdTime <= '${windowEnd}'`,
  ].join(" and ");

  const params = new URLSearchParams({
    q,
    fields: "files(id,name,webViewLink,videoMediaMetadata)",
    orderBy: "createdTime desc",
    pageSize: "5",
  });

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?${params.toString()}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (!res.ok) return null;

  const json = (await res.json()) as {
    files?: Array<{
      id: string;
      name: string;
      webViewLink: string;
      videoMediaMetadata?: { durationMillis?: string };
    }>;
  };

  const files = json.files ?? [];
  if (files.length === 0) return null;

  const best =
    files.find((f) => /meet|recording/i.test(f.name)) ?? files[0];

  return {
    fileId: best.id,
    fileName: best.name,
    webViewLink: best.webViewLink,
    durationMs: best.videoMediaMetadata?.durationMillis
      ? parseInt(best.videoMediaMetadata.durationMillis, 10)
      : null,
  };
}
