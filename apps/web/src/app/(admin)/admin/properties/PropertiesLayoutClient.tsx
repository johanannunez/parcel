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
import {
  PropertiesNavProvider,
  PropertiesContent,
  usePropertiesNav,
} from "./PropertiesNavContext";
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
        <PropertiesNavProvider>
          <TopBarController
            owners={owners}
            summaries={summaries}
            onStatusView={view === "launchpad"}
          />
          <PropertiesContent>{children}</PropertiesContent>
        </PropertiesNavProvider>
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
  const { mode } = usePropertiesMode();
  const { navigateTo, pendingDest } = usePropertiesNav();

  const visibleCount = useMemo(() => {
    const noSelection =
      selection.ownerIds.size === 0 && selection.propertyIds.size === 0;
    if (noSelection) return summaries.length;
    return summaries.filter((p) => {
      if (selection.propertyIds.has(p.id)) return true;
      return p.owners.some((o) => selection.ownerIds.has(o.id));
    }).length;
  }, [selection, summaries]);

  // Pre-select the destination tab the moment a user clicks. Until the route
  // settles the tab/button class reflects where they're headed, not where
  // they came from. Prevents the "both tabs look active" flash during load.
  const pendingModeKey =
    pendingDest === "gallery" || pendingDest === "table" ? pendingDest : null;
  const activeSwitcherKey = pendingDest === "status"
    ? null
    : pendingModeKey ?? (onStatusView ? null : mode);
  const statusPending = pendingDest === "status";
  const statusActive = statusPending || (onStatusView && !pendingModeKey);
  const switcherSubdued = statusActive;

  useSetTopBarSlots(
    () => ({
      centerSlot: (
        <>
          <StatusButton
            active={statusActive}
            pending={statusPending}
            onNavigate={() => navigateTo("status")}
            href="/admin/properties?view=launchpad"
          />
          <HomesViewSwitcher
            activeKey={activeSwitcherKey}
            subdued={switcherSubdued}
            tabs={[
              { key: "gallery", label: "Gallery", onClick: () => navigateTo("gallery") },
              { key: "table", label: "Table", onClick: () => navigateTo("table") },
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
    [
      mode,
      visibleCount,
      owners,
      summaries,
      onStatusView,
      navigateTo,
      activeSwitcherKey,
      statusActive,
      statusPending,
      switcherSubdued,
    ],
  );

  return null;
}
