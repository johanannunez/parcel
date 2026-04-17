"use client";

import { MagnifyingGlass, CaretDown } from "@phosphor-icons/react";
import styles from "./PropertiesTopBarSearch.module.css";
import {
  PropertyFilterPopover,
  type PropertyFilterTriggerProps,
} from "./PropertyFilterPopover";
import { usePropertiesFilter } from "./PropertiesFilterContext";

type Owner = { id: string; name: string | null };
type Property = {
  id: string;
  street: string;
  unit: string | null;
  location: string;
  owners: Array<{ id: string; name: string | null }>;
};

export function PropertiesTopBarSearch({
  owners,
  properties,
  totalVisible,
  totalAll,
}: {
  owners: Owner[];
  properties: Property[];
  totalVisible: number;
  totalAll: number;
}) {
  const { selection, setSelection } = usePropertiesFilter();

  return (
    <PropertyFilterPopover
      owners={owners}
      properties={properties}
      selection={selection}
      onChange={setSelection}
      totalVisible={totalVisible}
      totalAll={totalAll}
      hideChips
      popoverAlign="right"
      renderTrigger={(p) => <TopBarTrigger {...p} />}
    />
  );
}

function TopBarTrigger({
  open,
  toggle,
  hasSelection,
  totalSelected,
}: PropertyFilterTriggerProps) {
  return (
    <button
      type="button"
      onClick={toggle}
      className={`${styles.trigger} ${open ? styles.triggerOpen : ""} ${hasSelection ? styles.triggerActive : ""}`}
    >
      <MagnifyingGlass size={14} weight="bold" className={styles.icon} />
      <span className={styles.placeholder}>
        {hasSelection ? (
          <>
            <strong>{totalSelected}</strong> selected
          </>
        ) : (
          "Search owners or properties"
        )}
      </span>
      <CaretDown
        size={11}
        weight="bold"
        className={`${styles.caret} ${open ? styles.caretOpen : ""}`}
      />
    </button>
  );
}
