import type { Metadata } from "next";
import { StepShell } from "@/components/portal/setup/StepShell";
import { RulesForm } from "./RulesForm";

export const metadata: Metadata = { title: "House Rules and Access" };

export default function RulesPage() {
  return (
    <StepShell
      track="property"
      stepNumber={6}
      title="House rules and access"
      whyWeAsk="Clear rules prevent misunderstandings and protect your property. Access instructions help us coordinate smooth check-ins."
      estimateMinutes={4}
    >
      <RulesForm />
    </StepShell>
  );
}
