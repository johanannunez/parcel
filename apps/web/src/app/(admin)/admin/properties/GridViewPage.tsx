"use client";

import { useMemo, useState } from "react";
import { HomesPageChrome } from "./HomesPageChrome";
import { HomesViewSwitcher } from "./HomesViewSwitcher";
import { PropertyFilterPopover, type FilterSelection } from "./PropertyFilterPopover";
import { GridView } from "./GridView";
import type { ChecklistItem } from "@/lib/checklist";

type Owner = { id: string; name: string | null; shortName: string | null };

type Property = {
  id: string;
  street: string;
  unit: string | null;
  location: string;
  owners: Owner[];
};

/**
 * Status view (formerly Launchpad). Shares the same HomesPageChrome + view
 * switcher used by the Homes Gallery/Table views so navigation feels cohesive.
 */
export function GridViewPage({
  properties,
  checklistItems,
  owners,
}: {
  properties: Property[];
  checklistItems: ChecklistItem[];
  owners: Array<{ id: string; name: string | null }>;
}) {
  const [selection, setSelection] = useState<FilterSelection>({
    ownerIds: new Set<string>(),
    propertyIds: new Set<string>(),
  });

  const visibleProperties = useMemo(() => {
    const noSelection = selection.ownerIds.size === 0 && selection.propertyIds.size === 0;
    if (noSelection) return properties;
    return properties.filter((p) => {
      if (selection.propertyIds.has(p.id)) return true;
      return p.owners.some((o) => selection.ownerIds.has(o.id));
    });
  }, [properties, selection]);

  return (
    <HomesPageChrome
      toolbarLeft={
        <HomesViewSwitcher
          activeKey="status"
          tabs={[
            {
              key: "status",
              label: "Status",
              href: "/admin/properties?view=launchpad",
            },
            {
              key: "gallery",
              label: "Gallery",
              href: "/admin/properties?view=details&mode=gallery",
            },
            {
              key: "table",
              label: "Table",
              href: "/admin/properties?view=details&mode=table",
            },
          ]}
        />
      }
      toolbarRight={
        <PropertyFilterPopover
          owners={owners.map((o) => ({ id: o.id, name: o.name }))}
          properties={properties}
          selection={selection}
          onChange={setSelection}
          totalVisible={visibleProperties.length}
          totalAll={properties.length}
        />
      }
    >
      <GridView
        properties={properties}
        visibleProperties={visibleProperties}
        checklistItems={checklistItems}
        owners={owners}
      />
    </HomesPageChrome>
  );
}
