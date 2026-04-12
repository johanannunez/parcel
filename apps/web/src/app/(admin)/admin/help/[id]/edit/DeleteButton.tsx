"use client";

import { useState, useTransition } from "react";

export function DeleteButton({ action }: { action: () => Promise<void> }) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
        style={{
          borderColor: "rgba(239, 68, 68, 0.3)",
          color: "#dc2626",
        }}
      >
        Delete Article
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            await action();
          });
        }}
        className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-50"
        style={{ backgroundColor: "#dc2626" }}
      >
        {isPending ? "Deleting..." : "Yes, delete permanently"}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="text-sm font-medium transition-colors"
        style={{ color: "var(--color-text-secondary)" }}
      >
        Cancel
      </button>
    </div>
  );
}
