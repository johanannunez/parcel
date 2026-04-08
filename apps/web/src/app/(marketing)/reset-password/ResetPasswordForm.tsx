"use client";

import { useActionState } from "react";
import { updatePassword, type ResetPasswordState } from "./actions";

const initialState: ResetPasswordState = {};

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(
    updatePassword,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label
          htmlFor="password"
          className="text-xs font-medium uppercase tracking-wider"
          style={{ color: "var(--color-text-secondary)" }}
        >
          New password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className="rounded-lg border border-[var(--color-warm-gray-200)] bg-white px-4 py-3 text-base outline-none transition-colors focus:border-[var(--color-brand)]"
          style={{ color: "var(--color-text-primary)" }}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="confirm"
          className="text-xs font-medium uppercase tracking-wider"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Confirm new password
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className="rounded-lg border border-[var(--color-warm-gray-200)] bg-white px-4 py-3 text-base outline-none transition-colors focus:border-[var(--color-brand)]"
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
        {pending ? "Updating..." : "Update password"}
      </button>
    </form>
  );
}
