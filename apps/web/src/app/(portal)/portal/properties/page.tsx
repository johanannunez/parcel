import type { Metadata } from "next";
import Link from "next/link";
import {
  Buildings,
  Bed,
  Bathtub,
  Users as UsersIcon,
  MapPin,
  Plus,
} from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/portal/PageHeader";
import { EmptyState } from "@/components/portal/EmptyState";
import { LinkButton } from "@/components/portal/Button";
import { propertyTypeLabels } from "@/lib/labels";

export const metadata: Metadata = { title: "Properties" };
export const dynamic = "force-dynamic";

export default async function PropertiesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: properties } = await supabase
    .from("properties")
    .select(
      "id, name, property_type, address_line1, city, state, bedrooms, bathrooms, guest_capacity, active, created_at",
    )
    .order("created_at", { ascending: false });

  const rows = properties ?? [];

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        eyebrow="Portfolio"
        title="Your properties"
        description="Every home under Parcel management. Add a new one, or open any card to see bookings, payouts, and documents."
        actions={
          <LinkButton href="/portal/onboarding/property">
            <Plus size={16} weight="bold" />
            Add property
          </LinkButton>
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          icon={<Buildings size={26} weight="duotone" />}
          title="No properties yet"
          body="Add your first home to unlock the dashboard, calendar, and payouts. The onboarding wizard takes about five minutes."
          action={
            <LinkButton href="/portal/onboarding/property">
              <Plus size={16} weight="bold" />
              Add your first property
            </LinkButton>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((p) => {
            const title = p.name?.trim() || p.address_line1;
            return (
              <Link
                key={p.id}
                href={`/portal/properties/${p.id}`}
                aria-label={`Open ${title}`}
                className="group flex flex-col gap-5 rounded-2xl border p-6 transition-[transform,box-shadow] duration-300 hover:-translate-y-[2px] hover:shadow-[0_20px_44px_-28px_rgba(15,23,42,0.22)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{
                  backgroundColor: "var(--color-white)",
                  borderColor: "var(--color-warm-gray-200)",
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <span
                      className="inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]"
                      style={{
                        backgroundColor: "var(--color-warm-gray-100)",
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      {propertyTypeLabels[p.property_type] ?? p.property_type}
                    </span>
                    <h3
                      className="mt-3 truncate text-lg font-semibold tracking-tight"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {title}
                    </h3>
                    <div
                      className="mt-1.5 flex items-center gap-1.5 text-sm"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      <MapPin size={14} weight="duotone" />
                      <span className="truncate">
                        {p.city}, {p.state}
                      </span>
                    </div>
                  </div>
                  <span
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                    style={{
                      backgroundColor: p.active
                        ? "rgba(22, 163, 74, 0.12)"
                        : "rgba(118, 113, 112, 0.12)",
                      color: p.active ? "#15803d" : "#4b4948",
                    }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{
                        backgroundColor: p.active ? "#16a34a" : "#767170",
                      }}
                    />
                    {p.active ? "Active" : "Paused"}
                  </span>
                </div>

                <div
                  className="flex items-center gap-5 border-t pt-4 text-sm"
                  style={{
                    borderColor: "var(--color-warm-gray-100)",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  <Stat
                    icon={<Bed size={14} weight="duotone" />}
                    label={`${p.bedrooms ?? "—"} bd`}
                  />
                  <Stat
                    icon={<Bathtub size={14} weight="duotone" />}
                    label={`${p.bathrooms ?? "—"} ba`}
                  />
                  <Stat
                    icon={<UsersIcon size={14} weight="duotone" />}
                    label={`${p.guest_capacity ?? "—"} guests`}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 tabular-nums">
      {icon}
      {label}
    </span>
  );
}
