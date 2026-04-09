import type { Metadata } from "next";
import { StepShell } from "@/components/portal/setup/StepShell";
import { SigningStep } from "@/components/portal/setup/SigningStep";

export const metadata: Metadata = { title: "Host Agreement Signing" };

export default function HostAgreementPage() {
  // BoldSign URL will be generated server-side when BOLDSIGN_API_KEY is set.
  const signUrl: string | null = null;

  return (
    <StepShell
      track="property"
      stepNumber={13}
      title="Host agreement signing"
      whyWeAsk="This is the official management agreement between you and The Parcel Company. It covers terms, responsibilities, and commission."
      estimateMinutes={5}
    >
      <SigningStep
        signUrl={signUrl}
        summaryTitle="Host Rental Agreement"
        summaryPoints={[
          "Covers management terms and responsibilities",
          "Sets the commission rate for your property",
          "Outlines the 30-day cancellation clause",
          "Legally binding once signed by both parties",
          "You will receive a signed copy via email",
        ]}
      />
    </StepShell>
  );
}
