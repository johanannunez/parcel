"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash } from "@phosphor-icons/react";
import ConfirmModal from "@/components/admin/ConfirmModal";
import { removeAccount } from "./actions";

export default function RemoveAccountButton({
  accountId,
  accountName,
}: {
  accountId: string;
  accountName: string;
}) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [removing, setRemoving] = useState(false);

  async function handleConfirm() {
    setConfirmOpen(false);
    setRemoving(true);
    try {
      await removeAccount(accountId);
      router.refresh();
    } catch {
      setRemoving(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setConfirmOpen(true)}
        disabled={removing}
        title={`Remove ${accountName}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          padding: "4px 8px",
          borderRadius: "6px",
          border: "1px solid transparent",
          backgroundColor: "transparent",
          color: "var(--color-text-tertiary)",
          fontSize: "11px",
          fontWeight: 500,
          cursor: removing ? "not-allowed" : "pointer",
          opacity: removing ? 0.5 : 1,
          transition: "color 0.15s ease, background-color 0.15s ease, border-color 0.15s ease",
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          if (!removing) {
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
        <Trash size={12} weight="bold" />
        {removing ? "Removing..." : "Remove"}
      </button>

      <ConfirmModal
        open={confirmOpen}
        variant="danger"
        title={`Remove ${accountName}?`}
        description="This account will be removed from Treasury. You can re-add it by disconnecting and reconnecting the bank."
        confirmLabel="Remove"
        cancelLabel="Keep"
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
