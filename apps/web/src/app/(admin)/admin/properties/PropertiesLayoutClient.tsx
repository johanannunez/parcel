"use client";

import { useMemo, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSetTopBarSlots } from "@/components/admin/chrome/TopBarSlotsContext";
import { HomesViewSwitcher, type HomesViewKey } from "./HomesViewSwitcher";
import { PropertiesTopBarSearch } from "./PropertiesTopBarSearch";
import {
  PropertiesFilterProvider,
  usePropertiesFilter,
} from "./PropertiesFilterContext";

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
  return (
    <PropertiesFilterProvider>
      <TopBarController owners={owners} summaries={summaries} />
      {children}
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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { selection } = usePropertiesFilter();

  const view = searchParams?.get("view") ?? "";
  const mode = searchParams?.get("mode") ?? "";

  const activeKey: HomesViewKey = useMemo(() => {
    if (view === "launchpad") return "status";
    if (mode === "table") return "table";
    return "gallery";
  }, [view, mode]);

  const visibleCount = useMemo(() => {
    const noSelection =
      selection.ownerIds.size === 0 && selection.propertyIds.size === 0;
    if (noSelection) return summaries.length;
    return summaries.filter((p) => {
      if (selection.propertyIds.has(p.id)) return true;
      return p.owners.some((o) => selection.ownerIds.has(o.id));
    }).length;
  }, [selection, summaries]);

  const handleGallery = () => {
    router.replace("/admin/properties?view=details&mode=gallery", { scroll: false });
  };
  const handleTable = () => {
    router.replace("/admin/properties?view=details&mode=table", { scroll: false });
  };

  useSetTopBarSlots(
    () => ({
      centerSlot: (
        <HomesViewSwitcher
          activeKey={activeKey}
          tabs={[
            {
              key: "status",
              label: "Status",
              href: "/admin/properties?view=launchpad",
            },
            activeKey === "status"
              ? { key: "gallery", label: "Gallery", href: "/admin/properties?view=details&mode=gallery" }
              : { key: "gallery", label: "Gallery", onClick: handleGallery },
            activeKey === "status"
              ? { key: "table", label: "Table", href: "/admin/properties?view=details&mode=table" }
              : { key: "table", label: "Table", onClick: handleTable },
          ]}
        />
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
    [activeKey, pathname, visibleCount, owners, summaries],
  );

  return null;
}
