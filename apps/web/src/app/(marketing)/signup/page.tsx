import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "./SignupForm";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Create a Parcel owner account to manage your properties.",
};

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-off-white)] px-6 py-24">
      <div className="w-full max-w-md">
        <h1
          className="mb-2 text-3xl font-semibold tracking-tight"
          style={{ color: "var(--color-text-primary)" }}
        >
          Create your account
        </h1>
        <p
          className="mb-10 text-sm"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Start managing your properties with Parcel.
        </p>

        <SignupForm />

        <p
          className="mt-8 text-center text-sm"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium underline-offset-4 hover:underline"
            style={{ color: "var(--color-brand)" }}
          >
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
