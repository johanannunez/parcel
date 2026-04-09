import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { BasicsForm, type BasicsInitial } from "./BasicsForm";

export const metadata: Metadata = {
  title: "Property basics",
};

export const dynamic = "force-dynamic";

export default async function SetupBasicsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Work on the first (or only) property for now. Multi property setup
  // gets a picker in a later slice.
  const { data: property } = await supabase
    .from("properties")
    .select(
      "id, name, property_type, address_line1, address_line2, city, state, postal_code, country, bedrooms, bathrooms, square_feet, guest_capacity",
    )
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const initial: BasicsInitial = {
    property_id: property?.id ?? "",
    name: property?.name ?? "",
    property_type: (property?.property_type ?? "") as BasicsInitial["property_type"],
    address_line1: property?.address_line1 ?? "",
    address_line2: property?.address_line2 ?? "",
    city: property?.city ?? "",
    state: property?.state ?? "",
    postal_code: property?.postal_code ?? "",
    country: property?.country ?? "US",
    bedrooms:
      property?.bedrooms !== null && property?.bedrooms !== undefined
        ? String(property.bedrooms)
        : "",
    bathrooms:
      property?.bathrooms !== null && property?.bathrooms !== undefined
        ? String(property.bathrooms)
        : "",
    square_feet:
      property?.square_feet !== null && property?.square_feet !== undefined
        ? String(property.square_feet)
        : "",
    guest_capacity:
      property?.guest_capacity !== null &&
      property?.guest_capacity !== undefined
        ? String(property.guest_capacity)
        : "",
  };

  const isEditing = Boolean(property);

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-4">
        <Link
          href="/portal/setup"
          className="inline-flex w-fit items-center gap-1.5 text-[13px] font-medium transition-colors"
          style={{ color: "var(--color-text-secondary)" }}
        >
          <ArrowLeft size={14} weight="bold" />
          Back to setup
        </Link>
        <div>
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            Track 01 · Step 01
          </p>
          <h1
            className="mt-2 text-[34px] font-semibold leading-tight tracking-tight"
            style={{ color: "var(--color-text-primary)" }}
          >
            Property basics
          </h1>
          <p
            className="mt-2 max-w-2xl text-base"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {isEditing
              ? "Update any detail that has changed. Changes save to your property record instantly."
              : "Tell us about the home. Nothing fancy, just the facts guests need and that we use to list it."}
          </p>
        </div>
      </header>

      <BasicsForm initial={initial} isEditing={isEditing} />
    </div>
  );
}
