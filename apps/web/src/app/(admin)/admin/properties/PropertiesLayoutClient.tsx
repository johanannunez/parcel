"use client";

import { useMemo, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSetTopBarSlots } from "@/components/admin/chrome/TopBarSlotsContext";
import { HomesViewSwitcher } from "./HomesViewSwitcher";
import { StatusButton } from "./StatusButton";
import { PropertiesTopBarSearch } from "./PropertiesTopBarSearch";
import {
  PropertiesFilterProvider,
  usePropertiesFilter,
} from "./PropertiesFilterContext";
import {
  PropertiesModeProvider,
  usePropertiesMode,
} from "./PropertiesModeContext";
import type { HomesMode } from "./homes-types";
import { Kanban } from "@phosphor-icons/react";

type Owner = { id: string; name: string | null };
type PropertySummary = {
  id: string;
  street: string;
  unit: string | null;
  location: string;
  owners: Array<{ id: string; name: string | null }>;
};

export function PropertiesLayoutClient({
  owners,
  summaries,
  children,
}: {
  owners: Owner[];
  summaries: PropertySummary[];
  children: ReactNode;
}) {
  const searchParams = useSearchParams();
  const view = searchParams?.get("view") ?? "";
  const modeParam = searchParams?.get("mode") ?? "";
  const onKanbanView = modeParam === "status";
  const initialMode: HomesMode = modeParam === "table" ? "table" : "gallery";

  return (
    <PropertiesFilterProvider>
      <PropertiesModeProvider initialMode={initialMode}>
        <TopBarController
          owners={owners}
          summaries={summaries}
          onStatusView={view === "launchpad"}
          onKanbanView={onKanbanView}
        />
        {children}
      </PropertiesModeProvider>
    </PropertiesFilterProvider>
  );
}

function TopBarController({
  owners,
  summaries,
  onStatusView,
  onKanbanView,
}: {
  owners: Owner[];
  summaries: PropertySummary[];
  onStatusView: boolean;
  onKanbanView: boolean;
}) {
  const router = useRouter();
  const { selection } = usePropertiesFilter();
  const { mode, setMode } = usePropertiesMode();

  const visibleCount = useMemo(() => {
    const noSelection =
      selection.ownerIds.size === 0 && selection.propertyIds.size === 0;
    if (noSelection) return summaries.length;
    return summaries.filter((p) => {
      if (selection.propertyIds.has(p.id)) return true;
      return p.owners.some((o) => selection.ownerIds.has(o.id));
    }).length;
  }, [selection, summaries]);

  const flipMode = (next: HomesMode) => {
    if (onStatusView || onKanbanView) {
      setMode(next);
      router.push(`/admin/properties?view=details&mode=${next}`, { scroll: false });
      return;
    }
    setMode(next);
    const url = new URL(window.location.href);
    url.searchParams.set("view", "details");
    url.searchParams.set("mode", next);
    window.history.replaceState(null, "", `${url.pathname}?${url.searchParams.toString()}`);
  };

  useSetTopBarSlots(
    () => ({
      centerSlot: (
        <>
          {/* Kanban (Plan D status view) button */}
          <a
            href="/admin/properties?mode=status"
            aria-label="Status view"
            title="Status (Kanban)"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "0 10px",
              height: 30,
              borderRadius: 8,
              background: onKanbanView ? "rgba(255,255,255,0.96)" : "transparent",
              border: "1px solid rgba(255,255,255,0.25)",
              color: onKanbanView ? "#0f3b6b" : "rgba(255,255,255,0.8)",
              fontSize: 12,
              fontWeight: 600,
              textDecoration: "none",
              transition: "background 160ms ease, color 160ms ease",
              marginRight: 6,
            }}
          >
            <Kanban size={13} weight="duotone" />
            Status
          </a>
          <StatusButton
            active={onStatusView}
            href="/admin/properties?view=launchpad"
          />
          <HomesViewSwitcher
            activeKey={onStatusView || onKanbanView ? null : mode}
            subdued={onStatusView || onKanbanView}
            tabs={[
              { key: "gallery", label: "Gallery", onClick: () => flipMode("gallery") },
              { key: "table", label: "Table", onClick: () => flipMode("table") },
            ]}
          />
        </>
      ),
      searchOverride: (
        <PropertiesTopBarSearch
          owners={owners}
          properties={summaries}
          totalVisible={visibleCount}
          totalAll={summaries.length}
        />
      ),
      hideHelp: true,
    }),
    [mode, visibleCount, owners, summaries, onStatusView, onKanbanView],
  );

  return null;
}
