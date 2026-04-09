import type { Metadata } from "next";
import { StepShell } from "@/components/portal/setup/StepShell";
import { FinancialForm } from "./FinancialForm";

export const metadata: Metadata = { title: "Financial Baseline" };

export default function FinancialPage() {
  return (
    <StepShell
      track="property"
      stepNumber={8}
      title="Financial baseline"
      whyWeAsk="Understanding your income goals and readiness helps us set the right pricing strategy and timeline."
      estimateMinutes={3}
    >
      <FinancialForm />
    </StepShell>
  );
}
