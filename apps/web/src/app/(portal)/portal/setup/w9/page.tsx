import type { Metadata } from "next";
import { StepShell } from "@/components/portal/setup/StepShell";
import { SigningStep } from "@/components/portal/setup/SigningStep";

export const metadata: Metadata = { title: "Tax Form (W-9)" };

export default function W9Page() {
  // BoldSign signing URL would be generated server-side when BOLDSIGN_API_KEY
  // is set and the signed_documents table exists. For now, show coming soon.
  const signUrl: string | null = null;

  return (
    <StepShell
      track="owner"
      stepNumber={3}
      title="Tax form (W-9)"
      whyWeAsk="The IRS requires a W-9 from anyone we send more than $600 in a year. We file a 1099 on your behalf."
      estimateMinutes={5}
    >
      <SigningStep
        signUrl={signUrl}
        summaryTitle="W-9 Form"
        summaryPoints={[
          "Required before your first payout",
          "We use it to file a 1099 each year",
          "Your tax ID is encrypted and stored securely",
          "Takes about 2 minutes to complete",
        ]}
      />
    </StepShell>
  );
}
