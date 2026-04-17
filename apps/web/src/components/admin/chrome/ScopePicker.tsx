"use client";

import { useEffect, useState } from "react";
import type { CreateScopeTarget } from "./CreateScopeContext";
import type { ScopeResult } from "@/lib/admin/scope-search";
import styles from "./ScopePicker.module.css";

type Props = {
  anchorStyle?: React.CSSProperties;
  onPick: (target: CreateScopeTarget) => void;
};

export function ScopePicker({ anchorStyle, onPick }: Props) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<ScopeResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    const id = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/admin/scope-search?q=${encodeURIComponent(q)}`,
          { cache: "no-store" },
        );
        if (res.ok) {
          const json = (await res.json()) as { results: ScopeResult[] };
          setResults(json.results);
        } else {
          setResults([]);
        }
      } finally {
        setLoading(false);
      }
    }, 150);
    return () => clearTimeout(id);
  }, [q]);

  const owners = results.filter((r) => r.kind === "owner");
  const properties = results.filter((r) => r.kind === "property");
  const hasAnyResults = owners.length > 0 || properties.length > 0;

  return (
    <div
      className={styles.popover}
      style={anchorStyle}
      role="dialog"
      aria-label="Pick scope"
    >
      <input
        autoFocus
        className={styles.input}
        placeholder="Search owners or properties..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {q.trim() && !loading && !hasAnyResults ? (
        <div className={styles.empty}>No matches for &ldquo;{q}&rdquo;.</div>
      ) : null}

      {owners.length > 0 ? (
        <>
          <div className={styles.sectionHead}>Owners</div>
          {owners.map((r) => (
            <button
              key={`o-${r.id}`}
              type="button"
              className={styles.item}
              onClick={() =>
                onPick({ kind: "owner", id: r.id, displayName: r.displayName, initials: r.initials })
              }
            >
              <span className={styles.dot}>{r.initials}</span>
              <span>{r.displayName}</span>
              {r.sub ? <span className={styles.sub}>{r.sub}</span> : null}
            </button>
          ))}
        </>
      ) : null}

      {properties.length > 0 ? (
        <>
          <div className={styles.sectionHead}>Properties</div>
          {properties.map((r) => (
            <button
              key={`p-${r.id}`}
              type="button"
              className={styles.item}
              onClick={() =>
                onPick({ kind: "property", id: r.id, displayName: r.displayName, initials: r.initials })
              }
            >
              <span className={styles.dot}>{r.initials}</span>
              <span>{r.displayName}</span>
              {r.sub ? <span className={styles.sub}>{r.sub}</span> : null}
            </button>
          ))}
        </>
      ) : null}

      <div className={styles.sectionHead}>Or</div>
      <button
        type="button"
        className={`${styles.item} ${styles.global}`}
        onClick={() => onPick(null)}
      >
        <span className={styles.dot}>∞</span>
        <span>Keep global (no target)</span>
      </button>
    </div>
  );
}
