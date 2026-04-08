import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ResetPasswordForm } from "./ResetPasswordForm";

export const metadata: Metadata = {
  title: "Choose a new password",
};

export default async function ResetPasswordPage() {
  // The /auth/callback handler has already exchanged the reset link
  // for a session. If no session exists here, the user either landed
  // on this URL directly or the link expired.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/forgot-password?expired=1");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-off-white)] px-6 py-24">
      <div className="w-full max-w-md">
        <h1
          className="mb-2 text-3xl font-semibold tracking-tight"
          style={{ color: "var(--color-text-primary)" }}
        >
          Choose a new password
        </h1>
        <p
          className="mb-10 text-sm"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Pick something at least 8 characters long. After you save, we
          will take you straight to your dashboard.
        </p>

        <ResetPasswordForm />

        <p
          className="mt-8 text-center text-sm"
          style={{ color: "var(--color-text-secondary)" }}
        >
          <Link
            href="/login"
            className="font-medium underline-offset-4 hover:underline"
            style={{ color: "var(--color-brand)" }}
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
