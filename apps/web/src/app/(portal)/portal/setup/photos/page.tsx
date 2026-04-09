import type { Metadata } from "next";
import { StepShell } from "@/components/portal/setup/StepShell";
import { PhotosForm } from "./PhotosForm";

export const metadata: Metadata = { title: "Photos" };

export default function PhotosPage() {
  return (
    <StepShell
      track="property"
      stepNumber={11}
      title="Photos"
      whyWeAsk="Great photos are the single biggest factor in booking conversions. Upload your best shots or we can arrange professional photography."
      estimateMinutes={5}
    >
      <PhotosForm />
    </StepShell>
  );
}
