"use client";

import { useMemo } from "react";
import { GridView } from "./GridView";
import type { ChecklistItem } from "@/lib/checklist";
import { usePropertiesFilter } from "./PropertiesFilterContext";

type Owner = { id: string; name: string | null; shortName: string | null };

type Property = {
  id: string;
  street: string;
  unit: string | null;
  location: string;
  owners: Owner[];
};

/**
 * Status view (formerly Launchpad). Reads its filter state from the shared
 * PropertiesFilterContext set in the /admin/properties layout, so switching
 * to Gallery or Compact preserves the filter. Chrome (switcher + search) is
 * injected into the admin top bar via PropertiesLayoutClient.
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
  const { selection } = usePropertiesFilter();

  const visibleProperties = useMemo(() => {
    const noSelection = selection.ownerIds.size === 0 && selection.propertyIds.size === 0;
    if (noSelection) return properties;
    return properties.filter((p) => {
      if (selection.propertyIds.has(p.id)) return true;
      return p.owners.some((o) => selection.ownerIds.has(o.id));
    });
  }, [properties, selection]);

  return (
    <GridView
      properties={properties}
      visibleProperties={visibleProperties}
      checklistItems={checklistItems}
      owners={owners}
    />
  );
}
