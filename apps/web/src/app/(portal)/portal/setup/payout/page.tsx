import type { Metadata } from "next";
import { StepShell } from "@/components/portal/setup/StepShell";
import { PayoutForm } from "./PayoutForm";

export const metadata: Metadata = { title: "Payout Method" };

export default function PayoutPage() {
  return (
    <StepShell
      track="owner"
      stepNumber={4}
      title="Payout method"
      whyWeAsk="Tell us where to send your earnings. Choose ACH direct deposit or card authorization."
      estimateMinutes={5}
    >
      <PayoutForm />
    </StepShell>
  );
}
