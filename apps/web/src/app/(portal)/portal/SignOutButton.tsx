"use client";

import { useTransition } from "react";
import { Power } from "@phosphor-icons/react";
import { signOut } from "./actions";

export function SignOutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => signOut())}
      className="sidebar-footer-row sidebar-footer-signout"
    >
      <Power size={19} weight="duotone" className="shrink-0" />
      {pending ? "Signing out..." : "Sign out"}
    </button>
  );
}
