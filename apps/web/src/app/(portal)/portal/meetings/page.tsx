import type { Metadata } from "next";
import { Handshake } from "@phosphor-icons/react/dist/ssr";
import { getPortalContext } from "@/lib/portal-context";
import { EmptyState } from "@/components/portal/EmptyState";
import { formatMedium } from "@/lib/format";
import { propertyLabel } from "@/lib/address";

export const metadata: Metadata = { title: "Meetings" };
export const dynamic = "force-dynamic";

type MeetingNote = {
  id: string;
  body: string;
  visibility: string;
  property_id: string | null;
  created_at: string;
};

export default async function MeetingsPage() {
  const { userId, client } = await getPortalContext();

  const [notesResult, { data: properties }] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (client as any)
      .from("owner_notes")
      .select("id, body, visibility, property_id, created_at")
      .eq("owner_id", userId)
      .neq("visibility", "private")
      .order("created_at", { ascending: false }),
    client.from("properties").select("id, address_line1, address_line2").eq("owner_id", userId),
  ]);

  const notes: MeetingNote[] = notesResult.data ?? [];
  const propertyMap = new Map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (properties ?? []).map((p: any) => [p.id, propertyLabel(p)]),
  );

  return (
    <div className="flex flex-col gap-6">
      <div
        className="rounded-2xl border px-5 py-4 text-sm"
        style={{
          backgroundColor: "rgba(2, 170, 235, 0.04)",
          borderColor: "rgba(2, 170, 235, 0.18)",
          color: "var(--color-text-secondary)",
        }}
      >
        <span style={{ color: "var(--color-brand)", fontWeight: 600 }}>Your meeting notes</span>
        {" "}— Parcel will share notes and summaries from your interactions here. You will be
        notified when new notes are added.
      </div>

      {notes.length === 0 ? (
        <EmptyState
          icon={<Handshake size={26} weight="duotone" />}
          title="No meeting notes yet"
          body="Notes and summaries from your conversations with Parcel will appear here."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {notes.map((note) => {
            const propertyLabel = note.property_id ? propertyMap.get(note.property_id) : null;
            return (
              <div
                key={note.id}
                className="rounded-2xl border p-5"
                style={{
                  backgroundColor: "var(--color-white)",
                  borderColor: "var(--color-warm-gray-200)",
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div
                    className="text-xs"
                    style={{ color: "var(--color-text-tertiary)" }}
                  >
                    {/* spacer */}
                  </div>
                  <div
                    className="shrink-0 text-xs"
                    style={{ color: "var(--color-text-tertiary)" }}
                  >
                    {formatMedium(note.created_at)}
                  </div>
                </div>
                <p
                  className="mt-1 whitespace-pre-wrap text-sm leading-relaxed"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {note.body}
                </p>
                {propertyLabel && (
                  <div className="mt-3">
                    <span
                      className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                      style={{
                        backgroundColor: "rgba(2, 170, 235, 0.10)",
                        color: "var(--color-brand)",
                      }}
                    >
                      {propertyLabel}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
