import type { Metadata } from "next";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/service";
import { IntakePage } from "./IntakePage";

export const metadata: Metadata = {
  title: "New from Alcove | Help Center | Admin",
};

export default async function HelpIntakePage() {
  const service = createServiceClient();

  const { data: categories } = await service
    .from("help_categories")
    .select("id, name, slug")
    .order("sort_order", { ascending: true });

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10 lg:px-10 lg:py-14">
      <div className="flex flex-col gap-8">
        <div>
          <Link
            href="/admin/help"
            className="text-sm font-medium transition-colors"
            style={{ color: "var(--color-brand)" }}
          >
            &larr; Back to Help Center
          </Link>
          <h1
            className="mt-3 text-3xl font-semibold tracking-tight"
            style={{ color: "var(--color-text-primary)" }}
          >
            New from Alcove
          </h1>
          <p
            className="mt-2 text-sm"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Paste the output from the FAQ Article Drafter prompt, review the parsed fields, then publish.
          </p>
        </div>

        <IntakePage categories={categories ?? []} />
      </div>
    </div>
  );
}
