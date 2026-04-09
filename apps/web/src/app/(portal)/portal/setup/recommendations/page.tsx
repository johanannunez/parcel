import type { Metadata } from "next";
import { StepShell } from "@/components/portal/setup/StepShell";
import { RecommendationsForm } from "./RecommendationsForm";

export const metadata: Metadata = { title: "Local Recommendations" };

export default function RecommendationsPage() {
  return (
    <StepShell
      track="property"
      stepNumber={9}
      title="Local recommendations"
      whyWeAsk="A short guidebook with your favorite nearby spots makes the guest experience feel personal and curated."
      estimateMinutes={5}
    >
      <RecommendationsForm />
    </StepShell>
  );
}
