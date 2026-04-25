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
