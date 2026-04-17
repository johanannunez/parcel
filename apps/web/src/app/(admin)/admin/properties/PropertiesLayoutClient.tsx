"use client";

import { useMemo, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
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
  const initialMode: HomesMode = modeParam === "table" ? "table" : "gallery";

  return (
    <PropertiesFilterProvider>
      <PropertiesModeProvider initialMode={initialMode}>
        <TopBarController
          owners={owners}
          summaries={summaries}
          onStatusView={view === "launchpad"}
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
}: {
  owners: Owner[];
  summaries: PropertySummary[];
  onStatusView: boolean;
}) {
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
          <StatusButton
            active={onStatusView}
            href="/admin/properties?view=launchpad"
          />
          <HomesViewSwitcher
            activeKey={onStatusView ? null : mode}
            subdued={onStatusView}
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
    [mode, visibleCount, owners, summaries, onStatusView],
  );

  return null;
}
