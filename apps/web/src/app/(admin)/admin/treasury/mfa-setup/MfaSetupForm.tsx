"use client";

import { useActionState, useEffect, useState } from "react";
import { ShieldCheck, Copy, CheckCircle } from "@phosphor-icons/react";
import { verifySetupCode, type MfaVerifyState } from "./actions";

interface MfaSetupFormProps {
  enrollment: {
    factorId: string;
    qrCode: string;
    secret: string;
  } | null;
  enrollError: string | null;
}

const initialVerifyState: MfaVerifyState = { error: null, lockedUntil: null };

export function MfaSetupForm({ enrollment, enrollError }: MfaSetupFormProps) {
  const [copied, setCopied] = useState(false);

  const [verifyState, verifyAction, isVerifying] = useActionState(
    verifySetupCode,
    initialVerifyState,
  );

  // Lock state for MFA verify rate limiting
  const [now, setNow] = useState(() => Date.now());
  const isLocked =
    verifyState.lockedUntil != null && verifyState.lockedUntil > now;

  useEffect(() => {
    if (!isLocked) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [isLocked]);

  const handleCopySecret = async () => {
    if (!enrollment?.secret) return;
    try {
      await navigator.clipboard.writeText(enrollment.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may not be available
    }
  };

  // Enrollment error (passed from server component)
  if (enrollError || !enrollment) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
          padding: "20px 0",
        }}
      >
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "14px",
            background: "linear-gradient(135deg, #02AAEB22, #1B77BE22)",
            border: "1.5px solid #02AAEB44",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <ShieldCheck size={28} weight="duotone" color="#1B77BE" />
        </div>
        <p
          role="alert"
          style={{
            margin: 0,
            fontSize: "14px",
            color: "#d93025",
            lineHeight: "1.5",
            textAlign: "center",
          }}
        >
          {enrollError ?? "Failed to set up MFA. Please try again."}
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            padding: "10px 24px",
            fontSize: "14px",
            fontWeight: 600,
            color: "#1B77BE",
            backgroundColor: "transparent",
            border: "1.5px solid #1B77BE",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: "24px" }}
    >
      {/* Icon + heading */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "14px",
            background: "linear-gradient(135deg, #02AAEB22, #1B77BE22)",
            border: "1.5px solid #02AAEB44",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <ShieldCheck size={28} weight="duotone" color="#1B77BE" />
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "6px" }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: "20px",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "var(--color-text-primary)",
              lineHeight: "1.2",
            }}
          >
            Set Up MFA
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: "14px",
              color: "var(--color-warm-gray-400)",
              lineHeight: "1.5",
            }}
          >
            Plaid requires multi-factor authentication to access Treasury.
            Set up a TOTP app like Google Authenticator or 1Password.
          </p>
        </div>
      </div>

      {/* QR code */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: "13px",
            fontWeight: 500,
            color: "var(--color-text-primary)",
            letterSpacing: "0.01em",
          }}
        >
          Scan this QR code with your authenticator app
        </p>
        <div
          style={{
            padding: "12px",
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            border: "1.5px solid var(--color-warm-gray-200)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={enrollment.qrCode}
            alt="MFA QR code"
            width={180}
            height={180}
            style={{ display: "block" }}
          />
        </div>
      </div>

      {/* Manual secret */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: "13px",
            fontWeight: 500,
            color: "var(--color-text-primary)",
            letterSpacing: "0.01em",
          }}
        >
          Or enter this code manually
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 14px",
            backgroundColor: "var(--color-warm-gray-50, #f9f8f6)",
            borderRadius: "8px",
            border: "1.5px solid var(--color-warm-gray-200)",
          }}
        >
          <code
            style={{
              flex: 1,
              fontSize: "13px",
              fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
              color: "var(--color-text-primary)",
              letterSpacing: "0.05em",
              wordBreak: "break-all",
              lineHeight: "1.5",
            }}
          >
            {enrollment.secret}
          </code>
          <button
            type="button"
            onClick={handleCopySecret}
            title="Copy to clipboard"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "32px",
              height: "32px",
              padding: 0,
              backgroundColor: "transparent",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              flexShrink: 0,
              color: copied ? "#16a34a" : "#1B77BE",
            }}
          >
            {copied ? (
              <CheckCircle size={18} weight="duotone" />
            ) : (
              <Copy size={18} weight="duotone" />
            )}
          </button>
        </div>
      </div>

      {/* Verify code form */}
      <form
        action={verifyAction}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <input type="hidden" name="factorId" value={enrollment.factorId} />

        <div
          style={{ display: "flex", flexDirection: "column", gap: "6px" }}
        >
          <label
            htmlFor="mfa-setup-code"
            style={{
              fontSize: "13px",
              fontWeight: 500,
              color: "var(--color-text-primary)",
              letterSpacing: "0.01em",
            }}
          >
            Verification code
          </label>
          <input
            id="mfa-setup-code"
            name="code"
            type="text"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            autoComplete="one-time-code"
            autoFocus
            disabled={isVerifying || isLocked}
            required
            placeholder="000000"
            style={{
              width: "100%",
              padding: "10px 14px",
              fontSize: "15px",
              lineHeight: "1.5",
              color: "var(--color-text-primary)",
              backgroundColor: "var(--color-off-white)",
              border: `1.5px solid ${verifyState.error ? "#d93025" : "var(--color-warm-gray-200)"}`,
              borderRadius: "8px",
              outline: "none",
              transition: "border-color 0.15s ease",
              boxSizing: "border-box",
              letterSpacing: "0.15em",
              fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
              textAlign: "center",
            }}
            onFocus={(e) => {
              if (!verifyState.error) {
                e.currentTarget.style.borderColor = "#02AAEB";
              }
            }}
            onBlur={(e) => {
              if (!verifyState.error) {
                e.currentTarget.style.borderColor =
                  "var(--color-warm-gray-200)";
              }
            }}
          />

          {verifyState.error && (
            <p
              role="alert"
              style={{
                margin: 0,
                fontSize: "13px",
                color: "#d93025",
                lineHeight: "1.4",
              }}
            >
              {verifyState.error}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isVerifying || isLocked}
          style={{
            width: "100%",
            padding: "11px 20px",
            fontSize: "15px",
            fontWeight: 600,
            letterSpacing: "0.01em",
            color: "#ffffff",
            background:
              isVerifying || isLocked
                ? "var(--color-warm-gray-200)"
                : "linear-gradient(135deg, #02AAEB, #1B77BE)",
            border: "none",
            borderRadius: "8px",
            cursor:
              isVerifying || isLocked ? "not-allowed" : "pointer",
            transition: "opacity 0.15s ease",
            opacity: isVerifying || isLocked ? 0.7 : 1,
          }}
        >
          {isVerifying ? "Verifying..." : "Verify and Enable"}
        </button>
      </form>
    </div>
  );
}
