"use client";

import { useState, useTransition } from "react";
import { CheckCircle, Bug, Lightbulb, Heart, ChatText, type Icon } from "@phosphor-icons/react";
import { submitFeedback } from "@/lib/admin/support";

type FeedbackType = "bug" | "idea" | "compliment" | "other";

const TYPE_OPTIONS: {
  value: FeedbackType;
  label: string;
  icon: Icon;
  color: string;
  bg: string;
}[] = [
  { value: "bug", label: "Bug", icon: Bug, color: "#ef4444", bg: "rgba(239,68,68,0.15)" },
  { value: "idea", label: "Idea", icon: Lightbulb, color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
  { value: "compliment", label: "Thanks", icon: Heart, color: "#ec4899", bg: "rgba(236,72,153,0.15)" },
  { value: "other", label: "Other", icon: ChatText, color: "rgba(255,255,255,0.55)", bg: "rgba(255,255,255,0.08)" },
];

export function FeedbackFormPanel({ onClose }: { onClose: () => void }) {
  const [type, setType] = useState<FeedbackType>("idea");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await submitFeedback({ type, message });
      if (!result.ok) {
        setError(result.error ?? "Failed to submit.");
        return;
      }
      setSubmitted(true);
    });
  }

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
          Thanks for the feedback
        </p>
        <p style={{ margin: 0, fontSize: "12.5px", color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>
          It goes directly into the improvement queue.
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
      style={{ padding: "16px 20px 20px", display: "flex", flexDirection: "column", gap: "14px" }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
        {TYPE_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isActive = type === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setType(opt.value)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "9px 12px",
                borderRadius: "9px",
                border: `1px solid ${isActive ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.08)"}`,
                background: isActive ? opt.bg : "rgba(255,255,255,0.04)",
                color: isActive ? "#E0EDF8" : "rgba(255,255,255,0.35)",
                fontSize: "12.5px",
                fontWeight: isActive ? 600 : 400,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 120ms ease",
                textAlign: "left",
              }}
            >
              <Icon size={15} weight="duotone" style={{ color: isActive ? opt.color : "rgba(255,255,255,0.30)", flexShrink: 0 }} />
              {opt.label}
            </button>
          );
        })}
      </div>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="What's on your mind?"
        required
        rows={5}
        style={{
          width: "100%",
          padding: "9px 12px",
          borderRadius: "9px",
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(255,255,255,0.06)",
          fontSize: "13px",
          color: "#E0EDF8",
          outline: "none",
          fontFamily: "inherit",
          resize: "vertical",
          lineHeight: 1.6,
          boxSizing: "border-box",
          transition: "border-color 120ms ease",
        }}
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
          background: "linear-gradient(135deg, rgba(236,72,153,0.85), rgba(239,68,68,0.85))",
          color: "#fff",
          fontSize: "13px",
          fontWeight: 600,
          cursor: pending ? "wait" : "pointer",
          opacity: pending ? 0.6 : 1,
          fontFamily: "inherit",
          boxShadow: "0 2px 10px rgba(236,72,153,0.20)",
          transition: "opacity 120ms ease",
        }}
      >
        {pending ? "Sending…" : "Send feedback"}
      </button>
    </form>
  );
}
