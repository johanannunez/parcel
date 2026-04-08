import type { Metadata } from "next";
import { PageHeader } from "@/components/portal/PageHeader";
import { AddPropertyWizard } from "./AddPropertyWizard";

export const metadata: Metadata = { title: "Add a property" };

export default function AddPropertyPage() {
  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        eyebrow="Onboarding"
        title="Add a property"
        description="Four quick steps. Details you can skip now, you can always fill in later from the property page."
      />
      <AddPropertyWizard />
    </div>
  );
}
