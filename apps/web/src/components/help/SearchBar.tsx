"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MagnifyingGlass, Sparkle, X } from "@phosphor-icons/react";

type SearchResult = {
  slug: string;
  categorySlug: string;
  title: string;
  category: string;
  readTimeMinutes: number;
};

export function SearchBar({
  onToggleAI,
  aiActive = false,
}: {
  onToggleAI?: () => void;
  aiActive?: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/help/search?q=${encodeURIComponent(q.trim())}`
      );
      if (res.ok) {
        const data: SearchResult[] = await res.json();
        setResults(data);
        setOpen(data.length > 0);
      }
    } catch {
      /* network error, silently ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = useCallback(
    (value: string) => {
      setQuery(value);
      setFocusedIndex(-1);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => search(value), 300);
    },
    [search]
  );

  const handleSelect = useCallback(
    (result: SearchResult) => {
      setOpen(false);
      setQuery("");
      router.push(`/help/${result.categorySlug}/${result.slug}`);
    },
    [router]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
        return;
      }
      if (!open || results.length === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedIndex((i) => (i < results.length - 1 ? i + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedIndex((i) => (i > 0 ? i - 1 : results.length - 1));
      } else if (e.key === "Enter" && focusedIndex >= 0) {
        e.preventDefault();
        handleSelect(results[focusedIndex]);
      }
    },
    [open, results, focusedIndex, handleSelect]
  );

  /* Close on outside click */
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  /* Cleanup debounce on unmount */
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl mx-auto">
      {/* Input row */}
      <div
        className="relative flex items-center rounded-xl border transition-shadow duration-200"
        style={{
          backgroundColor: "var(--color-white)",
          borderColor: open
            ? "var(--color-brand)"
            : "var(--color-warm-gray-200)",
          boxShadow: open
            ? "0 0 0 3px rgba(2, 170, 235, 0.12), 0 4px 16px -4px rgba(0, 0, 0, 0.08)"
            : "var(--shadow-sm)",
        }}
      >
        <span
          className="pointer-events-none absolute left-4 flex items-center"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          <MagnifyingGlass size={20} weight="duotone" />
        </span>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search help articles..."
          aria-label="Search help articles"
          aria-expanded={open}
          aria-controls="search-results-list"
          role="combobox"
          aria-autocomplete="list"
          aria-activedescendant={
            focusedIndex >= 0 ? `search-result-${focusedIndex}` : undefined
          }
          className="w-full rounded-xl py-3.5 pl-11 pr-28 text-sm font-medium outline-none placeholder:font-normal"
          style={{
            color: "var(--color-text-primary)",
            backgroundColor: "transparent",
          }}
        />

        {/* Clear button */}
        {query.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setResults([]);
              setOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-20 flex items-center justify-center rounded-md p-1 transition-colors duration-150 hover:bg-[var(--color-warm-gray-100)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--color-brand)]"
            style={{ color: "var(--color-text-tertiary)" }}
            aria-label="Clear search"
          >
            <X size={16} weight="bold" />
          </button>
        )}

        {/* AI toggle */}
        {onToggleAI && (
          <button
            type="button"
            onClick={onToggleAI}
            className="absolute right-3 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--color-brand)]"
            style={{
              backgroundColor: aiActive
                ? "var(--color-brand)"
                : "var(--color-warm-gray-100)",
              color: aiActive
                ? "var(--color-white)"
                : "var(--color-text-secondary)",
            }}
            aria-pressed={aiActive}
            aria-label="Toggle AI chat"
          >
            <Sparkle size={14} weight={aiActive ? "fill" : "duotone"} />
            Ask AI
          </button>
        )}
      </div>

      {/* Results dropdown */}
      {open && results.length > 0 && (
        <ul
          id="search-results-list"
          role="listbox"
          className="absolute left-0 right-0 z-50 mt-2 max-h-80 overflow-y-auto rounded-xl border py-1.5"
          style={{
            backgroundColor: "var(--color-white)",
            borderColor: "var(--color-warm-gray-200)",
            boxShadow:
              "0 12px 32px -8px rgba(0, 0, 0, 0.12), 0 4px 8px -2px rgba(0, 0, 0, 0.06)",
          }}
        >
          {results.map((result, i) => (
            <li
              key={`${result.categorySlug}/${result.slug}`}
              id={`search-result-${i}`}
              role="option"
              aria-selected={i === focusedIndex}
            >
              <button
                type="button"
                onClick={() => handleSelect(result)}
                onMouseEnter={() => setFocusedIndex(i)}
                className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors duration-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[var(--color-brand)]"
                style={{
                  backgroundColor:
                    i === focusedIndex
                      ? "var(--color-warm-gray-50)"
                      : "transparent",
                }}
              >
                <div className="min-w-0 flex-1">
                  <div
                    className="text-sm font-semibold leading-snug"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {result.title}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span
                      className="text-xs font-medium"
                      style={{ color: "var(--color-brand)" }}
                    >
                      {result.category}
                    </span>
                    <span
                      className="text-[11px]"
                      style={{ color: "var(--color-text-tertiary)" }}
                    >
                      {result.readTimeMinutes} min read
                    </span>
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Loading indicator */}
      {loading && query.length >= 2 && (
        <div
          className="absolute left-0 right-0 z-50 mt-2 rounded-xl border px-4 py-6 text-center text-sm"
          style={{
            backgroundColor: "var(--color-white)",
            borderColor: "var(--color-warm-gray-200)",
            color: "var(--color-text-tertiary)",
            boxShadow: "var(--shadow-md)",
          }}
        >
          Searching...
        </div>
      )}
    </div>
  );
}
