"use client";

import { useState, useActionState, useEffect } from "react";
import { PasswordField } from "@/components/auth/PasswordField";
import { useTypewriterPlaceholder, usePasswordPlaceholder } from "@/components/auth/useTypewriterPlaceholder";
import { login, type LoginState } from "./actions";

const initialState: LoginState = {};

const fieldInputStyle: React.CSSProperties = {
  width: "100%",
  border: "1.5px solid #dce8f0",
  borderRadius: "10px",
  padding: "11px 14px",
  fontSize: "14px",
  fontFamily: "inherit",
  color: "#1a1a1a",
  background: "#f7fbfd",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  color: "#6b7280",
};

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const [state, formAction, pending] = useActionState(login, initialState);
  const { emailPlaceholder, onFocus, onBlur } = useTypewriterPlaceholder();
  const { passwordPlaceholder, onPasswordFocus, onPasswordBlur } = usePasswordPlaceholder();
  const [role, setRole] = useState<"owner" | "admin">("owner");

  useEffect(() => {
    document.body.classList.toggle("auth-admin-mode", role === "admin");
    return () => document.body.classList.remove("auth-admin-mode");
  }, [role]);

  // Only allow role switching when no specific redirect was requested.
  // If the user was sent here from a protected page (/portal/settings, etc.), honor that.
  const isDefaultRedirect = redirectTo === "/portal/dashboard";
  const effectiveRedirect = isDefaultRedirect && role === "admin" ? "/admin" : redirectTo;

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <input type="hidden" name="redirect" value={effectiveRedirect} />

      {/* Role selector — only shown when using the default redirect */}
      {isDefaultRedirect && (
        <div style={{ marginBottom: "20px" }}>
          <div style={{ marginBottom: "6px" }}>
            <span style={labelStyle}>Signing in as</span>
          </div>
          <div
            style={{
              display: "flex",
              background: "#f0f4f8",
              borderRadius: "10px",
              padding: "3px",
              gap: "3px",
            }}
          >
            {(["owner", "admin"] as const).map((r) => {
              const isActive = role === r;
              const isAdmin = r === "admin";
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  style={{
                    flex: 1,
                    padding: "6px 14px",
                    borderRadius: "7px",
                    fontSize: "12.5px",
                    fontWeight: isActive ? 600 : 400,
                    background: isActive
                      ? isAdmin
                        ? "linear-gradient(135deg, #02aaeb 0%, #1b77be 60%, #155fa0 100%)"
                        : "#ffffff"
                      : "transparent",
                    color: isActive ? (isAdmin ? "#ffffff" : "#1a1a1a") : "#6b7280",
                    border: "none",
                    cursor: "pointer",
                    boxShadow: isActive
                      ? isAdmin
                        ? "0 2px 10px rgba(27,119,190,0.45)"
                        : "0 1px 3px rgba(0,0,0,0.08)"
                      : "none",
                    transition: "background 0.22s ease, color 0.22s ease, box-shadow 0.22s ease",
                    fontFamily: "inherit",
                  }}
                >
                  {r === "owner" ? "Owner" : "Admin"}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ marginBottom: "14px" }}>
        <div style={{ marginBottom: "6px" }}>
          <label htmlFor="email" style={labelStyle}>
            Email
          </label>
        </div>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder={emailPlaceholder}
          style={fieldInputStyle}
          onFocus={(e) => {
            onFocus();
            e.target.style.borderColor = "var(--color-brand)";
            e.target.style.background = "#ffffff";
          }}
          onBlur={(e) => {
            onBlur();
            e.target.style.borderColor = "#dce8f0";
            e.target.style.background = "#f7fbfd";
          }}
        />
      </div>

      <div style={{ marginBottom: "14px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: "6px",
          }}
        >
          <label htmlFor="password" style={labelStyle}>
            Password
          </label>
          <a
            href="/forgot-password"
            style={{
              fontSize: "12px",
              color: "var(--color-brand)",
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            Forgot password?
          </a>
        </div>
        <PasswordField
          id="password"
          name="password"
          autoComplete="current-password"
          required
          placeholder={passwordPlaceholder}
          onFocus={onPasswordFocus}
          onBlur={onPasswordBlur}
        />
      </div>

      {state.error ? (
        <p
          style={{ fontSize: "13px", color: "var(--color-error)", marginBottom: "8px" }}
          role="alert"
        >
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        style={{
          width: "100%",
          background:
            "linear-gradient(135deg, #02aaeb 0%, #1b77be 60%, #155fa0 100%)",
          color: "white",
          border: "none",
          borderRadius: "10px",
          padding: "13px",
          fontSize: "14.5px",
          fontWeight: 600,
          fontFamily: "inherit",
          cursor: pending ? "not-allowed" : "pointer",
          marginTop: "18px",
          letterSpacing: "-0.01em",
          boxShadow: "0 4px 16px rgba(27,119,190,0.28)",
          opacity: pending ? 0.65 : 1,
          transition: "opacity 0.15s ease",
        }}
      >
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
