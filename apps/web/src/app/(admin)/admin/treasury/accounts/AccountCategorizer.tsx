"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Warning } from "@phosphor-icons/react";
import type { BucketCategory } from "@/lib/treasury/types";

const ALL_BUCKET_OPTIONS: { value: BucketCategory; label: string }[] = [
  { value: "income", label: "Income" },
  { value: "owners_comp", label: "Owner's Comp" },
  { value: "tax", label: "Tax Reserve" },
  { value: "emergency", label: "Emergency Fund" },
  { value: "opex", label: "Operating Expenses" },
  { value: "profit", label: "Profit" },
  { value: "generosity", label: "Generosity" },
  { value: "growth", label: "Growth" },
  { value: "cleaners", label: "Cleaners" },
  { value: "yearly", label: "Yearly" },
  { value: "disbursement", label: "Disbursement" },
  { value: "deposits", label: "Deposits" },
  { value: "uncategorized", label: "Uncategorized" },
];

// Only these 6 buckets use an allocation target pct
const ALLOCATION_BUCKET_SET = new Set<BucketCategory>([
  "owners_comp",
  "tax",
  "emergency",
  "opex",
  "profit",
  "generosity",
]);

type UncategorizedAccount = {
  id: string;
  name: string;
  mask: string | null;
  type: string;
};

function AccountCategorizerCard({ account }: { account: UncategorizedAccount }) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<BucketCategory | "">("");
  const [allocationPct, setAllocationPct] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const showAllocationInput =
    selectedCategory !== "" && ALLOCATION_BUCKET_SET.has(selectedCategory as BucketCategory);

  async function handleCategoryChange(value: BucketCategory | "") {
    setSelectedCategory(value);
    setError(null);
    if (!ALLOCATION_BUCKET_SET.has(value as BucketCategory)) {
      // Auto-save for non-allocation buckets on category select
      if (value === "") return;
      await save(value as BucketCategory, null);
    }
  }

  async function handleSave() {
    if (!selectedCategory) return;
    const pct = allocationPct !== "" ? parseFloat(allocationPct) : null;
    if (pct !== null && (isNaN(pct) || pct < 0 || pct > 100)) {
      setError("Allocation must be between 0 and 100");
      return;
    }
    await save(selectedCategory as BucketCategory, pct);
  }

  async function save(category: BucketCategory, pct: number | null) {
    setSaving(true);
    setError(null);
    try {
      const body: { bucket_category: BucketCategory; allocation_target_pct?: number | null } = {
        bucket_category: category,
      };
      if (ALLOCATION_BUCKET_SET.has(category)) {
        body.allocation_target_pct = pct;
      }

      const res = await fetch(`/api/treasury/accounts/${account.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Failed to save");
      }

      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  if (saved) return null;

  return (
    <div
      style={{
        backgroundColor: "var(--color-white)",
        border: "1.5px solid rgba(245,158,11,0.25)",
        borderRadius: "14px",
        padding: "16px 20px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      {/* Account identity */}
      <div>
        <div
          style={{
            fontSize: "14px",
            fontWeight: 600,
            color: "var(--color-text-primary)",
            letterSpacing: "-0.01em",
          }}
        >
          {account.name}
        </div>
        {account.mask && (
          <div style={{ fontSize: "12px", color: "var(--color-text-tertiary)" }}>
            ···· {account.mask}
          </div>
        )}
      </div>

      {/* Category select */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <label
          style={{
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--color-text-tertiary)",
          }}
        >
          Bucket
        </label>
        <select
          value={selectedCategory}
          onChange={(e) => handleCategoryChange(e.target.value as BucketCategory | "")}
          disabled={saving}
          style={{
            padding: "8px 12px",
            borderRadius: "8px",
            border: "1.5px solid var(--color-warm-gray-200)",
            backgroundColor: "var(--color-white)",
            fontSize: "13px",
            color: selectedCategory ? "var(--color-text-primary)" : "var(--color-text-tertiary)",
            cursor: saving ? "not-allowed" : "pointer",
            outline: "none",
            width: "100%",
          }}
        >
          <option value="">Select a bucket...</option>
          {ALL_BUCKET_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Allocation target — only shown for the 6 allocation buckets */}
      {showAllocationInput && (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label
            style={{
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "var(--color-text-tertiary)",
            }}
          >
            Allocation Target %
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="number"
              min={0}
              max={100}
              step={0.1}
              placeholder="e.g. 50"
              value={allocationPct}
              onChange={(e) => setAllocationPct(e.target.value)}
              disabled={saving}
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1.5px solid var(--color-warm-gray-200)",
                backgroundColor: "var(--color-white)",
                fontSize: "13px",
                color: "var(--color-text-primary)",
                outline: "none",
              }}
            />
            <button
              onClick={handleSave}
              disabled={saving || !selectedCategory}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                background: saving ? "rgba(2,170,235,0.4)" : "linear-gradient(135deg, #02AAEB, #1B77BE)",
                color: "#fff",
                fontSize: "12px",
                fontWeight: 600,
                border: "none",
                cursor: saving || !selectedCategory ? "not-allowed" : "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      )}

      {error && (
        <p style={{ margin: 0, fontSize: "12px", color: "#dc2626" }}>{error}</p>
      )}
    </div>
  );
}

export default function AccountCategorizer({
  accounts,
}: {
  accounts: UncategorizedAccount[];
}) {
  if (accounts.length === 0) return null;

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Banner */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
          padding: "14px 18px",
          borderRadius: "12px",
          border: "1.5px solid rgba(245,158,11,0.3)",
          backgroundColor: "rgba(245,158,11,0.06)",
        }}
      >
        <Warning size={18} weight="fill" color="#d97706" style={{ flexShrink: 0, marginTop: "1px" }} />
        <div>
          <div
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--color-text-primary)",
              marginBottom: "2px",
            }}
          >
            Some accounts need to be categorized
          </div>
          <div style={{ fontSize: "12px", color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
            Assign each account to a Profit First bucket.
          </div>
        </div>
      </div>

      {/* Uncategorized account cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: "12px",
        }}
      >
        {accounts.map((account) => (
          <AccountCategorizerCard key={account.id} account={account} />
        ))}
      </div>
    </section>
  );
}
