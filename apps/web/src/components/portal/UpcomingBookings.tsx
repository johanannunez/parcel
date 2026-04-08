import Link from "next/link";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";

export type UpcomingBookingRow = {
  id: string;
  guestName: string | null;
  propertyName: string;
  checkIn: string;
  checkOut: string;
  source: string;
  status: string;
};

const sourceLabels: Record<string, string> = {
  direct: "Direct",
  airbnb: "Airbnb",
  vrbo: "Vrbo",
  booking_com: "Booking.com",
  furnished_finder: "Furnished Finder",
  hospitable: "Hospitable",
  other: "Other",
};

const statusStyles: Record<string, { bg: string; fg: string }> = {
  confirmed: { bg: "rgba(22, 163, 74, 0.12)", fg: "#15803d" },
  pending: { bg: "rgba(245, 158, 11, 0.14)", fg: "#b45309" },
  cancelled: { bg: "rgba(220, 38, 38, 0.10)", fg: "#b91c1c" },
};

function initials(name: string | null) {
  if (!name) return "G";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatRange(checkIn: string, checkOut: string) {
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const ci = new Date(checkIn).toLocaleDateString("en-US", opts);
  const co = new Date(checkOut).toLocaleDateString("en-US", opts);
  return `${ci} to ${co}`;
}

export function UpcomingBookings({ rows }: { rows: UpcomingBookingRow[] }) {
  return (
    <section
      className="overflow-hidden rounded-2xl border"
      style={{
        backgroundColor: "var(--color-white)",
        borderColor: "var(--color-warm-gray-200)",
      }}
    >
      <header
        className="flex items-center justify-between border-b px-6 py-5"
        style={{ borderColor: "var(--color-warm-gray-100)" }}
      >
        <div>
          <h2
            className="text-lg font-semibold tracking-tight"
            style={{ color: "var(--color-text-primary)" }}
          >
            Upcoming bookings
          </h2>
          <p
            className="mt-1 text-sm"
            style={{ color: "var(--color-text-secondary)" }}
          >
            The next five reservations across your portfolio.
          </p>
        </div>
        <Link
          href="/portal/calendar"
          className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
          style={{ color: "var(--color-brand)" }}
        >
          View calendar
          <ArrowUpRight size={14} weight="bold" />
        </Link>
      </header>

      {rows.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr
                className="text-left text-[11px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                <th className="px-6 py-3 font-semibold">Guest</th>
                <th className="px-6 py-3 font-semibold">Property</th>
                <th className="px-6 py-3 font-semibold">Stay</th>
                <th className="px-6 py-3 font-semibold">Source</th>
                <th className="px-6 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b, i) => {
                const status = statusStyles[b.status] ?? statusStyles.confirmed;
                return (
                  <tr
                    key={b.id}
                    className="transition-colors"
                    style={{
                      borderTop:
                        i === 0
                          ? undefined
                          : "1px solid var(--color-warm-gray-100)",
                    }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span
                          className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold"
                          style={{
                            backgroundColor: "var(--color-warm-gray-100)",
                            color: "var(--color-text-primary)",
                          }}
                        >
                          {initials(b.guestName)}
                        </span>
                        <span
                          className="font-medium"
                          style={{ color: "var(--color-text-primary)" }}
                        >
                          {b.guestName ?? "Guest"}
                        </span>
                      </div>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {b.propertyName}
                    </td>
                    <td
                      className="px-6 py-4 tabular-nums"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {formatRange(b.checkIn, b.checkOut)}
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {sourceLabels[b.source] ?? b.source}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize"
                        style={{ backgroundColor: status.bg, color: status.fg }}
                      >
                        {b.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function EmptyState() {
  return (
    <div className="px-6 py-14 text-center">
      <p
        className="text-sm"
        style={{ color: "var(--color-text-secondary)" }}
      >
        No upcoming bookings yet. New reservations will appear here as soon as
        they sync.
      </p>
    </div>
  );
}
