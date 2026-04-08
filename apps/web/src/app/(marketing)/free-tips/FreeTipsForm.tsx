"use client";

import { useActionState } from "react";
import { submitFreeTips, type FreeTipsState } from "./actions";

const initial: FreeTipsState = {};

export function FreeTipsForm() {
  const [state, formAction, pending] = useActionState(
    submitFreeTips,
    initial,
  );

  if (state.success) {
    return (
      <div
        className="rounded-2xl border p-6 text-sm"
        style={{
          backgroundColor: "var(--color-white)",
          borderColor: "var(--color-warm-gray-200)",
        }}
      >
        <p
          className="text-base font-semibold"
          style={{ color: "var(--color-text-primary)" }}
        >
          You are in. Check your inbox.
        </p>
        <p
          className="mt-2"
          style={{ color: "var(--color-text-secondary)" }}
        >
          The first tip hits your inbox this week. We send one short email
          every Tuesday morning.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {/* Honeypot — hidden from users, irresistible to bots */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="absolute -left-[10000px] h-0 w-0 opacity-0"
        aria-hidden="true"
      />
      <div className="flex flex-col gap-2">
        <label
          htmlFor="firstName"
          className="text-[11px] font-semibold uppercase tracking-[0.14em]"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          First name (optional)
        </label>
        <input
          id="firstName"
          name="firstName"
          type="text"
          autoComplete="given-name"
          className="rounded-lg border border-[var(--color-warm-gray-200)] bg-white px-4 py-3 text-base outline-none transition-colors focus:border-[var(--color-brand)]"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="email"
          className="text-[11px] font-semibold uppercase tracking-[0.14em]"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="rounded-lg border border-[var(--color-warm-gray-200)] bg-white px-4 py-3 text-base outline-none transition-colors focus:border-[var(--color-brand)]"
        />
      </div>

      {state.error ? (
        <p
          className="text-sm"
          style={{ color: "var(--color-error)" }}
          role="alert"
        >
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-lg px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        style={{ backgroundColor: "var(--color-brand)" }}
      >
        {pending ? "Subscribing..." : "Send me the free tips"}
      </button>

      <p
        className="text-center text-xs"
        style={{ color: "var(--color-text-tertiary)" }}
      >
        One email per week. Unsubscribe any time.
      </p>
    </form>
  );
}
