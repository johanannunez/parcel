"use client";

import { useState, useTransition } from "react";
import { CheckCircle } from "@phosphor-icons/react";
import { submitSupportTicket } from "@/lib/admin/support";

type Priority = "low" | "normal" | "urgent";

export function SupportFormPanel({ onClose }: { onClose: () => void }) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<Priority>("normal");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await submitSupportTicket({ subject, message, priority });
      if (!result.ok) {
        setError(result.error ?? "Failed to submit ticket.");
        return;
      }
      setSubmitted(true);
    });
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "9px 12px",
    borderRadius: "9px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    fontSize: "13px",
    color: "#E0EDF8",
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
    transition: "border-color 120ms ease",
  };

  if (submitted) {
    return (
      <div
        style={{
          padding: "48px 24px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "12px",
          textAlign: "center",
        }}
      >
        <CheckCircle size={36} weight="duotone" style={{ color: "#10b981" }} />
        <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#E0EDF8" }}>
          Ticket submitted
        </p>
        <p style={{ margin: 0, fontSize: "12.5px", color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>
          We got your message and will follow up shortly.
        </p>
        <button
          type="button"
          onClick={onClose}
          style={{
            marginTop: "8px",
            padding: "8px 20px",
            borderRadius: "9px",
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(255,255,255,0.07)",
            color: "rgba(255,255,255,0.60)",
            fontSize: "12.5px",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ padding: "16px 20px 20px", display: "flex", flexDirection: "column", gap: "12px" }}
    >
      <input
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder="Subject"
        required
        style={inputStyle}
        onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(2,170,235,0.50)"; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}
      />

      <div style={{ display: "flex", gap: "6px" }}>
        {(["low", "normal", "urgent"] as Priority[]).map((p) => {
          const colors: Record<Priority, { active: string; label: string }> = {
            low: { active: "rgba(16,185,129,0.20)", label: "Low" },
            normal: { active: "rgba(2,170,235,0.20)", label: "Normal" },
            urgent: { active: "rgba(239,68,68,0.20)", label: "Urgent" },
          };
          const isActive = priority === p;
          return (
            <button
              key={p}
              type="button"
              onClick={() => setPriority(p)}
              style={{
                flex: 1,
                padding: "7px 0",
                borderRadius: "8px",
                border: `1px solid ${isActive ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.08)"}`,
                background: isActive ? colors[p].active : "rgba(255,255,255,0.04)",
                color: isActive ? "#E0EDF8" : "rgba(255,255,255,0.35)",
                fontSize: "12px",
                fontWeight: isActive ? 600 : 400,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 120ms ease",
              }}
            >
              {colors[p].label}
            </button>
          );
        })}
      </div>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Describe the issue or question…"
        required
        rows={5}
        style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
        onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(2,170,235,0.50)"; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}
      />

      {error && (
        <p style={{ margin: 0, fontSize: "12px", color: "#f87171" }}>{error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        style={{
          padding: "10px 0",
          borderRadius: "10px",
          border: "none",
          background: "linear-gradient(135deg, rgba(245,158,11,0.90), rgba(234,88,12,0.90))",
          color: "#fff",
          fontSize: "13px",
          fontWeight: 600,
          cursor: pending ? "wait" : "pointer",
          opacity: pending ? 0.6 : 1,
          fontFamily: "inherit",
          boxShadow: "0 2px 10px rgba(245,158,11,0.25)",
          transition: "opacity 120ms ease",
        }}
      >
        {pending ? "Sending…" : "Send ticket"}
      </button>
    </form>
  );
}
