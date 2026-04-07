"use client";

import { useTransition } from "react";
import { signOut } from "./actions";

export function SignOutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => signOut())}
      className="rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60"
      style={{
        color: "var(--color-text-primary)",
        borderColor: "var(--color-warm-gray-200)",
        backgroundColor: "var(--color-white)",
      }}
    >
      {pending ? "Signing out..." : "Sign out"}
    </button>
  );
}
