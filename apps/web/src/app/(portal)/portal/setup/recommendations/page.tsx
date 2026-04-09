import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { StepShell } from "@/components/portal/setup/StepShell";
import { RecommendationsForm } from "./RecommendationsForm";

export const metadata: Metadata = { title: "Local Recommendations" };
export const dynamic = "force-dynamic";

type Spot = { name: string; why: string; address: string };

export default async function RecommendationsPage({
  searchParams,
}: {
  searchParams?: Promise<{ property?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const params = await searchParams;
  const propertyId = params?.property ?? null;

  let property = null;
  if (propertyId) {
    const { data } = await supabase
      .from("properties")
      .select("id, guidebook_spots, updated_at")
      .eq("id", propertyId)
      .single();
    property = data;
  }

  const savedSpots =
    property?.guidebook_spots && Array.isArray(property.guidebook_spots)
      ? (property.guidebook_spots as Spot[])
      : [];

  return (
    <StepShell
      track="property"
      stepNumber={9}
      title="Local recommendations"
      whyWeAsk="A short guidebook with your favorite nearby spots makes the guest experience feel personal and curated."
      estimateMinutes={5}
      lastUpdated={property?.updated_at}
    >
      <RecommendationsForm
        propertyId={property?.id ?? ""}
        savedSpots={savedSpots}
        isEditing={savedSpots.length > 0}
      />
    </StepShell>
  );
}
