"use client";

import { useState, useTransition } from "react";
import { X, CheckCircle } from "@phosphor-icons/react";
import { connectProvider, disconnectProvider } from "./actions";

export type ConnectionState = {
  provider: string;
  label: string;
  description: string;
  brand: string;
  connected: boolean;
  lastSync: string | null;
};

export function ConnectionCard({ c }: { c: ConnectionState }) {
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const onConnect = () =>
    startTransition(async () => {
      await connectProvider(c.provider);
    });

  const onDisconnect = () =>
    startTransition(async () => {
      await disconnectProvider(c.provider);
      setConfirmOpen(false);
    });

  return (
    <>
      <div
        className="flex flex-col gap-5 rounded-2xl border p-6"
        style={{
          backgroundColor: "var(--color-white)",
          borderColor: "var(--color-warm-gray-200)",
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-bold text-white"
              style={{ backgroundColor: c.brand }}
              aria-hidden
            >
              {c.label[0]}
            </span>
            <div>
              <h3
                className="text-base font-semibold tracking-tight"
                style={{ color: "var(--color-text-primary)" }}
              >
                {c.label}
              </h3>
              <p
                className="mt-0.5 text-xs"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {c.description}
              </p>
            </div>
          </div>
          <StatusPill connected={c.connected} />
        </div>

        <div
          className="text-xs"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          {c.connected && c.lastSync
            ? `Last synced ${new Date(c.lastSync).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}`
            : "Not connected"}
        </div>

        <div className="flex items-center gap-2">
          {c.connected ? (
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              disabled={pending}
              className="rounded-lg px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-50"
              style={{
                backgroundColor: "var(--color-white)",
                color: "var(--color-error)",
                border: "1px solid var(--color-warm-gray-200)",
              }}
            >
              Disconnect
            </button>
          ) : (
            <button
              type="button"
              onClick={onConnect}
              disabled={pending}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: "var(--color-brand)" }}
            >
              {pending ? "Connecting..." : "Connect"}
            </button>
          )}
        </div>
      </div>

      {confirmOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(15, 23, 42, 0.36)" }}
          onClick={() => setConfirmOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border p-6 shadow-[0_30px_80px_-20px_rgba(15,23,42,0.35)]"
            style={{
              backgroundColor: "var(--color-white)",
              borderColor: "var(--color-warm-gray-200)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <h4
                className="text-lg font-semibold tracking-tight"
                style={{ color: "var(--color-text-primary)" }}
              >
                Disconnect {c.label}?
              </h4>
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[var(--color-warm-gray-100)]"
                style={{ color: "var(--color-text-secondary)" }}
              >
                <X size={14} weight="bold" />
              </button>
            </div>
            <p
              className="mt-2 text-sm"
              style={{ color: "var(--color-text-secondary)" }}
            >
              We will stop pulling data from {c.label}. Existing records stay.
              You can reconnect any time.
            </p>
            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="rounded-lg px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-80"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onDisconnect}
                disabled={pending}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: "var(--color-error)" }}
              >
                {pending ? "Disconnecting..." : "Yes, disconnect"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function StatusPill({ connected }: { connected: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{
        backgroundColor: connected
          ? "rgba(22, 163, 74, 0.12)"
          : "rgba(118, 113, 112, 0.12)",
        color: connected ? "#15803d" : "#4b4948",
      }}
    >
      {connected ? (
        <CheckCircle size={12} weight="fill" />
      ) : (
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: "#767170" }}
        />
      )}
      {connected ? "Connected" : "Not connected"}
    </span>
  );
}
