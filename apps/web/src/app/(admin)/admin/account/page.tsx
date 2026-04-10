import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AccountNav } from "@/app/(portal)/portal/account/AccountNav";
import ProfileSection from "@/app/(portal)/portal/account/components/ProfileSection";
import SecuritySection from "@/app/(portal)/portal/account/components/SecuritySection";
import { SessionsSection } from "@/app/(portal)/portal/account/components/SessionsSection";
import { RegionSection } from "@/app/(portal)/portal/account/components/RegionSection";

export const metadata: Metadata = { title: "Admin Account" };
export const dynamic = "force-dynamic";

export default async function AdminAccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/portal/dashboard");
  }

  const profileData = {
    full_name: profile?.full_name ?? null,
    preferred_name: profile?.preferred_name ?? null,
    email: user.email ?? "",
    phone: profile?.phone ?? null,
    contact_method: profile?.contact_method ?? null,
    avatar_url: profile?.avatar_url ?? null,
    created_at: profile?.created_at ?? new Date().toISOString(),
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10 lg:px-10 lg:py-14">
      <div className="flex flex-col gap-8">
        {/* Header */}
        <header>
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            Admin settings
          </p>
          <h1
            className="mt-2 text-[34px] font-semibold leading-tight tracking-tight"
            style={{ color: "var(--color-text-primary)" }}
          >
            Account
          </h1>
          <p
            className="mt-2 max-w-2xl text-base"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Manage your admin profile and security settings.
          </p>
        </header>

        {/* Two-column layout */}
        <div className="flex gap-10">
          <AccountNav />

          <div className="flex min-w-0 flex-1 flex-col gap-12">
            <ProfileSection profile={profileData} />
            <SecuritySection userEmail={user.email ?? ""} />
            <SessionsSection />
            <RegionSection timezone={profile?.timezone ?? ""} />
          </div>
        </div>
      </div>
    </div>
  );
}
