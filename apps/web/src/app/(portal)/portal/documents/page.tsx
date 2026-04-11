import type { Metadata } from "next";
import {
  FileText,
  DownloadSimple,
  Buildings,
} from "@phosphor-icons/react/dist/ssr";
import { getPortalContext } from "@/lib/portal-context";
import { EmptyState } from "@/components/portal/EmptyState";
import { formatMedium } from "@/lib/format";

export const metadata: Metadata = { title: "Documents" };
export const dynamic = "force-dynamic";

const DOC_TYPE_LABELS: Record<string, string> = {
  w9: "W-9",
  ach_authorization: "ACH Authorization",
  debit_card_auth: "Debit Card Authorization",
  host_agreement: "Host Agreement",
  insurance: "Insurance",
  identity_verification: "Identity Verification",
  tax_form: "Tax Form",
  lease: "Lease",
  compliance: "Compliance",
  other: "Other",
};

const STATUS_STYLES: Record<string, { bg: string; fg: string; label: string }> = {
  pending: { bg: "rgba(245, 158, 11, 0.14)", fg: "#b45309", label: "Pending" },
  signed: { bg: "rgba(22, 163, 74, 0.12)", fg: "#15803d", label: "Signed" },
  uploaded: { bg: "rgba(2, 170, 235, 0.12)", fg: "#0c6fae", label: "Uploaded" },
  expired: { bg: "rgba(220, 38, 38, 0.12)", fg: "#b91c1c", label: "Expired" },
};

type DocumentRow = {
  id: string;
  title: string;
  doc_type: string;
  status: string;
  scope: string;
  file_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export default async function DocumentsPage() {
  const { userId, client } = await getPortalContext();

  const { data: properties } = await client
    .from("properties")
    .select("id, name, address_line1, city")
    .eq("owner_id", userId);

  // Documents tables may not exist yet (pending migration)
  let documents: DocumentRow[] = [];
  let docProperties: Array<{ document_id: string; property_id: string }> = [];
  const propertyIds = (properties ?? []).map((p) => p.id);
  try {
    const [docsResult, dpResult] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (client as any)
        .from("documents")
        .select("id, title, doc_type, status, scope, file_url, notes, created_at, updated_at")
        .eq("owner_id", userId)
        .order("created_at", { ascending: false }),
      propertyIds.length > 0
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? (client as any)
            .from("document_properties")
            .select("document_id, property_id")
            .in("property_id", propertyIds)
        : Promise.resolve({ data: [] }),
    ]);
    documents = docsResult.data ?? [];
    docProperties = dpResult.data ?? [];
  } catch {
    // tables don't exist yet
  }

  const rows = (documents ?? []) as DocumentRow[];
  const propertyNameById = new Map(
    (properties ?? []).map((p) => [
      p.id,
      p.name?.trim() || p.address_line1 || p.city || "Property",
    ]),
  );

  // Build property scope map
  const docPropertyMap = new Map<string, string[]>();
  for (const dp of docProperties ?? []) {
    const list = docPropertyMap.get(dp.document_id) ?? [];
    list.push(dp.property_id);
    docPropertyMap.set(dp.document_id, list);
  }

  // Group by doc_type
  const grouped = new Map<string, DocumentRow[]>();
  for (const doc of rows) {
    const list = grouped.get(doc.doc_type) ?? [];
    list.push(doc);
    grouped.set(doc.doc_type, list);
  }

  // Sort groups by predefined order
  const typeOrder = Object.keys(DOC_TYPE_LABELS);
  const sortedGroups = [...grouped.entries()].sort(
    (a, b) => typeOrder.indexOf(a[0]) - typeOrder.indexOf(b[0]),
  );

  const pendingCount = rows.filter((r) => r.status === "pending").length;

  return (
    <div className="flex flex-col gap-10">
      {/* Summary strip */}
      {rows.length > 0 ? (
        <div className="flex flex-wrap items-center gap-3">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
            style={{
              backgroundColor: "var(--color-warm-gray-100)",
              color: "var(--color-text-secondary)",
            }}
          >
            {rows.length} {rows.length === 1 ? "document" : "documents"} on file
          </span>
          {pendingCount > 0 ? (
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
              style={{
                backgroundColor: "rgba(245, 158, 11, 0.14)",
                color: "#b45309",
              }}
            >
              {pendingCount} pending your action
            </span>
          ) : null}
        </div>
      ) : null}

      {rows.length === 0 ? (
        <EmptyState
          icon={<FileText size={26} weight="duotone" />}
          title="No documents yet"
          body="Once Parcel adds documents to your account (W-9, host agreement, insurance, etc.), they will appear here. You will be able to view, download, and track their status."
        />
      ) : (
        <div className="flex flex-col gap-8">
          {sortedGroups.map(([docType, docs]) => (
            <section key={docType}>
              <h2
                className="mb-3 text-sm font-semibold uppercase tracking-[0.12em]"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                {DOC_TYPE_LABELS[docType] ?? docType}
              </h2>

              <div className="flex flex-col gap-3">
                {docs.map((doc) => {
                  const statusStyle =
                    STATUS_STYLES[doc.status] ?? STATUS_STYLES.pending;
                  const scopePropertyIds = docPropertyMap.get(doc.id) ?? [];
                  const isAllProperties =
                    doc.scope === "all" || scopePropertyIds.length === 0;

                  return (
                    <div
                      key={doc.id}
                      className="flex items-center gap-4 rounded-2xl border p-5 transition-colors"
                      style={{
                        backgroundColor: "var(--color-white)",
                        borderColor: "var(--color-warm-gray-200)",
                      }}
                    >
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                        style={{
                          backgroundColor: "var(--color-warm-gray-100)",
                          color: "var(--color-text-primary)",
                        }}
                      >
                        <FileText size={18} weight="duotone" />
                      </span>

                      <div className="min-w-0 flex-1">
                        <div
                          className="truncate text-sm font-semibold"
                          style={{ color: "var(--color-text-primary)" }}
                        >
                          {doc.title}
                        </div>
                        <div
                          className="mt-1 flex flex-wrap items-center gap-2 text-xs"
                          style={{ color: "var(--color-text-secondary)" }}
                        >
                          <span>{formatMedium(doc.created_at)}</span>
                          <span
                            style={{ color: "var(--color-warm-gray-200)" }}
                          >
                            |
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Buildings size={12} weight="duotone" />
                            {isAllProperties
                              ? "All properties"
                              : scopePropertyIds
                                  .map(
                                    (pid) =>
                                      propertyNameById.get(pid) ?? "Property",
                                  )
                                  .join(", ")}
                          </span>
                        </div>
                      </div>

                      <span
                        className="inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                        style={{
                          backgroundColor: statusStyle.bg,
                          color: statusStyle.fg,
                        }}
                      >
                        {statusStyle.label}
                      </span>

                      {doc.file_url ? (
                        <a
                          href={doc.file_url}
                          download
                          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors hover:bg-[var(--color-warm-gray-50)]"
                          style={{
                            borderColor: "var(--color-warm-gray-200)",
                            color: "var(--color-text-secondary)",
                          }}
                          aria-label={`Download ${doc.title}`}
                        >
                          <DownloadSimple size={16} weight="bold" />
                        </a>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
