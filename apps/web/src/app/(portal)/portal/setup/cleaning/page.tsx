import type { Metadata } from "next";
import { StepShell } from "@/components/portal/setup/StepShell";
import { CleaningForm } from "./CleaningForm";

export const metadata: Metadata = { title: "Your Cleaning Team" };

export default function CleaningPage() {
  return (
    <StepShell
      track="property"
      stepNumber={10}
      title="Your cleaning team"
      whyWeAsk="Turnovers are the backbone of short-term rentals. We need to know if you have a cleaner or if we should handle it."
      estimateMinutes={3}
    >
      <CleaningForm />
    </StepShell>
  );
}
