"use client";

import { useRef, useState } from "react";
import { MagnifyingGlass, CaretDown } from "@phosphor-icons/react";
import styles from "./PropertiesTopBarSearch.module.css";
import { PropertyFilterPopover } from "./PropertyFilterPopover";
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
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const totalSelected = selection.ownerIds.size + selection.propertyIds.size;
  const hasSelection = totalSelected > 0;

  return (
    <PropertyFilterPopover
      owners={owners}
      properties={properties}
      selection={selection}
      onChange={setSelection}
      totalVisible={totalVisible}
      totalAll={totalAll}
      hideChips
      hideSearchRow
      popoverAlign="right"
      portal
      popoverWidth={360}
      externalQuery={query}
      onExternalQueryChange={setQuery}
      externalOpen={open}
      onExternalOpenChange={setOpen}
      renderTrigger={() => (
        <div
          className={`${styles.trigger} ${open ? styles.triggerOpen : ""} ${hasSelection ? styles.triggerActive : ""}`}
          onClick={() => inputRef.current?.focus()}
        >
          <MagnifyingGlass size={14} weight="bold" className={styles.icon} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!open) setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={
              hasSelection
                ? `${totalSelected} selected`
                : "Search owners or properties"
            }
            className={styles.input}
          />
          <CaretDown
            size={11}
            weight="bold"
            className={`${styles.caret} ${open ? styles.caretOpen : ""}`}
          />
        </div>
      )}
    />
  );
}
