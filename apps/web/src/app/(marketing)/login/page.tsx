import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to your Parcel owner portal.",
};

type SearchParams = Promise<{ redirect?: string }>;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { redirect } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-off-white)] px-6 py-24">
      <div className="w-full max-w-md">
        <h1
          className="mb-2 text-3xl font-semibold tracking-tight"
          style={{ color: "var(--color-text-primary)" }}
        >
          Welcome back
        </h1>
        <p
          className="mb-10 text-sm"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Log in to your Parcel owner portal to manage your properties.
        </p>

        <LoginForm redirectTo={redirect ?? "/portal/dashboard"} />

        <p
          className="mt-8 text-center text-sm"
          style={{ color: "var(--color-text-secondary)" }}
        >
          New to Parcel?{" "}
          <Link
            href="/signup"
            className="font-medium underline-offset-4 hover:underline"
            style={{ color: "var(--color-brand)" }}
          >
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
