import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { StepShell } from "@/components/portal/setup/StepShell";
import { AccountForm } from "./AccountForm";

export const metadata: Metadata = { title: "Your Account" };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, updated_at")
    .eq("id", user.id)
    .single();

  const isEditing = Boolean(profile?.full_name);

  return (
    <StepShell
      track="owner"
      stepNumber={1}
      title="Your account"
      whyWeAsk="We need your name, phone, and mailing address to send payouts, tax documents, and any important mail."
      estimateMinutes={2}
      lastUpdated={isEditing ? profile?.updated_at : null}
    >
      <AccountForm
        initial={{
          full_name: profile?.full_name ?? "",
          phone: "",
          street: "",
          city: "",
          state: "",
          zip: "",
        }}
        isEditing={isEditing}
      />
    </StepShell>
  );
}
