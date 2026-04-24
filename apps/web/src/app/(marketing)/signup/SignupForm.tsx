"use client";

import { useState, useActionState } from "react";
import { PasswordField } from "@/components/auth/PasswordField";
import { useTypewriterPlaceholder } from "@/components/auth/useTypewriterPlaceholder";
import { signup, type SignupState } from "./actions";

const initialState: SignupState = {};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "11px",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  color: "#6b7280",
  marginBottom: "6px",
};

const REQUIREMENTS = [
  {
    key: "length",
    label: "At least 8 characters",
    check: (p: string) => p.length >= 8,
  },
  {
    key: "number",
    label: "Contains a number",
    check: (p: string) => /\d/.test(p),
  },
];

function fieldStyle(focused: boolean, error: boolean): React.CSSProperties {
  return {
    width: "100%",
    border: `1.5px solid ${error ? "#ef4444" : focused ? "var(--color-brand)" : "#dce8f0"}`,
    borderRadius: "10px",
    padding: "11px 14px",
    fontSize: "14px",
    fontFamily: "inherit",
    color: "#1a1a1a",
    background: error ? "#fff5f5" : focused ? "#ffffff" : "#f7fbfd",
    outline: "none",
    transition: "border-color 0.15s ease, background 0.15s ease",
  };
}

function FieldError({ message }: { message: string }) {
  return (
    <span
      style={{
        fontSize: "11.5px",
        color: "#ef4444",
        marginTop: "5px",
        display: "block",
        fontWeight: 500,
      }}
    >
      {message}
    </span>
  );
}

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signup, initialState);

  const { namePlaceholder, emailPlaceholder, onFocus: twFocus, onBlur: twBlur } = useTypewriterPlaceholder();
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [password, setPassword] = useState("");

  const showRequirements = password.length > 0;

  const validateEmail = (value: string) => {
    if (!value) {
      setEmailError("Email is required.");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setEmailError("Please enter a valid email address.");
    }
  };

  return (
    <form action={formAction} noValidate style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <div style={{ marginBottom: "14px" }}>
        <label htmlFor="full_name" style={labelStyle}>
          Full name
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          autoComplete="name"
          placeholder={namePlaceholder}
          style={fieldStyle(nameFocused, false)}
          onFocus={() => { twFocus(); setNameFocused(true); }}
          onBlur={() => { twBlur(); setNameFocused(false); }}
        />
      </div>

      <div style={{ marginBottom: "14px" }}>
        <label htmlFor="email" style={labelStyle}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder={emailPlaceholder}
          style={fieldStyle(emailFocused, !!emailError)}
          onFocus={() => { twFocus(); setEmailFocused(true); }}
          onBlur={(e) => {
            twBlur();
            setEmailFocused(false);
            if (e.target.value) validateEmail(e.target.value);
          }}
          onChange={() => {
            if (emailError) setEmailError("");
          }}
          onInvalid={(e) => {
            e.preventDefault();
            const el = e.currentTarget;
            if (el.validity.valueMissing) {
              setEmailError("Email is required.");
            } else {
              setEmailError("Please enter a valid email address.");
            }
          }}
        />
        {emailError && <FieldError message={emailError} />}
      </div>

      <div style={{ marginBottom: "14px" }}>
        <label htmlFor="password" style={labelStyle}>
          Password
        </label>
        <PasswordField
          id="password"
          name="password"
          autoComplete="new-password"
          required
          minLength={8}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div
          style={{
            overflow: "hidden",
            maxHeight: showRequirements ? "80px" : "0px",
            opacity: showRequirements ? 1 : 0,
            marginTop: showRequirements ? "8px" : "0px",
            transition:
              "max-height 0.28s ease, opacity 0.22s ease, margin-top 0.28s ease",
          }}
        >
          <div
            style={{
              background: "rgba(27,119,190,0.04)",
              border: "1px solid rgba(27,119,190,0.10)",
              borderRadius: "9px",
              padding: "9px 11px",
              display: "flex",
              flexDirection: "column",
              gap: "5px",
            }}
          >
            {REQUIREMENTS.map((req) => {
              const met = req.check(password);
              return (
                <div key={req.key} style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                  <div
                    style={{
                      width: "15px",
                      height: "15px",
                      borderRadius: "50%",
                      border: `1.5px solid ${met ? "#02aaeb" : "#d1d5db"}`,
                      background: met ? "rgba(2,170,235,0.1)" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.2s ease",
                      flexShrink: 0,
                    }}
                  >
                    {met && (
                      <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                        <path
                          d="M1 3L3 5L7 1"
                          stroke="#02aaeb"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: "11.5px",
                      color: met ? "#1b77be" : "#9ca3af",
                      fontWeight: met ? 500 : 400,
                      transition: "color 0.2s ease",
                    }}
                  >
                    {req.label}
                    {req.key === "length" && !met && password.length > 0
                      ? ` (${password.length}/8)`
                      : ""}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {state.error ? (
        <div
          role="alert"
          style={{
            background: "rgba(239,68,68,0.06)",
            border: "1px solid rgba(239,68,68,0.18)",
            borderRadius: "9px",
            padding: "9px 12px",
            marginBottom: "10px",
            display: "flex",
            alignItems: "flex-start",
            gap: "8px",
          }}
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{ flexShrink: 0, marginTop: "1px" }}>
            <circle cx="7.5" cy="7.5" r="6.5" stroke="#ef4444" strokeWidth="1.5" />
            <path d="M7.5 4.5V8" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="7.5" cy="10.5" r="0.75" fill="#ef4444" />
          </svg>
          <p style={{ fontSize: "12.5px", color: "#dc2626", margin: 0, lineHeight: 1.5 }}>
            {state.error}
          </p>
        </div>
      ) : null}

      {state.message ? (
        <div
          role="status"
          style={{
            background: "rgba(2,170,235,0.06)",
            border: "1px solid rgba(2,170,235,0.18)",
            borderRadius: "9px",
            padding: "9px 12px",
            marginBottom: "10px",
          }}
        >
          <p style={{ fontSize: "12.5px", color: "#1b77be", margin: 0 }}>
            {state.message}
          </p>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        style={{
          width: "100%",
          background: "linear-gradient(135deg, #02aaeb 0%, #1b77be 60%, #155fa0 100%)",
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
        {pending ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
}
