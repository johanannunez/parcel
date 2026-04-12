"use client";

import { useActionState, useEffect, useState } from "react";
import { verifyTreasuryAccess, verifyMfaCode, type VerifyState } from "./actions";

interface TreasuryVerifyFormProps {
  redirectTo: string;
}

const initialState: VerifyState = { error: null, lockedUntil: null };

export function TreasuryVerifyForm({ redirectTo }: TreasuryVerifyFormProps) {
  const [passwordState, passwordAction, isPasswordPending] = useActionState(
    verifyTreasuryAccess,
    initialState,
  );
  const [mfaState, mfaAction, isMfaPending] = useActionState(
    verifyMfaCode,
    initialState,
  );

  // Compute lock state outside render to satisfy React purity rules
  const [now, setNow] = useState(() => Date.now());

  const activeState = passwordState.needsMfa ? mfaState : passwordState;
  const isLocked = activeState.lockedUntil != null && activeState.lockedUntil > now;
  const showMfaStep = passwordState.needsMfa === true;

  // Re-check lock expiry every second while locked
  useEffect(() => {
    if (!isLocked) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [isLocked]);

  // MFA step
  if (showMfaStep) {
    return (
      <form
        action={mfaAction}
        style={{ display: "flex", flexDirection: "column", gap: "20px" }}
      >
        <input type="hidden" name="redirectTo" value={redirectTo} />
        <input type="hidden" name="factorId" value={passwordState.factorId ?? ""} />

        {/* Step indicator */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 14px",
            backgroundColor: "#02AAEB0A",
            borderRadius: "8px",
            border: "1px solid #02AAEB22",
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            style={{ flexShrink: 0 }}
          >
            <circle cx="8" cy="8" r="7" stroke="#02AAEB" strokeWidth="1.5" fill="none" />
            <path d="M5 8l2 2 4-4" stroke="#02AAEB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
          <span
            style={{
              fontSize: "13px",
              color: "#1B77BE",
              fontWeight: 500,
            }}
          >
            Password verified. Enter your authenticator code.
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label
            htmlFor="treasury-mfa-code"
            style={{
              fontSize: "13px",
              fontWeight: 500,
              color: "var(--color-text-primary)",
              letterSpacing: "0.01em",
            }}
          >
            Authenticator code
          </label>
          <input
            id="treasury-mfa-code"
            name="code"
            type="text"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            autoComplete="one-time-code"
            autoFocus
            disabled={isMfaPending || isLocked}
            required
            placeholder="000000"
            style={{
              width: "100%",
              padding: "10px 14px",
              fontSize: "15px",
              lineHeight: "1.5",
              color: "var(--color-text-primary)",
              backgroundColor: "var(--color-off-white)",
              border: `1.5px solid ${mfaState.error ? "#d93025" : "var(--color-warm-gray-200)"}`,
              borderRadius: "8px",
              outline: "none",
              transition: "border-color 0.15s ease",
              boxSizing: "border-box",
              letterSpacing: "0.15em",
              fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
              textAlign: "center",
            }}
            onFocus={(e) => {
              if (!mfaState.error) {
                e.currentTarget.style.borderColor = "#02AAEB";
              }
            }}
            onBlur={(e) => {
              if (!mfaState.error) {
                e.currentTarget.style.borderColor = "var(--color-warm-gray-200)";
              }
            }}
          />

          {mfaState.error && (
            <p
              role="alert"
              style={{
                margin: 0,
                fontSize: "13px",
                color: "#d93025",
                lineHeight: "1.4",
              }}
            >
              {mfaState.error}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isMfaPending || isLocked}
          style={{
            width: "100%",
            padding: "11px 20px",
            fontSize: "15px",
            fontWeight: 600,
            letterSpacing: "0.01em",
            color: "#ffffff",
            background: isMfaPending || isLocked
              ? "var(--color-warm-gray-200)"
              : "linear-gradient(135deg, #02AAEB, #1B77BE)",
            border: "none",
            borderRadius: "8px",
            cursor: isMfaPending || isLocked ? "not-allowed" : "pointer",
            transition: "opacity 0.15s ease",
            opacity: isMfaPending || isLocked ? 0.7 : 1,
          }}
        >
          {isMfaPending ? "Verifying..." : "Unlock Treasury"}
        </button>
      </form>
    );
  }

  // Password step (step 1)
  return (
    <form action={passwordAction} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
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
          disabled={isPasswordPending || isLocked}
          required
          placeholder="Enter your password"
          style={{
            width: "100%",
            padding: "10px 14px",
            fontSize: "15px",
            lineHeight: "1.5",
            color: "var(--color-text-primary)",
            backgroundColor: "var(--color-off-white)",
            border: `1.5px solid ${passwordState.error ? "#d93025" : "var(--color-warm-gray-200)"}`,
            borderRadius: "8px",
            outline: "none",
            transition: "border-color 0.15s ease",
            boxSizing: "border-box",
          }}
          onFocus={(e) => {
            if (!passwordState.error) {
              e.currentTarget.style.borderColor = "#02AAEB";
            }
          }}
          onBlur={(e) => {
            if (!passwordState.error) {
              e.currentTarget.style.borderColor = "var(--color-warm-gray-200)";
            }
          }}
        />

        {passwordState.error && (
          <p
            role="alert"
            style={{
              margin: 0,
              fontSize: "13px",
              color: "#d93025",
              lineHeight: "1.4",
            }}
          >
            {passwordState.error}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPasswordPending || isLocked}
        style={{
          width: "100%",
          padding: "11px 20px",
          fontSize: "15px",
          fontWeight: 600,
          letterSpacing: "0.01em",
          color: "#ffffff",
          background: isPasswordPending || isLocked
            ? "var(--color-warm-gray-200)"
            : "linear-gradient(135deg, #02AAEB, #1B77BE)",
          border: "none",
          borderRadius: "8px",
          cursor: isPasswordPending || isLocked ? "not-allowed" : "pointer",
          transition: "opacity 0.15s ease",
          opacity: isPasswordPending || isLocked ? 0.7 : 1,
        }}
      >
        {isPasswordPending ? "Verifying..." : "Unlock Treasury"}
      </button>
    </form>
  );
}
