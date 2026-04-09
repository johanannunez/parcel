"use client";

import { useActionState } from "react";
import {
  requestPasswordReset,
  type ForgotPasswordState,
} from "./actions";

const initialState: ForgotPasswordState = {};

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(
    requestPasswordReset,
    initialState,
  );

  if (state.success) {
    return (
      <div
        className="rounded-xl border p-5 text-sm"
        style={{
          borderColor: "var(--color-warm-gray-200)",
          backgroundColor: "var(--color-white)",
          color: "var(--color-text-secondary)",
        }}
      >
        <p
          className="mb-2 font-semibold"
          style={{ color: "var(--color-text-primary)" }}
        >
          Check your inbox.
        </p>
        <p>
          If an account exists for that email, you will receive a link to
          reset your password shortly. The link expires in one hour.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label
          htmlFor="email"
          className="text-xs font-medium uppercase tracking-wider"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="rounded-lg border border-[var(--color-warm-gray-200)] bg-[var(--color-white)] px-4 py-3 text-base outline-none transition-colors focus:border-[var(--color-brand)]"
          style={{ color: "var(--color-text-primary)" }}
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
        className="mt-2 rounded-lg px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        style={{ backgroundColor: "var(--color-brand)" }}
      >
        {pending ? "Sending link..." : "Email me a reset link"}
      </button>
    </form>
  );
}
