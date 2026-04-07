"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

const initialState: LoginState = {};

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="redirect" value={redirectTo} />

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
          className="rounded-lg border border-[var(--color-warm-gray-200)] bg-white px-4 py-3 text-base outline-none transition-colors focus:border-[var(--color-brand)]"
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
          autoComplete="current-password"
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
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
