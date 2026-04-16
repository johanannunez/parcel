"use client";

import { useEffect, useRef, useState } from "react";
import { Warning } from "@phosphor-icons/react";

type ConfirmModalProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open) {
      setVisible(true);
      setAnimating(true);
      dialogRef.current?.showModal();
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimating(false));
      });
    } else if (visible) {
      setAnimating(true);
      const timeout = setTimeout(() => {
        dialogRef.current?.close();
        setVisible(false);
        setAnimating(false);
      }, 180);
      return () => clearTimeout(timeout);
    }
  }, [open, visible]);

  if (!visible) return null;

  const isDanger = variant === "danger";

  return (
    <dialog
      ref={dialogRef}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        margin: 0,
        padding: 0,
        width: "100vw",
        height: "100vh",
        maxWidth: "100vw",
        maxHeight: "100vh",
        border: "none",
        background: "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onCancel}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(15, 10, 5, 0.35)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          opacity: open && !animating ? 1 : 0,
          transition: "opacity 0.18s ease",
        }}
      />

      {/* Card */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "380px",
          margin: "0 20px",
          backgroundColor: "var(--color-white, #fff)",
          borderRadius: "18px",
          border: "1px solid rgba(0, 0, 0, 0.06)",
          boxShadow:
            "0 24px 80px rgba(0, 0, 0, 0.12), 0 8px 24px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0, 0, 0, 0.03)",
          padding: "28px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          opacity: open && !animating ? 1 : 0,
          transform: open && !animating ? "scale(1) translateY(0)" : "scale(0.96) translateY(6px)",
          transition: "opacity 0.2s ease, transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Icon + text */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {isDanger && (
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "11px",
                backgroundColor: "rgba(220, 38, 38, 0.07)",
                border: "1px solid rgba(220, 38, 38, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Warning size={20} weight="fill" color="#dc2626" />
            </div>
          )}
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: "16px",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: "var(--color-text-primary, #1a1a1a)",
                lineHeight: 1.3,
              }}
            >
              {title}
            </h3>
            <p
              style={{
                margin: "6px 0 0",
                fontSize: "13px",
                lineHeight: 1.55,
                color: "var(--color-text-secondary, #666)",
              }}
            >
              {description}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            style={{
              padding: "9px 18px",
              borderRadius: "10px",
              border: "1.5px solid var(--color-warm-gray-200, #e5e5e5)",
              backgroundColor: "var(--color-white, #fff)",
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--color-text-secondary, #666)",
              cursor: "pointer",
              transition: "background-color 0.12s ease, border-color 0.12s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--color-warm-gray-50, #fafafa)";
              e.currentTarget.style.borderColor = "var(--color-warm-gray-300, #d4d4d4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "var(--color-white, #fff)";
              e.currentTarget.style.borderColor = "var(--color-warm-gray-200, #e5e5e5)";
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: "9px 18px",
              borderRadius: "10px",
              border: "none",
              background: isDanger
                ? "linear-gradient(135deg, #dc2626, #b91c1c)"
                : "linear-gradient(135deg, #02AAEB, #1B77BE)",
              fontSize: "13px",
              fontWeight: 600,
              color: "#fff",
              cursor: "pointer",
              boxShadow: isDanger
                ? "0 2px 8px rgba(220, 38, 38, 0.25)"
                : "0 2px 8px rgba(2, 170, 235, 0.25)",
              transition: "opacity 0.12s ease, box-shadow 0.12s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "0.9";
              e.currentTarget.style.boxShadow = isDanger
                ? "0 4px 14px rgba(220, 38, 38, 0.35)"
                : "0 4px 14px rgba(2, 170, 235, 0.35)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
              e.currentTarget.style.boxShadow = isDanger
                ? "0 2px 8px rgba(220, 38, 38, 0.25)"
                : "0 2px 8px rgba(2, 170, 235, 0.25)";
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
