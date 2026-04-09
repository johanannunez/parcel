"use client";

import { useActionState } from "react";
import { signup, type SignupState } from "./actions";

const initialState: SignupState = {};

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signup, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label
          htmlFor="full_name"
          className="text-xs font-medium uppercase tracking-wider"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Full name
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          autoComplete="name"
          className="rounded-lg border border-[var(--color-warm-gray-200)] bg-[var(--color-white)] px-4 py-3 text-base outline-none transition-colors focus:border-[var(--color-brand)]"
          style={{ color: "var(--color-text-primary)" }}
        />
      </div>

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

      <div className="flex flex-col gap-2">
        <label
          htmlFor="password"
          className="text-xs font-medium uppercase tracking-wider"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="rounded-lg border border-[var(--color-warm-gray-200)] bg-[var(--color-white)] px-4 py-3 text-base outline-none transition-colors focus:border-[var(--color-brand)]"
          style={{ color: "var(--color-text-primary)" }}
        />
        <span
          className="text-xs"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          At least 8 characters.
        </span>
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

      {state.message ? (
        <p
          className="text-sm"
          style={{ color: "var(--color-success)" }}
          role="status"
        >
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-lg px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        style={{ backgroundColor: "var(--color-brand)" }}
      >
        {pending ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
}
