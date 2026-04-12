"use client";

import { useActionState, useEffect, useState } from "react";
import { verifyTreasuryAccess, type VerifyState } from "./actions";

interface TreasuryVerifyFormProps {
  redirectTo: string;
}

const initialState: VerifyState = { error: null, lockedUntil: null };

export function TreasuryVerifyForm({ redirectTo }: TreasuryVerifyFormProps) {
  const [state, action, isPending] = useActionState(verifyTreasuryAccess, initialState);

  // Compute lock state outside render to satisfy React purity rules
  const [now, setNow] = useState(() => Date.now());
  const isLocked = state.lockedUntil != null && state.lockedUntil > now;

  // Re-check lock expiry every second while locked
  useEffect(() => {
    if (!isLocked) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [isLocked]);

  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <input type="hidden" name="redirectTo" value={redirectTo} />

      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <label
          htmlFor="treasury-password"
          style={{
            fontSize: "13px",
            fontWeight: 500,
            color: "var(--color-text-primary)",
            letterSpacing: "0.01em",
          }}
        >
          Password
        </label>
        <input
          id="treasury-password"
          name="password"
          type="password"
          autoComplete="current-password"
          autoFocus
          disabled={isPending || isLocked}
          required
          placeholder="Enter your password"
          style={{
            width: "100%",
            padding: "10px 14px",
            fontSize: "15px",
            lineHeight: "1.5",
            color: "var(--color-text-primary)",
            backgroundColor: "var(--color-off-white)",
            border: `1.5px solid ${state.error ? "#d93025" : "var(--color-warm-gray-200)"}`,
            borderRadius: "8px",
            outline: "none",
            transition: "border-color 0.15s ease",
            boxSizing: "border-box",
          }}
          onFocus={(e) => {
            if (!state.error) {
              e.currentTarget.style.borderColor = "#02AAEB";
            }
          }}
          onBlur={(e) => {
            if (!state.error) {
              e.currentTarget.style.borderColor = "var(--color-warm-gray-200)";
            }
          }}
        />

        {state.error && (
          <p
            role="alert"
            style={{
              margin: 0,
              fontSize: "13px",
              color: "#d93025",
              lineHeight: "1.4",
            }}
          >
            {state.error}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending || isLocked}
        style={{
          width: "100%",
          padding: "11px 20px",
          fontSize: "15px",
          fontWeight: 600,
          letterSpacing: "0.01em",
          color: "#ffffff",
          background: isPending || isLocked
            ? "var(--color-warm-gray-200)"
            : "linear-gradient(135deg, #02AAEB, #1B77BE)",
          border: "none",
          borderRadius: "8px",
          cursor: isPending || isLocked ? "not-allowed" : "pointer",
          transition: "opacity 0.15s ease",
          opacity: isPending || isLocked ? 0.7 : 1,
        }}
      >
        {isPending ? "Verifying..." : "Unlock Treasury"}
      </button>
    </form>
  );
}
