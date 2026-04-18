"use client";

import { useMemo, useState } from "react";
import { PropertiesPageHeader } from "./PropertiesPageHeader";
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
 * Client wrapper for the Grid view. Owns the filter selection so we can
 * render the filter button in the page header's right slot while the grid
 * reads the same selection state.
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
    <div className="flex w-full flex-col">
      <PropertiesPageHeader
        activeView="grid"
        total={properties.length}
        rightSlot={
          <PropertyFilterPopover
            owners={owners.map((o) => ({ id: o.id, name: o.name }))}
            properties={properties}
            selection={selection}
            onChange={setSelection}
            totalVisible={visibleProperties.length}
            totalAll={properties.length}
          />
        }
      />
      <GridView
        properties={properties}
        visibleProperties={visibleProperties}
        checklistItems={checklistItems}
        owners={owners}
      />
    </div>
  );
}
