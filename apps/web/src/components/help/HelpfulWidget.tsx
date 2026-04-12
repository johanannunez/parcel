"use client";

import { useCallback, useState } from "react";
import { ThumbsUp, ThumbsDown } from "@phosphor-icons/react";

type VoteState = "idle" | "submitting" | "voted";

export function HelpfulWidget({ articleId }: { articleId: string }) {
  const [state, setState] = useState<VoteState>("idle");
  const [choice, setChoice] = useState<boolean | null>(null);

  const vote = useCallback(
    async (helpful: boolean) => {
      if (state !== "idle") return;
      setChoice(helpful);
      setState("submitting");
      try {
        await fetch("/api/help/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ articleId, helpful }),
        });
      } catch {
        /* best-effort, no error shown */
      }
      setState("voted");
    },
    [articleId, state]
  );

  if (state === "voted") {
    return (
      <div
        className="flex items-center justify-center gap-2 rounded-xl border px-5 py-4 text-sm font-medium"
        style={{
          backgroundColor: "var(--color-warm-gray-50)",
          borderColor: "var(--color-warm-gray-200)",
          color: "var(--color-text-secondary)",
        }}
      >
        <span
          className="inline-flex items-center justify-center rounded-lg p-1"
          style={{
            backgroundColor: choice
              ? "rgba(22, 163, 74, 0.10)"
              : "rgba(239, 68, 68, 0.10)",
            color: choice ? "#15803d" : "#dc2626",
          }}
        >
          {choice ? (
            <ThumbsUp size={16} weight="fill" />
          ) : (
            <ThumbsDown size={16} weight="fill" />
          )}
        </span>
        Thanks for your feedback!
      </div>
    );
  }

  return (
    <div
      className="flex items-center justify-center gap-4 rounded-xl border px-5 py-4"
      style={{
        backgroundColor: "var(--color-warm-gray-50)",
        borderColor: "var(--color-warm-gray-200)",
      }}
    >
      <span
        className="text-sm font-medium"
        style={{ color: "var(--color-text-secondary)" }}
      >
        Was this helpful?
      </span>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => vote(true)}
          disabled={state === "submitting"}
          className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors duration-150 hover:bg-[rgba(22,163,74,0.06)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--color-brand)] active:scale-[0.97] disabled:opacity-50"
          style={{
            backgroundColor: "var(--color-white)",
            borderColor: "var(--color-warm-gray-200)",
            color: "var(--color-text-secondary)",
          }}
          aria-label="Yes, this was helpful"
        >
          <ThumbsUp size={16} weight="duotone" />
          Yes
        </button>

        <button
          type="button"
          onClick={() => vote(false)}
          disabled={state === "submitting"}
          className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors duration-150 hover:bg-[rgba(239,68,68,0.04)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--color-brand)] active:scale-[0.97] disabled:opacity-50"
          style={{
            backgroundColor: "var(--color-white)",
            borderColor: "var(--color-warm-gray-200)",
            color: "var(--color-text-secondary)",
          }}
          aria-label="No, this was not helpful"
        >
          <ThumbsDown size={16} weight="duotone" />
          No
        </button>
      </div>
    </div>
  );
}
