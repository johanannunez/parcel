"use client";

import { useTransition } from "react";
import { ArrowLeft, Eye } from "@phosphor-icons/react";
import { clearViewingAs } from "@/app/(portal)/portal/viewing-as-actions";

export function ImpersonationBanner({ ownerName }: { ownerName: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div
      className="flex shrink-0 items-center justify-between gap-4 px-4 py-2.5 sm:px-6 lg:px-10"
      style={{
        backgroundColor: "rgba(245, 158, 11, 0.10)",
        borderBottom: "1px solid rgba(245, 158, 11, 0.28)",
      }}
    >
      <div
        className="flex items-center gap-2 text-xs font-medium"
        style={{ color: "#92400e" }}
      >
        <Eye size={13} weight="duotone" style={{ color: "#d97706" }} />
        Viewing{" "}
        <span className="font-semibold">{ownerName}</span>
        &apos;s portal
      </div>
      <button
        type="button"
        onClick={() => startTransition(() => clearViewingAs())}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 text-xs font-semibold transition-opacity hover:opacity-70 disabled:opacity-40"
        style={{ color: "#92400e" }}
      >
        <ArrowLeft size={11} weight="bold" />
        Return to your view
      </button>
    </div>
  );
}
