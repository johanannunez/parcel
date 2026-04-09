"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { MagnifyingGlass } from "@phosphor-icons/react";

type Owner = {
  id: string;
  fullName: string | null;
  email: string;
  propertyCount: number;
  onboarded: boolean;
};

export function OwnerListPanel({ owners }: { owners: Owner[] }) {
  const [search, setSearch] = useState("");
  const params = useParams();
  const activeOwnerId = params?.ownerId as string | undefined;

  const filtered = owners.filter((o) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (o.fullName?.toLowerCase().includes(q) ?? false) ||
      o.email.toLowerCase().includes(q)
    );
  });

  return (
    <aside
      className="hidden w-[260px] shrink-0 flex-col border-r lg:flex"
      style={{
        backgroundColor: "rgba(30, 41, 59, 0.5)",
        borderColor: "rgba(255,255,255,0.06)",
      }}
    >
      {/* Header */}
      <div className="border-b px-4 pb-4 pt-6" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <h2 className="text-sm font-semibold text-white">Owners</h2>
        <p
          className="mt-0.5 text-[11px]"
          style={{ color: "rgba(255,255,255,0.4)" }}
        >
          {owners.length} total
        </p>

        {/* Search */}
        <div
          className="mt-3 flex items-center gap-2 rounded-lg border px-3 py-2"
          style={{
            backgroundColor: "rgba(255,255,255,0.04)",
            borderColor: "rgba(255,255,255,0.08)",
          }}
        >
          <MagnifyingGlass
            size={14}
            weight="bold"
            style={{ color: "rgba(255,255,255,0.3)" }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email"
            className="w-full bg-transparent text-xs text-white placeholder:text-white/30 focus:outline-none"
          />
        </div>
      </div>

      {/* Owner list */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {filtered.length === 0 ? (
          <p
            className="px-3 py-6 text-center text-xs"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            {search ? "No owners match your search." : "No owners yet."}
          </p>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {filtered.map((owner) => {
              const active = activeOwnerId === owner.id;
              const displayName = owner.fullName || owner.email.split("@")[0];
              const initials = buildInitials(displayName);

              return (
                <li key={owner.id}>
                  <Link
                    href={`/admin/owners/${owner.id}`}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors"
                    style={{
                      backgroundColor: active
                        ? "rgba(255,255,255,0.08)"
                        : "transparent",
                    }}
                    onMouseEnter={(e) => {
                      if (!active)
                        e.currentTarget.style.backgroundColor =
                          "rgba(255,255,255,0.04)";
                    }}
                    onMouseLeave={(e) => {
                      if (!active)
                        e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
                      style={{
                        backgroundColor: active
                          ? "var(--color-brand)"
                          : "rgba(255,255,255,0.08)",
                        color: active ? "white" : "rgba(255,255,255,0.7)",
                      }}
                    >
                      {initials}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div
                        className="truncate text-sm font-medium"
                        style={{
                          color: active ? "white" : "rgba(255,255,255,0.8)",
                        }}
                      >
                        {owner.fullName || owner.email}
                      </div>
                      <div
                        className="truncate text-[11px]"
                        style={{ color: "rgba(255,255,255,0.4)" }}
                      >
                        {owner.propertyCount === 0
                          ? "No properties"
                          : owner.propertyCount === 1
                            ? "1 property"
                            : `${owner.propertyCount} properties`}
                        {!owner.onboarded ? " · Setting up" : ""}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}

function buildInitials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
