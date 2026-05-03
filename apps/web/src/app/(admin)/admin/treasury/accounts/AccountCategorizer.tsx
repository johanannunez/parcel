"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Warning } from "@phosphor-icons/react";
import type { BucketCategory } from "@/lib/treasury/types";
import ConfirmModal from "@/components/admin/ConfirmModal";
import { CustomSelect } from "@/components/admin/CustomSelect";
import { removeAccount } from "./actions";

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

type UncategorizedAccount = {
  id: string;
  name: string;
  mask: string | null;
  type: string;
};

function AccountCategorizerCard({ account }: { account: UncategorizedAccount }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [removing, setRemoving] = useState(false);

  async function handleConfirmRemove() {
    setConfirmOpen(false);
    setRemoving(true);
    try {
      await removeAccount(account.id);
      router.refresh();
    } catch {
      setRemoving(false);
    }
  }

  async function handleCategoryChange(value: BucketCategory | "") {
    setError(null);
    if (value === "") return;

    setSaving(true);
    try {
      const res = await fetch(`/api/treasury/accounts/${account.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bucket_category: value }),
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
    <>
      <div
        style={{
          backgroundColor: "var(--color-white)",
          border: "1.5px solid rgba(245,158,11,0.25)",
          borderRadius: "14px",
          padding: "16px 20px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          opacity: removing ? 0.5 : 1,
          transition: "opacity 0.15s ease",
        }}
      >
        {/* Account identity + remove */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
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
          <button
            onClick={() => setConfirmOpen(true)}
            disabled={removing || saving}
            title={`Remove ${account.name}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "3px",
              padding: "3px 7px",
              borderRadius: "6px",
              border: "1px solid transparent",
              backgroundColor: "transparent",
              color: "var(--color-text-tertiary)",
              fontSize: "11px",
              fontWeight: 500,
              cursor: removing || saving ? "not-allowed" : "pointer",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              if (!removing && !saving) {
                e.currentTarget.style.color = "#b91c1c";
                e.currentTarget.style.backgroundColor = "rgba(220,38,38,0.06)";
                e.currentTarget.style.borderColor = "rgba(220,38,38,0.15)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--color-text-tertiary)";
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.borderColor = "transparent";
            }}
          >
            Remove
          </button>
        </div>

        {/* Category select — auto-saves on change */}
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
          <CustomSelect
            defaultValue=""
            onChange={(value) => handleCategoryChange(value as BucketCategory | "")}
            disabled={saving || removing}
            placeholder="Select a bucket..."
            options={[
              { value: "", label: "Select a bucket..." },
              ...ALL_BUCKET_OPTIONS,
            ]}
          />
        </div>

        {saving && (
          <p style={{ margin: 0, fontSize: "12px", color: "var(--color-text-tertiary)" }}>Saving...</p>
        )}

        {error && (
          <p style={{ margin: 0, fontSize: "12px", color: "#dc2626" }}>{error}</p>
        )}
      </div>

      <ConfirmModal
        open={confirmOpen}
        variant="danger"
        title={`Remove ${account.name}?`}
        description="This account will be removed from Treasury. You can re-add it by disconnecting and reconnecting the bank."
        confirmLabel="Remove"
        cancelLabel="Keep"
        onConfirm={handleConfirmRemove}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
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
