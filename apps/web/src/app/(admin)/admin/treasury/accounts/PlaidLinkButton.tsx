"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Bank, CircleNotch } from "@phosphor-icons/react";

declare global {
  interface Window {
    Plaid?: { create: (config: PlaidLinkConfig) => PlaidLinkHandler };
  }
}

interface PlaidLinkConfig {
  token: string;
  onSuccess: (public_token: string, metadata: PlaidMetadata) => void;
  onExit: (err: PlaidError | null) => void;
  onLoad?: () => void;
}

interface PlaidLinkHandler {
  open: () => void;
  destroy: () => void;
}

interface PlaidMetadata {
  institution?: { institution_id: string; name: string } | null;
  accounts?: Array<{ id: string; name: string; type: string; subtype: string }>;
  link_session_id?: string;
}

interface PlaidError {
  error_code?: string;
  error_message?: string;
  display_message?: string;
}

const PLAID_LINK_JS = "https://cdn.plaid.com/link/v2/stable/link-initialize.js";

function loadPlaidScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Plaid) {
      resolve();
      return;
    }

    const existing = document.querySelector(`script[src="${PLAID_LINK_JS}"]`);
    if (existing) {
      // Script tag exists but Plaid may not be ready yet; poll briefly
      let attempts = 0;
      const poll = setInterval(() => {
        attempts++;
        if (window.Plaid) {
          clearInterval(poll);
          resolve();
        } else if (attempts > 40) {
          clearInterval(poll);
          reject(new Error("Plaid Link script loaded but window.Plaid is unavailable"));
        }
      }, 100);
      return;
    }

    const script = document.createElement("script");
    script.src = PLAID_LINK_JS;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Plaid Link script"));
    document.body.appendChild(script);
  });
}

export default function PlaidLinkButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      // Fetch link token from server
      const tokenRes = await fetch("/api/treasury/create-link-token", {
        method: "POST",
      });

      if (!tokenRes.ok) {
        const body = await tokenRes.json().catch(() => ({}));
        throw new Error(body?.error ?? "Failed to initialize bank connection");
      }

      const { link_token } = await tokenRes.json();

      if (!link_token) {
        throw new Error("No link token returned from server");
      }

      // Load Plaid SDK
      await loadPlaidScript();

      if (!window.Plaid) {
        throw new Error("Plaid Link is not available");
      }

      const handler = window.Plaid.create({
        token: link_token,
        onSuccess: async (public_token, metadata) => {
          try {
            const exchangeRes = await fetch("/api/treasury/exchange-token", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                public_token,
                institution_name: metadata.institution?.name ?? null,
                institution_id: metadata.institution?.institution_id ?? null,
              }),
            });

            if (!exchangeRes.ok) {
              const body = await exchangeRes.json().catch(() => ({}));
              throw new Error(body?.error ?? "Failed to link bank account");
            }

            router.refresh();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Bank link failed");
          } finally {
            setLoading(false);
            handler.destroy();
          }
        },
        onExit: (err) => {
          setLoading(false);
          handler.destroy();
          if (err?.error_code) {
            setError(err.display_message ?? err.error_message ?? "Connection cancelled");
          }
        },
        onLoad: () => {
          setLoading(false);
        },
      });

      handler.open();
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }, [router]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
      <button
        onClick={handleConnect}
        disabled={loading}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "12px 28px",
          borderRadius: "10px",
          background: loading
            ? "rgba(2,170,235,0.5)"
            : "linear-gradient(135deg, #02AAEB, #1B77BE)",
          color: "#fff",
          fontSize: "14px",
          fontWeight: 600,
          letterSpacing: "-0.01em",
          border: "none",
          cursor: loading ? "not-allowed" : "pointer",
          boxShadow: loading ? "none" : "0 4px 14px rgba(2,170,235,0.35)",
          transition: "opacity 0.15s ease, box-shadow 0.15s ease",
          outline: "none",
        }}
      >
        {loading ? (
          <>
            <CircleNotch
              size={16}
              weight="bold"
              style={{ animation: "spin 0.8s linear infinite" }}
            />
            Connecting...
          </>
        ) : (
          <>
            <Bank size={16} weight="bold" />
            Connect Bank Account
          </>
        )}
      </button>

      {error && (
        <p
          style={{
            margin: 0,
            fontSize: "13px",
            color: "#dc2626",
            textAlign: "center",
            maxWidth: "320px",
          }}
        >
          {error}
        </p>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
