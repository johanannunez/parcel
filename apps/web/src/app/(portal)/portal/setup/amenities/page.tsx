import type { Metadata } from "next";
import { StepShell } from "@/components/portal/setup/StepShell";
import { AmenitiesForm } from "./AmenitiesForm";

export const metadata: Metadata = { title: "Amenities" };

export default function AmenitiesPage() {
  return (
    <StepShell
      track="property"
      stepNumber={5}
      title="Amenities"
      whyWeAsk="Guests filter by amenities when searching. The more accurate your list, the better your search placement."
      estimateMinutes={5}
    >
      <AmenitiesForm />
    </StepShell>
  );
}
