import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { StepShell } from "@/components/portal/setup/StepShell";
import { AmenitiesForm } from "./AmenitiesForm";

export const metadata: Metadata = { title: "Amenities" };
export const dynamic = "force-dynamic";

export default async function AmenitiesPage({
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
      .select("id, amenities, updated_at")
      .eq("id", propertyId)
      .single();
    property = data;
  }

  const savedAmenities =
    property?.amenities && Array.isArray(property.amenities)
      ? (property.amenities as string[])
      : [];

  return (
    <StepShell
      track="property"
      stepNumber={5}
      title="Amenities"
      whyWeAsk="Guests filter by amenities when searching. The more accurate your list, the better your search placement."
      estimateMinutes={5}
      lastUpdated={property?.updated_at}
    >
      <AmenitiesForm
        propertyId={property?.id ?? ""}
        savedAmenities={savedAmenities}
        isEditing={savedAmenities.length > 0}
      />
    </StepShell>
  );
}
