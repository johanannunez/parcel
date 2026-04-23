"use client";

import { useMemo, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { useSetTopBarSlots } from "@/components/admin/chrome/TopBarSlotsContext";
import { HomesViewSwitcher, type HomesViewKey } from "./HomesViewSwitcher";
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
  const modeParam = searchParams?.get("mode") ?? "";
  const initialMode: HomesMode = modeParam === "table" ? "table" : "gallery";

  return (
    <PropertiesFilterProvider>
      <PropertiesModeProvider initialMode={initialMode}>
        <PropertiesNavProvider>
          <TopBarController owners={owners} summaries={summaries} />
          <PropertiesContent>{children}</PropertiesContent>
        </PropertiesNavProvider>
      </PropertiesModeProvider>
    </PropertiesFilterProvider>
  );
}

function TopBarController({
  owners,
  summaries,
}: {
  owners: Owner[];
  summaries: PropertySummary[];
}) {
  const searchParams = useSearchParams();
  const view = searchParams?.get("view") ?? "";
  const modeParam = searchParams?.get("mode") ?? "";
  const onLaunchpadView = view === "launchpad";
  const onKanbanView = modeParam === "status";

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

  // Which switcher tab to show as active, accounting for in-flight navigation.
  const pendingModeKey: HomesViewKey | null =
    pendingDest === "kanban" || pendingDest === "gallery" || pendingDest === "table"
      ? pendingDest
      : null;

  const activeSwitcherKey: HomesViewKey | null =
    pendingDest === "launchpad"
      ? null
      : pendingModeKey ??
        (onLaunchpadView
          ? null
          : onKanbanView
            ? "kanban"
            : mode);

  const launchpadPending = pendingDest === "launchpad";
  const launchpadActive = launchpadPending || (onLaunchpadView && pendingDest === null);
  const switcherSubdued = launchpadActive;

  useSetTopBarSlots(
    () => ({
      centerSlot: (
        <>
          <StatusButton
            active={launchpadActive}
            pending={launchpadPending}
            onNavigate={() => navigateTo("launchpad")}
            href="/admin/properties?view=launchpad"
          />
          <HomesViewSwitcher
            activeKey={activeSwitcherKey}
            subdued={switcherSubdued}
            tabs={[
              { key: "kanban", label: "Kanban", onClick: () => navigateTo("kanban") },
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
      onLaunchpadView,
      onKanbanView,
      navigateTo,
      activeSwitcherKey,
      launchpadActive,
      launchpadPending,
      switcherSubdued,
    ],
  );

  return null;
}
