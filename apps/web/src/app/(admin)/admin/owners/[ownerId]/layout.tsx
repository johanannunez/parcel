import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function OwnerHubLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ ownerId: string }>;
}) {
  const { ownerId } = await params;
  const supabase = await createClient();

  const { data: owner } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, created_at, onboarding_completed_at")
    .eq("id", ownerId)
    .eq("role", "owner")
    .single();

  if (!owner) {
    notFound();
  }

  const { count: propertyCount } = await supabase
    .from("properties")
    .select("*", { count: "exact", head: true })
    .eq("owner_id", ownerId);

  const displayName = owner.full_name?.trim() || owner.email;
  const memberSince = new Date(owner.created_at).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  return (
    <div className="flex flex-col">
      {/* Owner header */}
      <div
        className="border-b px-8 pb-0 pt-8"
        style={{ borderColor: "var(--color-warm-gray-200)" }}
      >
        <div className="flex items-start gap-4">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
            style={{
              backgroundColor: "var(--color-brand)",
            }}
          >
            {buildInitials(displayName)}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold tracking-tight" style={{ color: "var(--color-text-primary)" }}>
              {displayName}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs" style={{ color: "var(--color-text-tertiary)" }}>
              <span>{owner.email}</span>
              {owner.phone ? <span>{owner.phone}</span> : null}
              <span>Joined {memberSince}</span>
              <span>
                {propertyCount === 0
                  ? "No properties"
                  : propertyCount === 1
                    ? "1 property"
                    : `${propertyCount} properties`}
              </span>
              {owner.onboarding_completed_at ? (
                <span
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{
                    backgroundColor: "rgba(22, 163, 74, 0.15)",
                    color: "#4ade80",
                  }}
                >
                  Onboarded
                </span>
              ) : (
                <span
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{
                    backgroundColor: "rgba(245, 158, 11, 0.15)",
                    color: "#fbbf24",
                  }}
                >
                  Setting up
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tab bar rendered by the page component */}
      </div>

      {/* Tab content */}
      <div className="flex-1 px-8 py-8">{children}</div>
    </div>
  );
}

function buildInitials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
