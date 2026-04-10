"use client";

import { useActionState, useCallback, useState } from "react";
import { Warning, Trash, X } from "@phosphor-icons/react";
import { requestAccountDeletion } from "../actions";

export function DangerZoneSection() {
  const [modalOpen, setModalOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    requestAccountDeletion,
    null,
  );
  const [confirmText, setConfirmText] = useState("");

  const openModal = useCallback(() => {
    setConfirmText("");
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setConfirmText("");
  }, []);

  return (
    <section id="danger">
      <h2
        className="text-xl font-semibold tracking-tight"
        style={{ color: "var(--color-text-primary)" }}
      >
        Danger Zone
      </h2>
      <p
        className="mb-6 text-sm"
        style={{ color: "var(--color-text-secondary)" }}
      >
        Irreversible actions for your account.
      </p>

      <div
        className="relative overflow-hidden rounded-2xl border p-7"
        style={{
          backgroundColor: "rgba(220, 38, 38, 0.03)",
          borderColor: "rgba(220, 38, 38, 0.2)",
        }}
      >
        {/* Subtle shimmer */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(105deg, transparent 40%, rgba(220, 38, 38, 0.04) 50%, transparent 60%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 6s ease-in-out infinite",
          }}
        />

        <div className="relative flex items-start gap-4">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: "rgba(220, 38, 38, 0.08)" }}
          >
            <Warning
              size={20}
              weight="duotone"
              style={{ color: "var(--color-error)" }}
            />
          </div>

          <div className="flex flex-1 flex-col gap-1">
            <h3
              className="text-sm font-semibold"
              style={{ color: "var(--color-text-primary)" }}
            >
              Delete your account
            </h3>
            <p
              className="text-sm"
              style={{ color: "var(--color-text-secondary)" }}
            >
              This will permanently delete your account, properties, and all
              associated data. This action cannot be undone.
            </p>

            <button
              type="button"
              onClick={openModal}
              className="mt-4 inline-flex w-fit items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "var(--color-error)" }}
            >
              <Trash size={16} weight="bold" />
              Delete account
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            className="relative w-full max-w-md rounded-2xl p-7"
            style={{
              backgroundColor: "var(--color-white)",
              boxShadow:
                "0 20px 60px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)",
            }}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={closeModal}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[var(--color-warm-gray-100)]"
              style={{ color: "var(--color-text-tertiary)" }}
              aria-label="Close"
            >
              <X size={18} weight="bold" />
            </button>

            {/* Icon */}
            <div
              className="mb-5 flex h-12 w-12 items-center justify-center rounded-full"
              style={{ backgroundColor: "rgba(220, 38, 38, 0.08)" }}
            >
              <Warning
                size={24}
                weight="duotone"
                style={{ color: "var(--color-error)" }}
              />
            </div>

            <h3
              className="text-lg font-semibold"
              style={{ color: "var(--color-text-primary)" }}
            >
              Are you sure?
            </h3>
            <p
              className="mt-2 text-sm"
              style={{ color: "var(--color-text-secondary)" }}
            >
              This will permanently delete your account and all associated data
              including properties, bookings, and payouts. This cannot be undone.
            </p>

            <form action={formAction}>
              <div className="mt-5">
                <label
                  htmlFor="delete-confirmation"
                  className="mb-1.5 block text-sm font-medium"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Type{" "}
                  <span className="font-bold" style={{ color: "var(--color-error)" }}>
                    DELETE
                  </span>{" "}
                  to confirm
                </label>
                <input
                  id="delete-confirmation"
                  name="confirmation"
                  type="text"
                  autoComplete="off"
                  spellCheck={false}
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-[var(--color-error)]"
                  style={{
                    borderColor: "var(--color-warm-gray-200)",
                    color: "var(--color-text-primary)",
                    backgroundColor: "var(--color-white)",
                  }}
                  placeholder='Type "DELETE"'
                />
              </div>

              {/* Error feedback */}
              {state && !state.ok && (
                <div
                  className="mt-3 rounded-lg border px-4 py-3 text-sm font-medium"
                  style={{
                    backgroundColor: "rgba(220, 38, 38, 0.08)",
                    borderColor: "rgba(220, 38, 38, 0.25)",
                    color: "var(--color-error)",
                  }}
                >
                  {state.message}
                </div>
              )}

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-80"
                  style={{
                    borderColor: "var(--color-warm-gray-200)",
                    color: "var(--color-text-primary)",
                    backgroundColor: "var(--color-white)",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || confirmText !== "DELETE"}
                  className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                  style={{ backgroundColor: "var(--color-error)" }}
                >
                  <Trash size={16} weight="bold" />
                  {isPending ? "Deleting..." : "Delete my account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </section>
  );
}
