import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { StepShell } from "@/components/portal/setup/StepShell";
import { FileText, Clock } from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = { title: "Tax Form (W-9)" };
export const dynamic = "force-dynamic";

export default async function W9Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  return (
    <StepShell
      track="owner"
      stepNumber={3}
      title="Tax form (W-9)"
      whyWeAsk="The IRS requires a W-9 from anyone we send more than $600 in a year. We file a 1099 on your behalf."
      estimateMinutes={5}
    >
      <div
        className="flex flex-col items-center gap-4 rounded-2xl border p-10"
        style={{
          borderColor: "var(--color-warm-gray-200)",
          backgroundColor: "var(--color-white)",
        }}
      >
        <div
          className="flex h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: "rgba(2, 170, 235, 0.08)" }}
        >
          <FileText size={28} weight="duotone" style={{ color: "var(--color-brand)" }} />
        </div>
        <h2
          className="text-lg font-semibold tracking-tight"
          style={{ color: "var(--color-text-primary)" }}
        >
          W-9 collected during kickoff
        </h2>
        <p
          className="max-w-md text-center text-sm leading-relaxed"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Your W-9 will be collected during the kickoff call or via a secure
          link. This step will be marked complete by The Parcel Company once
          we have your form on file.
        </p>
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-1.5"
          style={{ backgroundColor: "var(--color-warm-gray-50)" }}
        >
          <Clock size={14} weight="bold" style={{ color: "var(--color-text-tertiary)" }} />
          <span className="text-xs font-medium" style={{ color: "var(--color-text-tertiary)" }}>
            Coming soon
          </span>
        </div>
      </div>
    </StepShell>
  );
}
