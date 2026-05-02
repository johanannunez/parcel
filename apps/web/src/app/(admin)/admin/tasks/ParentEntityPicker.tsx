'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import styles from './ParentEntityPicker.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────

export type EntityType = 'property' | 'contact' | 'project';

type SearchResult = {
  id: string;
  label: string;
};

type Props = {
  type: EntityType;
  value: string | null;
  label: string | null;
  onChange: (id: string | null, label: string | null) => void;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const PLACEHOLDER_LABELS: Record<EntityType, string> = {
  property: 'Add property',
  contact: 'Add contact',
  project: 'Add project',
};

// ─── Component ───────────────────────────────────────────────────────────────

export function ParentEntityPicker({ type, value, label, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [panelPos, setPanelPos] = useState<{ top: number; left: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/tasks/parent-search?type=${type}&q=${encodeURIComponent(query)}`
        );
        if (!res.ok) throw new Error('Search failed');
        const data: SearchResult[] = await res.json();
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, open, type]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      const inContainer = containerRef.current?.contains(target) ?? false;
      const inPanel = panelRef.current?.contains(target) ?? false;
      if (!inContainer && !inPanel) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleSelect = useCallback((id: string, selectedLabel: string) => {
    onChange(id, selectedLabel);
    setOpen(false);
  }, [onChange]);

  const handleClear = useCallback(() => {
    onChange(null, null);
    setOpen(false);
  }, [onChange]);

  return (
    <div className={styles.container} ref={containerRef}>
      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        className={value ? styles.triggerFilled : styles.triggerEmpty}
        onClick={() => {
          const rect = triggerRef.current?.getBoundingClientRect();
          if (rect) setPanelPos({ top: rect.bottom + 4, left: rect.left });
          setOpen((v) => !v);
        }}
      >
        {value ? label : PLACEHOLDER_LABELS[type]}
      </button>

      {/* Dropdown panel — rendered in a portal to escape sidebar overflow clipping */}
      {open && panelPos && createPortal(
        <div
          ref={panelRef}
          className={styles.panel}
          style={{ position: 'fixed', top: panelPos.top, left: panelPos.left }}
          onClick={(e) => e.stopPropagation()}
        >
          <input
            ref={inputRef}
            type="text"
            className={styles.searchInput}
            placeholder={`Search ${type}s…`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setOpen(false);
            }}
          />

          <div className={styles.results}>
            {loading && (
              <div className={styles.emptyState}>Searching…</div>
            )}
            {!loading && results.length === 0 && (
              <div className={styles.emptyState}>
                {query.length > 0 ? 'No results' : `Type to search ${type}s`}
              </div>
            )}
            {!loading && results.map((r) => (
              <button
                key={r.id}
                type="button"
                className={`${styles.resultRow} ${r.id === value ? styles.resultRowActive : ''}`}
                onClick={() => handleSelect(r.id, r.label)}
              >
                {r.label}
              </button>
            ))}
          </div>

          {value && (
            <>
              <div className={styles.divider} />
              <button
                type="button"
                className={styles.clearRow}
                onClick={handleClear}
              >
                Clear
              </button>
            </>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
