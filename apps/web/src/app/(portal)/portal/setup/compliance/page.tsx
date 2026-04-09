import type { Metadata } from "next";
import { StepShell } from "@/components/portal/setup/StepShell";
import { ComplianceForm } from "./ComplianceForm";

export const metadata: Metadata = { title: "Compliance" };

export default function CompliancePage() {
  return (
    <StepShell
      track="property"
      stepNumber={12}
      title="Compliance"
      whyWeAsk="Some cities require permits or HOA approval for short-term rentals. We need to know what applies to your property."
      estimateMinutes={3}
    >
      <ComplianceForm />
    </StepShell>
  );
}
