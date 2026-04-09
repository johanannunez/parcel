"use client";

import { useTransition } from "react";
import { signOut } from "@/app/(portal)/portal/actions";

export function AdminSignOutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => signOut())}
      className="rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60"
      style={{
        color: "rgba(255,255,255,0.7)",
        borderColor: "rgba(255,255,255,0.1)",
        backgroundColor: "rgba(255,255,255,0.04)",
      }}
    >
      {pending ? "Signing out..." : "Sign out"}
    </button>
  );
}
