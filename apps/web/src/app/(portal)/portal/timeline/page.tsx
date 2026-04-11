import type { Metadata } from "next";
import { ClockCounterClockwise } from "@phosphor-icons/react/dist/ssr";
import { getPortalContext } from "@/lib/portal-context";
import { EmptyState } from "@/components/portal/EmptyState";
import { formatMedium } from "@/lib/format";

export const metadata: Metadata = { title: "Timeline" };
export const dynamic = "force-dynamic";

type TimelineEntry = {
  id: string;
  event_type: string;
  title: string;
  body: string | null;
  property_id: string | null;
  created_at: string;
};

const EVENT_CONFIG: Record<string, { color: string; bg: string }> = {
  onboarding: { color: "var(--color-brand)", bg: "rgba(2, 170, 235, 0.10)" },
  document: {
    color: "var(--color-text-secondary)",
    bg: "var(--color-warm-gray-100)",
  },
  payout: { color: "#15803d", bg: "rgba(22, 163, 74, 0.10)" },
  property: { color: "var(--color-brand)", bg: "rgba(2, 170, 235, 0.10)" },
  block: { color: "#b45309", bg: "rgba(245, 158, 11, 0.12)" },
  message: { color: "var(--color-brand)", bg: "rgba(2, 170, 235, 0.10)" },
};

const getEventConfig = (type: string) =>
  EVENT_CONFIG[type] ?? {
    color: "var(--color-text-tertiary)",
    bg: "var(--color-warm-gray-100)",
  };

export default async function TimelinePage() {
  const { userId, client } = await getPortalContext();

  const [entriesResult, { data: properties }] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (client as any)
      .from("owner_timeline")
      .select("id, event_type, title, body, property_id, created_at")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false }),
    client.from("properties").select("id, name, address_line1").eq("owner_id", userId),
  ]);

  const entries: TimelineEntry[] = entriesResult.data ?? [];
  const propertyMap = new Map(
    (properties ?? []).map((p) => [p.id, p.name?.trim() || p.address_line1 || "Property"]),
  );

  return (
    <div className="flex flex-col gap-6">
      {entries.length === 0 ? (
        <EmptyState
          icon={<ClockCounterClockwise size={26} weight="duotone" />}
          title="No activity yet"
          body="Key events and milestones for your account and properties will appear here."
        />
      ) : (
        <div className="relative flex flex-col gap-0">
          {/* Vertical line */}
          <div
            className="absolute bottom-4 left-[7px] top-4 w-px"
            style={{ backgroundColor: "var(--color-warm-gray-200)" }}
          />
          {entries.map((entry) => {
            const cfg = getEventConfig(entry.event_type);
            const propertyLabel = entry.property_id
              ? propertyMap.get(entry.property_id)
              : null;
            return (
              <div key={entry.id} className="relative flex gap-4 pb-6 last:pb-0">
                {/* Dot */}
                <div
                  className="relative z-10 mt-1 h-4 w-4 shrink-0 rounded-full"
                  style={{
                    backgroundColor: cfg.bg,
                    border: `2px solid ${cfg.color}`,
                  }}
                />
                {/* Content */}
                <div
                  className="flex-1 rounded-2xl border p-4"
                  style={{
                    backgroundColor: "var(--color-white)",
                    borderColor: "var(--color-warm-gray-200)",
                  }}
                >
                  <div
                    className="mb-1 text-xs"
                    style={{ color: "var(--color-text-tertiary)" }}
                  >
                    {formatMedium(entry.created_at)}
                  </div>
                  <div
                    className="text-sm font-semibold"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {entry.title}
                  </div>
                  {entry.body && (
                    <div
                      className="mt-1 text-sm leading-relaxed"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {entry.body}
                    </div>
                  )}
                  {propertyLabel && (
                    <div className="mt-2">
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
