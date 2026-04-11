"use client";

import { useState, useTransition } from "react";
import { EnvelopeSimple, X, Copy, Check } from "@phosphor-icons/react";
import { inviteOwner } from "./actions";

export function InviteOwnerButton({
  ownerId,
  ownerName,
}: {
  ownerId: string;
  ownerName: string;
}) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(
    null,
  );
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    if (!email.trim()) return;
    startTransition(async () => {
      const res = await inviteOwner(ownerId, email.trim());
      setResult(res);
    });
  }

  function handleCopy(text: string) {
    // Extract the URL from the message
    const urlMatch = text.match(/https?:\/\/\S+/);
    if (urlMatch) {
      navigator.clipboard.writeText(urlMatch[0]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
        style={{
          background: "linear-gradient(135deg, #02aaeb, #1b77be)",
        }}
      >
        <EnvelopeSimple size={14} weight="bold" />
        Invite Owner
      </button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}
        onClick={() => {
          if (!isPending) {
            setOpen(false);
            setResult(null);
            setEmail("");
          }
        }}
      />

      {/* Modal */}
      <div
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border p-6"
        style={{
          backgroundColor: "var(--color-white)",
          borderColor: "var(--color-warm-gray-200)",
          boxShadow: "0 24px 48px -12px rgba(0,0,0,0.25)",
        }}
      >
        <div className="flex items-center justify-between">
          <h2
            className="text-lg font-semibold tracking-tight"
            style={{ color: "var(--color-text-primary)" }}
          >
            Invite {ownerName}
          </h2>
          <button
            onClick={() => {
              setOpen(false);
              setResult(null);
              setEmail("");
            }}
            className="rounded-lg p-1 transition-colors hover:bg-[var(--color-warm-gray-100)]"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {!result ? (
          <>
            <p
              className="mt-2 text-sm"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Enter their real email address. This will generate a one-time
              invite link you can share with them.
            </p>

            <div className="mt-4">
              <label
                htmlFor="invite-email"
                className="mb-1.5 block text-sm font-medium"
                style={{ color: "var(--color-text-primary)" }}
              >
                Email address
              </label>
              <input
                id="invite-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@example.com"
                className="w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-[var(--color-brand)]"
                style={{
                  borderColor: "var(--color-warm-gray-200)",
                  color: "var(--color-text-primary)",
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit();
                }}
                autoFocus
              />
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => {
                  setOpen(false);
                  setEmail("");
                }}
                className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-[var(--color-warm-gray-50)]"
                style={{
                  borderColor: "var(--color-warm-gray-200)",
                  color: "var(--color-text-secondary)",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isPending || !email.trim()}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: "var(--color-brand)" }}
              >
                {isPending ? "Sending..." : "Generate invite link"}
              </button>
            </div>
          </>
        ) : (
          <>
            <div
              className="mt-4 rounded-lg border p-4 text-sm whitespace-pre-wrap"
              style={{
                backgroundColor: result.ok
                  ? "rgba(22, 163, 74, 0.06)"
                  : "rgba(220, 38, 38, 0.06)",
                borderColor: result.ok
                  ? "rgba(22, 163, 74, 0.2)"
                  : "rgba(220, 38, 38, 0.2)",
                color: "var(--color-text-primary)",
              }}
            >
              {result.message}
            </div>

            {result.ok && result.message.includes("http") ? (
              <button
                onClick={() => handleCopy(result.message)}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors hover:bg-[var(--color-warm-gray-50)]"
                style={{
                  borderColor: "var(--color-warm-gray-200)",
                  color: "var(--color-text-primary)",
                }}
              >
                {copied ? (
                  <>
                    <Check size={14} weight="bold" style={{ color: "#16a34a" }} />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy size={14} weight="bold" />
                    Copy invite link
                  </>
                )}
              </button>
            ) : null}

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => {
                  setOpen(false);
                  setResult(null);
                  setEmail("");
                  window.location.reload();
                }}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: "var(--color-brand)" }}
              >
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
