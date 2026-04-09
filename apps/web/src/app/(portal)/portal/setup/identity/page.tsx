import type { Metadata } from "next";
import { StepShell } from "@/components/portal/setup/StepShell";
import { IdentityForm } from "./IdentityForm";

export const metadata: Metadata = { title: "Identity Verification" };

export default function IdentityPage() {
  return (
    <StepShell
      track="owner"
      stepNumber={2}
      title="Identity verification"
      whyWeAsk="Verifying your identity protects both you and your guests. Required for compliance with short-term rental regulations."
      estimateMinutes={3}
    >
      <IdentityForm />
    </StepShell>
  );
}
